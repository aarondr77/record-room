import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Verify environment variables are loaded
const clientId = process.env.VITE_SPOTIFY_CLIENT_ID;
const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('⚠️  WARNING: Missing Spotify credentials in environment variables!');
  console.error('   VITE_SPOTIFY_CLIENT_ID:', clientId ? '✓ Found' : '✗ Missing');
  console.error('   VITE_SPOTIFY_CLIENT_SECRET:', clientSecret ? '✓ Found' : '✗ Missing');
} else {
  console.log('✓ Spotify credentials loaded successfully');
}

app.use(cors());
app.use(express.json());

app.post('/api/token', async (req, res) => {
  const { code, redirect_uri, code_verifier } = req.body;
  // Use the credentials loaded at startup
  const clientId = process.env.VITE_SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.VITE_SPOTIFY_CLIENT_SECRET || process.env.SPOTIFY_CLIENT_SECRET;

  console.log('Token exchange request received', {
    hasCode: !!code,
    hasRedirectUri: !!redirect_uri,
    hasCodeVerifier: !!code_verifier,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
  });

  if (!code || !redirect_uri || !code_verifier) {
    console.error('Missing required parameters:', { code: !!code, redirect_uri: !!redirect_uri, code_verifier: !!code_verifier });
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  if (!clientId || !clientSecret) {
    console.error('Server configuration error: Missing client credentials');
    return res.status(500).json({ error: 'Server configuration error: Missing client credentials' });
  }

  try {
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      code_verifier,
    });

    console.log('Requesting token from Spotify...');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: tokenRequestBody,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Spotify token exchange error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: 'Failed to exchange code for token',
        details: errorData 
      });
    }

    const data = await response.json();
    console.log('Token exchange successful');
    res.json(data);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Token exchange server running on http://127.0.0.1:${PORT}`);
});

