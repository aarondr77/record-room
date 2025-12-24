import { useState, useEffect, useRef } from 'react';
import { LoginPage } from './pages/LoginPage';
import { RoomPage } from './pages/RoomPage';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { getAuthUrl, getAccessTokenFromUrl, fetchUserProfile } from './lib/spotify';
import { usePlaylist } from './hooks/usePlaylist';
import type { SpotifyUser } from './types';
import './App.css';

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SpotifyUser | null>(null);
  const [didAttemptProfile, setDidAttemptProfile] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoginPageReady, setIsLoginPageReady] = useState(false);
  const isExchangingToken = useRef(false);

  // Remove the initial HTML loading screen once React has mounted
  useEffect(() => {
    const initialLoader = document.getElementById('initial-loading');
    if (initialLoader) {
      initialLoader.style.opacity = '0';
      initialLoader.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        initialLoader.remove();
      }, 300);
    }
  }, []);

  // Auth initialization
  useEffect(() => {
    const initAuth = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (urlParams.get('error')) {
        window.history.replaceState({}, '', '/');
        setIsInitializing(false);
        return;
      }

      if (code) {
        if (isExchangingToken.current) return;
        isExchangingToken.current = true;
        window.history.replaceState({}, '', '/');

        try {
          const token = await getAccessTokenFromUrl(code);
          if (token) {
            setAccessToken(token);
            localStorage.setItem('spotify_access_token', token);

            // Fetch user profile
            try {
              const profile = await fetchUserProfile(token);
              setCurrentUser(profile);
              localStorage.setItem('current_user', JSON.stringify(profile));
            } catch (err) {
              console.error('Failed to fetch user profile:', err);
              // Allow app to continue even if profile fetch fails
            }
            setDidAttemptProfile(true);
          }
        } catch (err) {
          console.error('Authentication failed:', err);
          localStorage.removeItem('spotify_access_token');
        } finally {
          isExchangingToken.current = false;
          setIsInitializing(false);
        }
      } else {
        const savedToken = localStorage.getItem('spotify_access_token');
        if (savedToken) {
          setAccessToken(savedToken);

          // Try to load saved user profile
          const savedUser = localStorage.getItem('current_user');
          if (savedUser) {
            try {
              const profile = JSON.parse(savedUser) as SpotifyUser;
              setCurrentUser(profile);
            } catch (e) {
              console.error('Failed to parse saved user:', e);
            }
            setDidAttemptProfile(true);
            // Don't set isInitializing to false here - let it stay true until playlist loads
            // This ensures loading screen shows while playlist is being fetched
          } else {
            // Fetch user profile if not saved
            fetchUserProfile(savedToken)
              .then((profile) => {
                setCurrentUser(profile);
                localStorage.setItem('current_user', JSON.stringify(profile));
              })
              .catch((err) => {
                console.error('Failed to fetch user profile:', err);
              })
              .finally(() => {
                setDidAttemptProfile(true);
              });
            // Don't set isInitializing to false here either - wait for playlist
          }
        } else {
          // No saved token - will show login page
          // Allow LoginPage to render, but keep loading screen until 3D scene is ready
          requestAnimationFrame(() => {
            setIsLoginPageReady(true);
          });
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8154426d-abb8-4a21-a4ff-5fed9d597451',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'fix1',hypothesisId:'H5',location:'App.tsx:initAuth-no-token',message:'no token path, enabling login page',data:{},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }
      }
    };
    initAuth();
  }, []);

  const handleLogin = async () => {
    try {
      const authUrl = await getAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to initiate login:', err);
    }
  };

  const { playlist, error: playlistError, hasFetched } = usePlaylist(accessToken);

  // Update isInitializing once we have everything we need, or if we know there's no token
  useEffect(() => {
    // If no access token, initialization is complete (will show login page)
    if (!accessToken && !isInitializing) {
      // Already handled in initAuth
      return;
    }
    // If we have access token, wait for user and playlist fetch to complete
    // hasFetched ensures we wait for the actual fetch to finish, not just initial state
    if (accessToken && didAttemptProfile && hasFetched) {
      setIsInitializing(false);
    }
  }, [accessToken, didAttemptProfile, hasFetched, isInitializing]);

  // Show loading screen during initial auth check, token exchange, or while loading data
  // Also show while LoginPage is preparing to render (3D scene loading)
  if (accessToken && (isInitializing || isExchangingToken.current || !didAttemptProfile || !hasFetched)) {
    const message = isExchangingToken.current || (accessToken && !didAttemptProfile) 
      ? 'Loading...' 
      : 'Loading your playlist...';
    return <LoadingScreen message={message} />;
  }

  // Show login page if no access token
  // But keep loading screen visible until 3D scene is ready
  if (!accessToken) {
    if (!isLoginPageReady) {
      return <LoadingScreen message="Loading..." />;
    }
    return (
      <>
        {isInitializing && <LoadingScreen message="Loading..." />}
        <LoginPage 
          onLogin={handleLogin} 
          onSceneReady={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/8154426d-abb8-4a21-a4ff-5fed9d597451',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'pre-fix',hypothesisId:'H4',location:'App.tsx:onSceneReady',message:'login scene ready callback',data:{},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            // 3D scene is ready - hide loading screen after a brief delay to ensure smooth transition
            setTimeout(() => {
              setIsInitializing(false);
            }, 200);
          }}
        />
      </>
    );
  }

  if (playlistError || !playlist) {
    return (
      <div className="app">
        <div className="error">
          <p style={{ color: '#ff4444' }}>
            {playlistError || 'Failed to load playlist'}
          </p>
          <button
            onClick={() => {
              setAccessToken(null);
              localStorage.removeItem('spotify_access_token');
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Extract tracks from playlist
  const tracks = playlist.tracks.items
    .map((item) => item.track)
    .filter((track): track is NonNullable<typeof track> => track !== null);

  if (tracks.length === 0) {
    return (
      <div className="app">
        <div className="error">
          <p>No tracks found in playlist</p>
        </div>
      </div>
    );
  }

  // At this point, currentUser is guaranteed to be non-null due to earlier checks
  if (!currentUser) {
    return <LoadingScreen />;
  }

  return (
    <RoomPage
      tracks={tracks}
      currentUser={currentUser}
      accessToken={accessToken}
    />
  );
}

export default App;

