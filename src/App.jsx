import { useState, useEffect, useRef } from 'react'
import './App.css'
import { getAuthUrl, getAccessTokenFromUrl, fetchPlaylist } from './spotify'

function App() {
  const [accessToken, setAccessToken] = useState(null)
  const [playlist, setPlaylist] = useState(null)
  const [error, setError] = useState(null)
  const [player, setPlayer] = useState(null)
  const [deviceId, setDeviceId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const isExchangingToken = useRef(false)

  // Auth initialization
  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      
      if (urlParams.get('error')) {
        setError('Spotify authentication failed')
        window.history.replaceState({}, '', '/')
        return
      }
      
      if (code) {
        if (isExchangingToken.current) return
        isExchangingToken.current = true
        window.history.replaceState({}, '', '/')
        
        try {
          const token = await getAccessTokenFromUrl(code)
          if (token) {
            setAccessToken(token)
            localStorage.setItem('spotify_access_token', token)
          }
        } catch (err) {
          setError(err.message)
          localStorage.removeItem('spotify_access_token')
        }
      } else {
        const savedToken = localStorage.getItem('spotify_access_token')
        if (savedToken) setAccessToken(savedToken)
      }
    }
    initAuth()
  }, [])

  // Fetch playlist when authenticated
  useEffect(() => {
    if (!accessToken) return
    
    fetchPlaylist(accessToken)
      .then(setPlaylist)
      .catch(err => {
        setError(err.message)
        if (err.message.includes('401')) {
          localStorage.removeItem('spotify_access_token')
          setAccessToken(null)
        }
      })
  }, [accessToken])

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!accessToken) return

    const initPlayer = () => {
      const newPlayer = new window.Spotify.Player({
        name: 'Our Shared Songs',
        getOAuthToken: cb => cb(accessToken),
        volume: 0.5
      })

      newPlayer.addListener('ready', ({ device_id }) => setDeviceId(device_id))
      newPlayer.addListener('not_ready', () => setDeviceId(null))
      
      newPlayer.addListener('player_state_changed', state => {
        if (!state) {
          setIsPlaying(false)
          return
        }
        setIsPlaying(!state.paused)
        if (state.track_window?.current_track) {
          setCurrentTrack(state.track_window.current_track)
        }
      })

      newPlayer.addListener('authentication_error', () => setError('Spotify authentication failed'))
      newPlayer.addListener('account_error', () => setError('Spotify Premium required for playback'))

      newPlayer.connect()
      setPlayer(newPlayer)
    }

    if (window.Spotify) {
      initPlayer()
    } else {
      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)
      window.onSpotifyWebPlaybackSDKReady = initPlayer
    }

    return () => player?.disconnect()
  }, [accessToken])

  const handleLogin = async () => {
    const authUrl = await getAuthUrl()
    window.location.href = authUrl
  }

  const handlePlay = async (trackUri) => {
    if (!deviceId || !player) return

    try {
      await player.activateElement()
      
      // Transfer playback to this device and play
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ids: [deviceId], play: true })
      })

      // Start the track
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [trackUri], position_ms: 0 })
      })

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to play track')
      }

      // Ensure playback starts (browser autoplay workaround)
      setTimeout(async () => {
        const state = await player.getCurrentState()
        if (state?.paused) await player.resume()
      }, 500)

    } catch (err) {
      setError(`Playback error: ${err.message}`)
    }
  }

  // Login screen
  if (!accessToken) {
    return (
      <div className="app">
        <header>
          <h1>Our Shared Songs 💕</h1>
          <p>A place for us to share and talk about our favorite music</p>
        </header>
        <main>
          <div className="placeholder">
            {error && <p style={{ color: '#ff4444', marginBottom: '20px' }}>{error}</p>}
            <button onClick={handleLogin}>Connect to Spotify</button>
          </div>
        </main>
      </div>
    )
  }

  // Loading screen
  if (!playlist) {
    return (
      <div className="app">
        <header>
          <h1>Our Shared Songs 💕</h1>
        </header>
        <main>
          <div className="placeholder">
            {error ? (
              <>
                <p style={{ color: '#ff4444', marginBottom: '20px' }}>{error}</p>
                <button onClick={() => { setError(null); setAccessToken(null); localStorage.removeItem('spotify_access_token') }}>
                  Try Again
                </button>
              </>
            ) : (
              <p>Loading playlist...</p>
            )}
          </div>
        </main>
      </div>
    )
  }

  // Main playlist view
  const isTrackPlaying = (trackUri) => currentTrack?.uri === trackUri && isPlaying

  return (
    <div className="app">
      <header>
        <h1>Our Shared Songs 💕</h1>
        <p>{playlist.name} ({playlist.tracks.items.length} tracks)</p>
        {!deviceId && <p style={{ fontSize: '14px', color: '#666' }}>⚠️ Player initializing...</p>}
      </header>

      <main>
        <div className="playlist">
          {playlist.tracks.items.map((item, index) => (
            <div 
              key={index} 
              className="track-card"
              style={{
                backgroundColor: isTrackPlaying(item.track.uri) ? '#f0f0f0' : 'transparent',
                border: isTrackPlaying(item.track.uri) ? '2px solid #1db954' : 'none'
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
                {isTrackPlaying(item.track.uri) && (
                  <p style={{ color: '#1db954', fontSize: '12px', marginTop: '5px' }}>● Now Playing</p>
                )}
              </div>
              <button
                className="play-btn"
                onClick={() => isTrackPlaying(item.track.uri) ? player.togglePlay() : handlePlay(item.track.uri)}
                disabled={!deviceId}
                style={{ opacity: deviceId ? 1 : 0.5 }}
              >
                {isTrackPlaying(item.track.uri) ? '⏸' : '▶'}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default App
