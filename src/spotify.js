const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
const PLAYLIST_ID = import.meta.env.VITE_PLAYLIST_ID;
const TOKEN_EXCHANGE_URL = import.meta.env.VITE_TOKEN_EXCHANGE_URL || 'http://127.0.0.1:3001/api/token';

const SCOPES = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'user-read-email',
  'user-read-private'
].join(' ');

// Generate a random string for PKCE
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

// Generate code verifier and challenge for PKCE
async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const getAuthUrl = async () => {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);
  
  // Store verifier in sessionStorage for later use
  sessionStorage.setItem('code_verifier', verifier);
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export const getAccessTokenFromUrl = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  if (!code) return null;
  
  // Exchange code for token
  const verifier = sessionStorage.getItem('code_verifier');
  if (!verifier) {
    throw new Error('Code verifier not found');
  }
  
  try {
    console.log('Exchanging code for token...', { code: code.substring(0, 20) + '...', redirect_uri: REDIRECT_URI });
    const response = await fetch(TOKEN_EXCHANGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: verifier,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', response.status, errorText);
      throw new Error(`Failed to exchange code for token: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    if (!data.access_token) {
      throw new Error('Token exchange response missing access_token');
    }
    
    sessionStorage.removeItem('code_verifier');
    console.log('Token exchange successful');
    return data.access_token;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    sessionStorage.removeItem('code_verifier');
    throw error;
  }
};

// Helper function to test API access
export const testApiAccess = async (accessToken) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API test failed: ${response.status}`);
    }
    
    const userData = await response.json();
    console.log('API access test successful. User:', userData.display_name || userData.id);
    return userData;
  } catch (error) {
    console.error('API access test failed:', error);
    throw error;
  }
};

// Fetch user's playlists to help find accessible ones
export const fetchUserPlaylists = async (accessToken) => {
  try {
    // Fetch all playlists (including collaborative ones)
    let allPlaylists = [];
    let nextUrl = 'https://api.spotify.com/v1/me/playlists?limit=50';
    
    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch playlists: ${response.status}`);
      }
      
      const data = await response.json();
      allPlaylists = [...allPlaylists, ...data.items];
      nextUrl = data.next;
    }
    
    return allPlaylists;
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    throw error;
  }
};

// Search for playlists by name
export const searchPlaylists = async (accessToken, query) => {
  try {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=20`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to search playlists: ${response.status}`);
    }
    
    const data = await response.json();
    return data.playlists.items;
  } catch (error) {
    console.error('Error searching playlists:', error);
    throw error;
  }
};

// Try to access a playlist directly (useful for blend/collaborative playlists)
export const tryAccessPlaylist = async (accessToken, playlistId) => {
  try {
    // Try the standard endpoint
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    }
    
    // If 404, try with market parameter (sometimes needed for certain playlists)
    if (response.status === 404) {
      const responseWithMarket = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}?market=from_token`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (responseWithMarket.ok) {
        return await responseWithMarket.json();
      }
    }
    
    throw new Error(`Failed to access playlist: ${response.status}`);
  } catch (error) {
    console.error('Error accessing playlist:', error);
    throw error;
  }
};

export const fetchPlaylist = async (accessToken, playlistId = null) => {
  const targetPlaylistId = playlistId || PLAYLIST_ID;
  
  if (!targetPlaylistId) {
    throw new Error('Playlist ID is not configured. Please set VITE_PLAYLIST_ID in your .env file.');
  }

  // Test API access first
  try {
    await testApiAccess(accessToken);
  } catch (error) {
    throw new Error(`Cannot access Spotify API: ${error.message}. Please reconnect to Spotify.`);
  }

  console.log(`Attempting to fetch playlist: ${targetPlaylistId}`);
  
  // Try to access the playlist with different methods
  try {
    const playlist = await tryAccessPlaylist(accessToken, targetPlaylistId);
    return playlist;
  } catch (error) {
    // If direct access fails, try with more detailed error handling
    const response = await fetch(`https://api.spotify.com/v1/playlists/${targetPlaylistId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Failed to fetch playlist';
      
      if (response.status === 404) {
        errorMessage = `Playlist not found (404). The playlist ID "${targetPlaylistId}" may be incorrect, or you may not have access to this playlist.`;
        errorMessage += `\n\nNote: Some Spotify-generated playlists (like Daily Mix, Discover Weekly) may not be accessible via the API.`;
        errorMessage += `\nBlend playlists should be accessible - make sure you're logged in with an account that has access to the blend.`;
      } else if (response.status === 403) {
        errorMessage = `Access forbidden (403). You may not have permission to access this playlist.`;
      } else if (response.status === 401) {
        errorMessage = `Unauthorized (401). Your access token may have expired. Please reconnect to Spotify.`;
      } else {
        errorMessage = `Failed to fetch playlist: ${response.status} - ${errorText}`;
      }
      
      console.error('Playlist fetch error:', response.status, errorText);
      throw new Error(errorMessage);
    }

    return await response.json();
  }
  
  // Fetch all tracks (handle pagination)
  let allTracks = [...playlist.tracks.items];
  let nextUrl = playlist.tracks.next;
  
  // Keep fetching until there are no more pages
  while (nextUrl) {
    const tracksResponse = await fetch(nextUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!tracksResponse.ok) {
      console.warn('Failed to fetch additional tracks, returning what we have');
      break;
    }
    
    const tracksData = await tracksResponse.json();
    allTracks = [...allTracks, ...tracksData.items];
    nextUrl = tracksData.next;
  }
  
  // Replace the tracks.items with all tracks
  playlist.tracks.items = allTracks;
  playlist.tracks.total = allTracks.length;
  
  console.log(`Fetched ${allTracks.length} tracks from playlist "${playlist.name}"`);
  
  return playlist;
};

export const playTrack = async (accessToken, trackUri, deviceId) => {
  const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uris: [trackUri]
    })
  });

  if (!response.ok && response.status !== 204) {
    throw new Error('Failed to play track');
  }
};
