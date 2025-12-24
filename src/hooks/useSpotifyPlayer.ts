import { useState, useEffect, useRef } from 'react';

interface SpotifyPlayerState {
  isPlaying: boolean;
  currentTrack: Spotify.Track | null;
  deviceId: string | null;
  player: Spotify.Player | null;
  position: number; // Current position in ms
  duration: number; // Track duration in ms
}

interface UseSpotifyPlayerOptions {
  onTrackEnd?: () => void;
}

export function useSpotifyPlayer(accessToken: string | null, options?: UseSpotifyPlayerOptions) {
  const [state, setState] = useState<SpotifyPlayerState>({
    isPlaying: false,
    currentTrack: null,
    deviceId: null,
    player: null,
    position: 0,
    duration: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const positionIntervalRef = useRef<number | null>(null);
  // Track previous state to detect when a track naturally ends
  const prevStateRef = useRef<{ trackUri: string | null; isPlaying: boolean }>({
    trackUri: null,
    isPlaying: false,
  });
  const onTrackEndRef = useRef(options?.onTrackEnd);

  // Keep the callback ref up to date
  useEffect(() => {
    onTrackEndRef.current = options?.onTrackEnd;
  }, [options?.onTrackEnd]);

  useEffect(() => {
    if (!accessToken) return;

    const initPlayer = () => {
      if (!window.Spotify) {
        setError('Spotify Web Playback SDK not loaded');
        return;
      }

      const player = new window.Spotify.Player({
        name: 'Record Room',
        getOAuthToken: (cb) => cb(accessToken),
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }) => {
        console.log('Spotify player ready, device ID:', device_id);
        deviceIdRef.current = device_id;
        setState((prev) => ({ ...prev, deviceId: device_id }));
      });

      player.addListener('not_ready', () => {
        console.log('Spotify player not ready');
        deviceIdRef.current = null;
        setState((prev) => ({ ...prev, deviceId: null }));
      });

      player.addListener('player_state_changed', (playerState) => {
        if (!playerState) {
          setState((prev) => ({ ...prev, isPlaying: false, position: 0, duration: 0 }));
          if (positionIntervalRef.current) {
            clearInterval(positionIntervalRef.current);
            positionIntervalRef.current = null;
          }
          return;
        }

        const currentTrackUri = playerState.track_window?.current_track?.uri || null;
        const wasPlaying = prevStateRef.current.isPlaying;
        const prevTrackUri = prevStateRef.current.trackUri;
        const isNowPaused = playerState.paused;

        // Detect when a track naturally ends:
        // - Was playing, now paused
        // - Track changed (next track in queue) or position reset
        // - Position is at 0 (track ended and reset)
        const trackChanged = prevTrackUri !== null && currentTrackUri !== prevTrackUri;
        const trackEndedNaturally = wasPlaying && isNowPaused && playerState.position === 0 && !trackChanged;
        
        if (trackEndedNaturally && onTrackEndRef.current) {
          // Small delay to ensure state is updated before playing next track
          setTimeout(() => {
            onTrackEndRef.current?.();
          }, 100);
        }

        // Update previous state
        prevStateRef.current = {
          trackUri: currentTrackUri,
          isPlaying: !playerState.paused,
        };

        setState((prev) => ({
          ...prev,
          isPlaying: !playerState.paused,
          currentTrack: playerState.track_window?.current_track || null,
          position: playerState.position,
          duration: playerState.duration,
        }));
      });

      player.addListener('authentication_error', () => {
        setError('Spotify authentication failed');
      });

      player.addListener('account_error', () => {
        setError('Spotify Premium required for playback');
      });

      player.connect();
      playerRef.current = player;
      setState((prev) => ({ ...prev, player }));
    };

    if (window.Spotify) {
      initPlayer();
    } else {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
      window.onSpotifyWebPlaybackSDKReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [accessToken]);

  // Separate effect for position polling
  useEffect(() => {
    const updatePosition = async () => {
      if (playerRef.current && state.isPlaying && state.deviceId) {
        try {
          // Check if player is ready before calling getCurrentState
          const currentState = await playerRef.current.getCurrentState();
          if (currentState && !currentState.paused) {
            setState((prev) => ({
              ...prev,
              position: currentState.position,
              duration: currentState.duration,
            }));
          }
        } catch (err) {
          // Silently handle errors - player might not be ready yet
          // Don't spam console with errors
          if (err instanceof Error && !err.message.includes('streamer')) {
            console.error('Error getting player state:', err);
          }
        }
      }
    };

    if (state.isPlaying && state.player && state.deviceId) {
      positionIntervalRef.current = window.setInterval(updatePosition, 1000);
    } else {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
        positionIntervalRef.current = null;
      }
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [state.isPlaying, state.player, state.deviceId]);

  const playTrack = async (trackUri: string) => {
    if (!state.deviceId || !state.player || !accessToken) {
      throw new Error('Player not ready');
    }

    try {
      // Activate the player element first
      await state.player.activateElement();
      
      // Set the device as active
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_ids: [state.deviceId], play: true }),
      });

      // Play the track
      const response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${state.deviceId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [trackUri], position_ms: 0 }),
        }
      );

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        throw new Error(`Failed to play track: ${errorText}`);
      }

      // Wait a bit longer for the player to initialize, then check state
      setTimeout(async () => {
        try {
          const currentState = await state.player?.getCurrentState();
          if (currentState?.paused) {
            await state.player?.resume();
          }
        } catch (err) {
          // Ignore errors here - player state will update via listener
        }
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playback error');
      throw err;
    }
  };

  const togglePlay = async () => {
    const currentPlayer = playerRef.current;
    const currentDeviceId = deviceIdRef.current;
    
    if (!currentPlayer || !currentDeviceId) {
      console.warn('Player not ready for toggle', { 
        hasPlayer: !!currentPlayer, 
        hasDeviceId: !!currentDeviceId 
      });
      return;
    }
    
    try {
      await currentPlayer.activateElement();
      await currentPlayer.togglePlay();
    } catch (err) {
      console.error('Error toggling play:', err);
      setError(err instanceof Error ? err.message : 'Toggle play error');
      // Re-throw so calling code knows it failed
      throw err;
    }
  };

  return {
    ...state,
    error,
    playTrack,
    togglePlay,
  };
}

