import { useState, useEffect, useRef } from 'react'
import './App.css'
import { getAuthUrl, getAccessTokenFromUrl, fetchPlaylist, playTrack, fetchUserPlaylists, searchPlaylists, tryAccessPlaylist } from './spotify'

function App() {
  const [accessToken, setAccessToken] = useState(null)
  const [playlist, setPlaylist] = useState(null)
  const [player, setPlayer] = useState(null)
  const [deviceId, setDeviceId] = useState(null)
  const [playlistError, setPlaylistError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [playerReady, setPlayerReady] = useState(false)
  const isStartingPlayback = useRef(false)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we're on the callback route with a code
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        
        if (error) {
          console.error('OAuth error:', error);
          alert(`Spotify authentication failed: ${error}. Please try again.`);
          // Clean up URL
          window.history.replaceState({}, document.title, '/');
          return;
        }
        
        if (code) {
          console.log('Found authorization code, exchanging for token...');
          const token = await getAccessTokenFromUrl();
          if (token) {
            console.log('Token exchange successful');
            setAccessToken(token);
            localStorage.setItem('spotify_access_token', token);
            // Clean up URL - redirect to home
            window.history.replaceState({}, document.title, '/');
          } else {
            throw new Error('Token exchange returned no token');
          }
        } else {
          // No code in URL, check for saved token
          const savedToken = localStorage.getItem('spotify_access_token');
          if (savedToken) {
            console.log('Using saved token');
            setAccessToken(savedToken);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        alert(`Authentication error: ${error.message}. Please try connecting again.`);
        // Clear any invalid tokens
        localStorage.removeItem('spotify_access_token');
        sessionStorage.removeItem('code_verifier');
        // Clean up URL
        window.history.replaceState({}, document.title, '/');
      }
    };
    
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    setPlaylistError(null); // Clear any previous errors
    
    fetchPlaylist(accessToken)
      .then(data => {
        console.log('Playlist data:', data);
        setPlaylist(data);
        setPlaylistError(null);
      })
      .catch(err => {
        console.error('Error fetching playlist:', err);
        setPlaylistError(err.message || 'Failed to load playlist');
        
        // Clear token if it's an authentication error
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('spotify_access_token');
          setAccessToken(null);
        }
      });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    // Check if SDK is already loaded
    if (window.Spotify) {
      initializePlayer();
    } else {
      // Load the SDK script
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = () => {
        initializePlayer();
      };
    }

    function initializePlayer() {
      const newPlayer = new window.Spotify.Player({
        name: 'Our Shared Songs Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      newPlayer.addListener('ready', ({ device_id }) => {
        console.log('Web Playback SDK ready with Device ID:', device_id);
        setDeviceId(device_id);
        setPlayerReady(true);
      });

      newPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
        setPlayerReady(false);
      });

      newPlayer.addListener('player_state_changed', (state) => {
        console.log('Player state changed event:', state ? { paused: state.paused, track: state.track_window?.current_track?.name } : null);
        
        if (!state) {
          console.log('Player state is null');
          // If we're starting playback, let handlePlayTrack manage the state
          if (isStartingPlayback.current) {
            console.log('State is null but playback is starting - letting handlePlayTrack manage');
            return;
          }
          // Only reset if we're not starting playback
          setIsPlaying(false);
          return;
        }

        const isCurrentlyPlaying = !state.paused;
        const track = state.track_window?.current_track;
        
        // If we're starting playback and track is paused, let handlePlayTrack handle the resume
        if (isStartingPlayback.current && !isCurrentlyPlaying) {
          console.log('Starting playback but paused - letting handlePlayTrack handle resume');
          // Still update the track info for UI
          if (track) {
            setCurrentTrack(track);
          }
          return;
        }
        
        // Update state
        setIsPlaying(isCurrentlyPlaying);
        if (track) {
          setCurrentTrack(track);
          console.log('Player state updated:', {
            playing: isCurrentlyPlaying,
            track: track.name,
            trackUri: track.uri
          });
          // If we're now playing, clear the starting flag
          if (isCurrentlyPlaying) {
            isStartingPlayback.current = false;
          }
        } else if (isCurrentlyPlaying) {
          // If playing but no track info, keep current track
          console.log('Playing but no track info - keeping current track');
          isStartingPlayback.current = false;
        }
      });

      newPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
        alert('Failed to authenticate with Spotify Web Playback SDK. Please reconnect.');
      });

      newPlayer.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        alert('Account error with Spotify Web Playback SDK. Please check your Spotify Premium status.');
      });

      newPlayer.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message);
        alert(`Playback error: ${message}`);
      });

      newPlayer.connect().then(success => {
        if (success) {
          console.log('Successfully connected to Spotify Web Playback SDK');
        } else {
          console.error('Failed to connect to Spotify Web Playback SDK');
        }
      });

      setPlayer(newPlayer);
    }

    return () => {
      if (player) {
        player.disconnect();
        setPlayerReady(false);
      }
    };
  }, [accessToken]);

  const handleLogin = async () => {
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      alert('Error connecting to Spotify. Please try again.');
    }
  };

  const handlePlayTrack = async (trackUri, trackInfo) => {
    if (!deviceId || !playerReady || !player) {
      alert('Player not ready yet. Please wait a moment and try again.');
      return;
    }

    try {
      console.log('Playing track:', trackUri, trackInfo);
      
      // Set flag that we're starting playback
      isStartingPlayback.current = true;
      
      // CRITICAL: Activate the audio element first to satisfy browser autoplay policy
      // This must happen in response to a user gesture (which we're in - the click handler)
      try {
        await player.activateElement();
        console.log('Player element activated');
      } catch (activateErr) {
        console.warn('Could not activate element (may already be active):', activateErr);
      }
      
      // Set the current track immediately for UI feedback
      if (trackInfo) {
        setCurrentTrack({
          uri: trackUri,
          name: trackInfo.name,
          artists: trackInfo.artists,
          album: trackInfo.album
        });
        setIsPlaying(true);
      }
      
      // First, ensure the device is active by transferring playback
      try {
        const transferResponse = await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: true  // Request to start playing immediately
          })
        });

        if (transferResponse.status === 404) {
          console.log('No active device found, starting playback on web player');
        } else if (!transferResponse.ok && transferResponse.status !== 204) {
          const errorText = await transferResponse.text();
          console.warn('Transfer playback warning:', errorText);
        } else {
          console.log('Device transfer successful');
        }
      } catch (transferErr) {
        console.warn('Transfer playback error (continuing anyway):', transferErr);
      }

      // Wait a bit for device to be ready
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use the REST API to start playback
      const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: 0
        })
      });

      if (!playResponse.ok && playResponse.status !== 204) {
        const errorText = await playResponse.text();
        console.error('Play API error:', playResponse.status, errorText);
        throw new Error(`Failed to start playback: ${playResponse.status} - ${errorText}`);
      }
      
      console.log('Track playback API call successful');
      
      // Helper function to ensure playback is actually running
      const ensurePlayback = async (attempt = 1, maxAttempts = 5) => {
        if (attempt > maxAttempts) {
          console.log('Max resume attempts reached');
          isStartingPlayback.current = false;
          return;
        }
        
        try {
          const state = await player.getCurrentState();
          console.log(`Playback check attempt ${attempt}:`, state ? { paused: state.paused, track: state.track_window?.current_track?.name } : 'no state');
          
          if (!state) {
            // No state yet, wait and retry
            setTimeout(() => ensurePlayback(attempt + 1, maxAttempts), 300);
            return;
          }
          
          if (state.paused) {
            console.log(`Attempt ${attempt}: Track is paused, calling resume...`);
            await player.resume();
            // Check again after resume
            setTimeout(() => ensurePlayback(attempt + 1, maxAttempts), 300);
          } else {
            // Playing successfully!
            console.log('Playback confirmed - track is playing');
            setIsPlaying(true);
            if (state.track_window?.current_track) {
              setCurrentTrack(state.track_window.current_track);
            }
            isStartingPlayback.current = false;
          }
        } catch (err) {
          console.warn(`Playback check error on attempt ${attempt}:`, err);
          setTimeout(() => ensurePlayback(attempt + 1, maxAttempts), 300);
        }
      };
      
      // Start checking playback state after a brief delay
      setTimeout(() => ensurePlayback(1, 5), 200);
      
    } catch (err) {
      console.error('Error playing track:', err);
      setIsPlaying(false);
      setCurrentTrack(null);
      isStartingPlayback.current = false;
      alert(`Error playing track: ${err.message}. Make sure you have Spotify Premium and the player is ready.`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !accessToken) return;
    
    setIsSearching(true);
    setSearchResults(null);
    
    try {
      const results = await searchPlaylists(accessToken, searchQuery);
      setSearchResults(results);
    } catch (err) {
      alert(`Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  if (!accessToken) {
    return (
      <div className="app">
        <header>
          <h1>Our Shared Songs 💕</h1>
          <p>A place for us to share and talk about our favorite music</p>
        </header>
        <main>
          <div className="placeholder">
            <button onClick={handleLogin}>Connect to Spotify</button>
          </div>
        </main>
      </div>
    );
  }

  if (!playlist && !playlistError) {
    return (
      <div className="app">
        <header>
          <h1>Our Shared Songs 💕</h1>
          <p>A place for us to share and talk about our favorite music</p>
        </header>
        <main>
          <div className="placeholder">
            <p>Loading playlist...</p>
          </div>
        </main>
      </div>
    );
  }

  if (playlistError) {
    return (
      <div className="app">
        <header>
          <h1>Our Shared Songs 💕</h1>
          <p>A place for us to share and talk about our favorite music</p>
        </header>
        <main>
          <div className="placeholder">
            <div style={{ color: '#ff4444', textAlign: 'center', padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
              <h2>Error Loading Playlist</h2>
              <p style={{ whiteSpace: 'pre-line', marginBottom: '20px' }}>{playlistError}</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    setPlaylistError(null);
                    // Retry fetching
                    if (accessToken) {
                      fetchPlaylist(accessToken)
                        .then(data => {
                          setPlaylist(data);
                          setPlaylistError(null);
                        })
                        .catch(err => {
                          setPlaylistError(err.message || 'Failed to load playlist');
                        });
                    }
                  }}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#1db954', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer' 
                  }}
                >
                  Retry
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const playlists = await fetchUserPlaylists(accessToken);
                      console.log('Your playlists:', playlists);
                      const playlistList = playlists.map(p => `- ${p.name} (ID: ${p.id})`).join('\n');
                      alert(`Your accessible playlists:\n\n${playlistList}\n\nCopy a playlist ID and update VITE_PLAYLIST_ID in your .env file.`);
                    } catch (err) {
                      alert(`Failed to fetch playlists: ${err.message}`);
                    }
                  }}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#1db954', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer' 
                  }}
                >
                  Show My Playlists
                </button>
              </div>
              <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '10px' }}>
                <h3 style={{ marginBottom: '15px' }}>Search for Your Blend Playlist</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for playlist name (e.g., 'Blend')"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        handleSearch();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                  <button
                    onClick={handleSearch}
                    disabled={!searchQuery.trim() || isSearching}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: isSearching ? '#ccc' : '#1db954',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: isSearching ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
                {searchResults && (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {searchResults.length === 0 ? (
                      <p>No playlists found. Try a different search term.</p>
                    ) : (
                      <div>
                        <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                          Found {searchResults.length} playlist(s):
                        </p>
                        {searchResults.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              padding: '10px',
                              marginBottom: '10px',
                              backgroundColor: 'white',
                              borderRadius: '5px',
                              border: '1px solid #ddd',
                              cursor: 'pointer'
                            }}
                            onClick={async () => {
                              try {
                                setPlaylistError(null);
                                const playlistData = await fetchPlaylist(accessToken, p.id);
                                setPlaylist(playlistData);
                                setSearchResults(null);
                                setSearchQuery('');
                              } catch (err) {
                                setPlaylistError(err.message || 'Failed to load playlist');
                              }
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                              ID: {p.id} • {p.tracks?.total || 0} tracks
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px', fontSize: '14px' }}>
                <strong>Tip:</strong> If your blend playlist doesn't appear in search, try:
                <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
                  <li>Make sure you're logged in with the account that has access to the blend</li>
                  <li>Try searching for "Blend" or part of the blend name</li>
                  <li>Check that the playlist ID in your .env file matches the one from the Spotify URL</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Our Shared Songs 💕</h1>
        <p>{playlist.name} ({playlist.tracks.items.length} tracks)</p>
        {!playerReady && (
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            ⚠️ Spotify Premium required for playback. Player initializing...
          </p>
        )}
      </header>

      <main>
        <div className="playlist">
          {playlist.tracks.items.map((item, index) => {
            // Compare URIs - handle both full URIs and just the track ID
            const trackUri = item.track.uri;
            const currentUri = currentTrack?.uri;
            const isCurrentlyPlaying = currentUri && (
              currentUri === trackUri || 
              currentUri.includes(trackUri.split(':')[2]) || 
              trackUri.includes(currentUri.split(':')[2])
            );
            const isThisTrackPlaying = isCurrentlyPlaying && isPlaying;
            
            return (
              <div 
                key={index} 
                className="track-card"
                style={{
                  backgroundColor: isThisTrackPlaying ? '#f0f0f0' : 'transparent',
                  border: isThisTrackPlaying ? '2px solid #1db954' : 'none'
                }}
              >
                <img
                  src={item.track.album.images[0]?.url}
                  alt={item.track.name}
                  className="album-art"
                />
                <div className="track-info">
                  <h3>{item.track.name}</h3>
                  <p>{item.track.artists.map(a => a.name).join(', ')}</p>
                  {isThisTrackPlaying && (
                    <p style={{ color: '#1db954', fontSize: '12px', marginTop: '5px' }}>
                      ● Now Playing
                    </p>
                  )}
                </div>
                <button
                  className="play-btn"
                  onClick={async () => {
                    if (isThisTrackPlaying && player) {
                      // If this track is playing, toggle pause/play
                      try {
                        await player.togglePlay();
                      } catch (err) {
                        console.error('Error toggling play:', err);
                      }
                    } else {
                      // Otherwise, play this track
                      await handlePlayTrack(item.track.uri, item.track);
                    }
                  }}
                  disabled={!playerReady}
                  style={{
                    opacity: playerReady ? 1 : 0.5,
                    cursor: playerReady ? 'pointer' : 'not-allowed'
                  }}
                >
                  {isThisTrackPlaying ? '⏸' : '▶'}
                </button>
              </div>
            );
          })}
        </div>
        {!playerReady && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            <p>Initializing player... Please wait a moment before playing tracks.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
