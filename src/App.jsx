import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import { getAuthUrl, getAccessTokenFromUrl, fetchPlaylist } from './spotify'
import { getNotesForTrack, getAllNotes, addTextNote as apiAddTextNote, addVoiceNote as apiAddVoiceNote, deleteNote as apiDeleteNote } from './api'
import ControllableCat from './ControllableCat'
import VoiceNotePlayer from './VoiceNotePlayer'
import CatBowl from './CatBowl'
import CatWindow from './CatWindow'
import HumanLegs from './HumanLegs'

function App() {
  const [accessToken, setAccessToken] = useState(null)
  const [playlist, setPlaylist] = useState(null)
  const [error, setError] = useState(null)
  const [player, setPlayer] = useState(null)
  const [deviceId, setDeviceId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const isExchangingToken = useRef(false)
  
  // Notes & Voice Memos State
  const [expandedTrack, setExpandedTrack] = useState(null)
  const [trackNotes, setTrackNotes] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('current_user') || null)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingIntervalRef = useRef(null)
  const syncIntervalRef = useRef(null)
  const lastSyncTimestampRef = useRef(null)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)

  // Load all notes from backend when playlist is loaded
  useEffect(() => {
    if (!playlist) return

    const loadAllNotes = async () => {
      setIsLoadingNotes(true)
      try {
        const allNotes = await getAllNotes()
        // Group notes by track ID
        const notesByTrack = {}
        allNotes.forEach(note => {
          if (!notesByTrack[note.trackId]) {
            notesByTrack[note.trackId] = []
          }
          notesByTrack[note.trackId].push(note)
        })
        setTrackNotes(notesByTrack)
        
        // Set last sync timestamp to the latest note timestamp
        if (allNotes.length > 0) {
          const latestTimestamp = allNotes[allNotes.length - 1].timestamp
          lastSyncTimestampRef.current = latestTimestamp
        }
      } catch (err) {
        console.error('Error loading notes:', err)
        setError('Failed to load notes. Please refresh the page.')
      } finally {
        setIsLoadingNotes(false)
      }
    }

    loadAllNotes()
  }, [playlist])

  // Poll for new notes every 3 seconds
  useEffect(() => {
    if (!playlist) return

    const syncNotes = async () => {
      try {
        const afterTimestamp = lastSyncTimestampRef.current
        const newNotes = await getAllNotes(afterTimestamp)
        
        if (newNotes.length > 0) {
          setTrackNotes(prev => {
            const updated = { ...prev }
            newNotes.forEach(note => {
              if (!updated[note.trackId]) {
                updated[note.trackId] = []
              }
              // Check if note already exists (avoid duplicates)
              if (!updated[note.trackId].some(n => n.id === note.id)) {
                updated[note.trackId].push(note)
                // Sort by timestamp
                updated[note.trackId].sort((a, b) => 
                  new Date(a.timestamp) - new Date(b.timestamp)
                )
              }
            })
            return updated
          })
          
          // Update last sync timestamp
          const latestTimestamp = newNotes[newNotes.length - 1].timestamp
          lastSyncTimestampRef.current = latestTimestamp
        }
      } catch (err) {
        console.error('Error syncing notes:', err)
        // Don't show error to user for sync failures, just log it
      }
    }

    // Initial sync after 1 second, then every 3 seconds
    const initialTimeout = setTimeout(() => {
      syncNotes()
      syncIntervalRef.current = setInterval(syncNotes, 3000)
    }, 1000)

    return () => {
      clearTimeout(initialTimeout)
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [playlist])

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
      
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ids: [deviceId], play: true })
      })

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

      setTimeout(async () => {
        const state = await player.getCurrentState()
        if (state?.paused) await player.resume()
      }, 500)

    } catch (err) {
      setError(`Playback error: ${err.message}`)
    }
  }

  // Voice Recording Functions
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/wav',
      ''  // Empty string = browser default
    ]
    for (const type of types) {
      if (type === '' || MediaRecorder.isTypeSupported(type)) {
        return type
      }
    }
    return ''
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const options = mimeType ? { mimeType } : {}
      
      mediaRecorderRef.current = new MediaRecorder(stream, options)
      audioChunksRef.current = []
      
      // Store the actual MIME type being used
      const actualMimeType = mediaRecorderRef.current.mimeType || 'audio/webm'

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType })
        
        // Send to backend
        try {
          await addVoiceNote(expandedTrack, audioBlob)
        } catch (err) {
          setError(`Failed to save voice note: ${err.message}`)
        }
        
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingIntervalRef.current)
    }
  }

  const addTextNote = async (trackId) => {
    if (!newMessage.trim() || !currentUser) return
    
    const messageToSend = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX
    
    try {
      const note = await apiAddTextNote(trackId, messageToSend, currentUser)
      
      // Optimistically update UI
      setTrackNotes(prev => ({
        ...prev,
        [trackId]: [...(prev[trackId] || []), note]
      }))
    } catch (err) {
      setError(`Failed to send message: ${err.message}`)
      setNewMessage(messageToSend) // Restore message on error
    }
  }

  const addVoiceNote = async (trackId, audioBlob) => {
    if (!currentUser) return
    
    const duration = recordingTime
    setRecordingTime(0)
    
    try {
      const note = await apiAddVoiceNote(trackId, audioBlob, currentUser, duration)
      
      // Optimistically update UI
      setTrackNotes(prev => ({
        ...prev,
        [trackId]: [...(prev[trackId] || []), note]
      }))
    } catch (err) {
      setError(`Failed to save voice note: ${err.message}`)
    }
  }

  const deleteNote = async (trackId, noteId) => {
    if (!currentUser) return
    
    // Optimistically remove from UI
    setTrackNotes(prev => ({
      ...prev,
      [trackId]: (prev[trackId] || []).filter(note => note.id !== noteId)
    }))
    
    try {
      await apiDeleteNote(noteId, currentUser)
    } catch (err) {
      // Restore note on error
      setError(`Failed to delete note: ${err.message}`)
      // Reload notes to restore state
      try {
        const allNotes = await getAllNotes()
        const notesByTrack = {}
        allNotes.forEach(note => {
          if (!notesByTrack[note.trackId]) {
            notesByTrack[note.trackId] = []
          }
          notesByTrack[note.trackId].push(note)
        })
        setTrackNotes(notesByTrack)
      } catch (reloadErr) {
        console.error('Error reloading notes:', reloadErr)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Cat interaction handler - memoized to prevent re-renders
  // Must be defined before any early returns to follow Rules of Hooks
  const handleCatInteract = useCallback((catPosition) => {
    if (!playlist) return // Early return if no playlist
    
    const interactionRadius = 80 // pixels
    
    // Find all interactive elements
    const interactiveElements = document.querySelectorAll('[data-cat-interactive]')
    
    for (const element of interactiveElements) {
      const rect = element.getBoundingClientRect()
      const elementCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
      
      const distance = Math.sqrt(
        Math.pow(catPosition.x - elementCenter.x, 2) + 
        Math.pow(catPosition.y - elementCenter.y, 2)
      )
      
      if (distance < interactionRadius) {
        // Trigger the interaction
        const action = element.getAttribute('data-cat-action')
        const trackIndex = element.getAttribute('data-track-index')
        const trackUri = element.getAttribute('data-track-uri')
        const trackId = element.getAttribute('data-track-id')
        
        if (action === 'play' && trackUri && player) {
          const isPlayingTrack = currentTrack?.uri === trackUri && isPlaying
          isPlayingTrack ? player.togglePlay() : handlePlay(trackUri)
        } else if (action === 'expand' && trackId) {
          setExpandedTrack(expandedTrack === trackId ? null : trackId)
        } else if (action === 'send-note' && trackId) {
          if (newMessage.trim()) {
            addTextNote(trackId)
          }
        } else if (action === 'start-recording' && trackId) {
          if (!isRecording) {
            startRecording()
          }
        } else if (action === 'stop-recording') {
          if (isRecording) {
            stopRecording()
          }
        } else if (action === 'voice-play') {
          // Voice note play button - click it
          element.click()
        }
        
        // Visual feedback
        element.style.transform = 'scale(0.95)'
        setTimeout(() => {
          element.style.transform = ''
        }, 100)
        
        break // Only interact with the first nearby element
      }
    }
  }, [playlist, player, currentTrack, isPlaying, expandedTrack, newMessage, addTextNote, isRecording, startRecording, stopRecording, handlePlay])

  // User Selection Screen
  if (!currentUser) {
    return (
      <div className="app">
        <header>
          <h1>Our Shared Songs 💕</h1>
          <p>Who's listening today?</p>
        </header>
        <main>
          <div className="user-select">
            <button className="user-btn" onClick={() => { setCurrentUser('Partner 1'); localStorage.setItem('current_user', 'Partner 1'); }}>
              <span className="user-emoji">💜</span>
              <span>Partner 1</span>
            </button>
            <span className="heart-divider">♥</span>
            <button className="user-btn" onClick={() => { setCurrentUser('Partner 2'); localStorage.setItem('current_user', 'Partner 2'); }}>
              <span className="user-emoji">💙</span>
              <span>Partner 2</span>
            </button>
          </div>
          <p className="switch-hint">You can switch anytime from the header</p>
        </main>
      </div>
    )
  }

  // Login screen
  if (!accessToken) {
    return (
      <div className="app">
        <header>
          <h1>Our Shared Songs 💕</h1>
          <p>A place for us to share and talk about our favorite music</p>
          <div className="current-user-badge" onClick={() => { setCurrentUser(null); localStorage.removeItem('current_user'); }}>
            <span>{currentUser === 'Partner 1' ? '💜' : '💙'} {currentUser}</span>
          </div>
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
              <div className="loading">
                <div className="loading-heart">💕</div>
                <p>Loading your playlist...</p>
              </div>
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
      {playlist && (
        <ControllableCat 
          key={currentUser} // Only remount if user changes
          onInteract={handleCatInteract}
          partner={currentUser === 'Partner 1' ? 'partner1' : 'partner2'}
          isPlaying={isPlaying}
          currentTrackUri={currentTrack?.uri}
        />
      )}
      <header>
        <h1>Our Shared Songs 💕</h1>
        <p>{playlist.name} • {playlist.tracks.items.length} tracks</p>
        <div className="current-user-badge" onClick={() => { setCurrentUser(null); localStorage.removeItem('current_user'); }}>
          <span>{currentUser === 'Partner 1' ? '💜' : '💙'} {currentUser}</span>
        </div>
        {!deviceId && <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>⏳ Player initializing...</p>}
      </header>

      <main>
        <div className="playlist">
          {playlist.tracks.items.map((item, index) => {
            const trackId = item.track.id
            const notes = trackNotes[trackId] || []
            const isExpanded = expandedTrack === trackId
            const noteCount = notes.length

            return (
              <div key={index} className={`track-card ${isExpanded ? 'expanded' : ''} ${isTrackPlaying(item.track.uri) ? 'playing' : ''}`}>
                <div 
                  className="track-main" 
                  onClick={() => setExpandedTrack(isExpanded ? null : trackId)}
                  data-cat-interactive
                  data-cat-action="expand"
                  data-track-id={trackId}
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
                      <span className="now-playing-badge">♫ Now Playing</span>
                    )}
                    {noteCount > 0 && (
                      <span className="note-count">{noteCount} {noteCount === 1 ? 'note' : 'notes'} 💬</span>
                    )}
                  </div>
                  <div
                    data-cat-interactive
                    data-cat-action="play"
                    data-track-uri={item.track.uri}
                    data-play-type={['bowl', 'window', 'legs'][index % 3]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {index % 3 === 0 && (
                      <CatBowl
                        isPlaying={isTrackPlaying(item.track.uri)}
                        onClick={() => isTrackPlaying(item.track.uri) ? player.togglePlay() : handlePlay(item.track.uri)}
                        disabled={!deviceId}
                      />
                    )}
                    {index % 3 === 1 && (
                      <CatWindow
                        isPlaying={isTrackPlaying(item.track.uri)}
                        onClick={() => isTrackPlaying(item.track.uri) ? player.togglePlay() : handlePlay(item.track.uri)}
                        disabled={!deviceId}
                      />
                    )}
                    {index % 3 === 2 && (
                      <HumanLegs
                        isPlaying={isTrackPlaying(item.track.uri)}
                        onClick={() => isTrackPlaying(item.track.uri) ? player.togglePlay() : handlePlay(item.track.uri)}
                        disabled={!deviceId}
                      />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="notes-section">
                    <div className="notes-list">
                      {isLoadingNotes && notes.length === 0 ? (
                        <p className="no-notes">Loading notes... 💭</p>
                      ) : notes.length === 0 ? (
                        <p className="no-notes">No notes yet! Be the first to share your thoughts 💭</p>
                      ) : (
                        notes.map(note => (
                          <div key={note.id} className={`note ${note.author === 'Partner 1' ? 'partner1' : 'partner2'}`}>
                            <div className="note-header">
                              <span className="note-author">
                                {note.author === 'Partner 1' ? '💜' : '💙'} {note.author}
                              </span>
                              <span className="note-time">{formatDate(note.timestamp)}</span>
                              {note.author === currentUser && (
                                <button className="delete-note" onClick={() => deleteNote(trackId, note.id)}>×</button>
                              )}
                            </div>
                            {note.type === 'text' ? (
                              <p className="note-content">{note.content}</p>
                            ) : (
                              <div className="voice-note">
                                <VoiceNotePlayer 
                                  src={note.content} 
                                  duration={note.duration || 0} 
                                  partner={note.author === 'Partner 1' ? 'partner1' : 'partner2'}
                                />
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="add-note">
                      {isRecording ? (
                        <div className="recording-state">
                          <div className="recording-indicator">
                            <span className="recording-dot"></span>
                            Recording... {formatTime(recordingTime)}
                          </div>
                          <button 
                            className="stop-record-btn" 
                            onClick={stopRecording}
                            data-cat-interactive
                            data-cat-action="stop-recording"
                          >
                            ⏹ Stop
                          </button>
                        </div>
                      ) : (
                        <div className="unified-input-row">
                          <div className="textarea-wrapper">
                            <textarea
                              placeholder={`What do you think, ${currentUser}?`}
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  if (newMessage.trim()) {
                                    addTextNote(trackId)
                                  }
                                }
                              }}
                              rows={3}
                              className="note-textarea"
                            />
                            {newMessage.trim() ? (
                              <button 
                                className="send-btn-inside" 
                                onClick={() => addTextNote(trackId)}
                                title="Send message"
                                data-cat-interactive
                                data-cat-action="send-note"
                                data-track-id={trackId}
                              >
                                💌
                              </button>
                            ) : (
                              <button 
                                className="mic-btn-inside" 
                                onClick={startRecording}
                                title="Record voice note"
                                data-cat-interactive
                                data-cat-action="start-recording"
                                data-track-id={trackId}
                              >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  {/* Microphone body */}
                                  <rect x="9" y="3" width="6" height="8" rx="3" stroke="#2c2c2c" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                  {/* Microphone stand */}
                                  <line x1="12" y1="11" x2="12" y2="15" stroke="#2c2c2c" strokeWidth="2" strokeLinecap="round"/>
                                  {/* Microphone base */}
                                  <path d="M 8 15 Q 12 17 16 15" stroke="#2c2c2c" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                  {/* Sound waves */}
                                  <path d="M 4 10 Q 6 12 4 14" stroke="#2c2c2c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                                  <path d="M 20 10 Q 18 12 20 14" stroke="#2c2c2c" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default App
