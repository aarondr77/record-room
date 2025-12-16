import { useState, useEffect } from 'react'
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

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Our Shared Songs Player',
        getOAuthToken: cb => { cb(accessToken); },
        volume: 0.5
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      player.connect();
      setPlayer(player);
    };

    return () => {
      if (player) {
        player.disconnect();
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

  const handlePlayTrack = async (trackUri) => {
    if (!deviceId) {
      alert('Player not ready yet. Please wait a moment and try again.');
      return;
    }

    try {
      await playTrack(accessToken, trackUri, deviceId);
    } catch (err) {
      console.error('Error playing track:', err);
      alert('Error playing track. Make sure Spotify is not playing on another device.');
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
      </header>

      <main>
        <div className="playlist">
          {playlist.tracks.items.map((item, index) => (
            <div key={index} className="track-card">
              <img
                src={item.track.album.images[0]?.url}
                alt={item.track.name}
                className="album-art"
              />
              <div className="track-info">
                <h3>{item.track.name}</h3>
                <p>{item.track.artists.map(a => a.name).join(', ')}</p>
              </div>
              <button
                className="play-btn"
                onClick={() => handlePlayTrack(item.track.uri)}
              >
                ▶
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
