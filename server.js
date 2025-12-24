import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbOperations, storageOperations } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Configure multer for file uploads (in-memory storage for Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for voice notes
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Spotify token exchange endpoint
app.post('/api/token', async (req, res) => {
  const { code, redirect_uri, code_verifier } = req.body;
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

// Get all notes for a specific track
app.get('/api/notes/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;
    const notes = await dbOperations.getNotesByTrackId(trackId);
    
    // Transform notes for frontend
    const transformedNotes = notes.map(note => ({
      id: note.id,
      type: note.type,
      content: note.type === 'text' 
        ? note.content 
        : storageOperations.getPublicUrl(note.voice_file_path),
      duration: note.duration,
      author: note.author,
      timestamp: note.timestamp
    }));
    
    res.json(transformedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes', message: error.message });
  }
});

// Get all notes (for syncing)
app.get('/api/notes', async (req, res) => {
  try {
    const { after } = req.query;
    const notes = after 
      ? await dbOperations.getNotesAfterTimestamp(after)
      : await dbOperations.getAllNotes();
    
    // Transform notes for frontend
    const transformedNotes = notes.map(note => ({
      id: note.id,
      trackId: note.track_id,
      type: note.type,
      content: note.type === 'text' 
        ? note.content 
        : storageOperations.getPublicUrl(note.voice_file_path),
      duration: note.duration,
      author: note.author,
      timestamp: note.timestamp
    }));
    
    res.json(transformedNotes);
  } catch (error) {
    console.error('Error fetching all notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes', message: error.message });
  }
});

// Add a text note
app.post('/api/notes/text', async (req, res) => {
  try {
    const { trackId, content, author } = req.body;
    
    if (!trackId || !content || !author) {
      return res.status(400).json({ error: 'Missing required fields: trackId, content, author' });
    }
    
    const note = {
      id: uuidv4(),
      trackId,
      content: content.trim(),
      author,
      timestamp: new Date().toISOString()
    };
    
    const savedNote = await dbOperations.addTextNote(note);
    
    res.json({
      id: savedNote.id,
      type: 'text',
      content: savedNote.content,
      author: savedNote.author,
      timestamp: savedNote.timestamp
    });
  } catch (error) {
    console.error('Error adding text note:', error);
    res.status(500).json({ error: 'Failed to add note', message: error.message });
  }
});

// Add a voice note
app.post('/api/notes/voice', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    const { trackId, author, duration } = req.body;
    
    if (!trackId || !author) {
      return res.status(400).json({ error: 'Missing required fields: trackId, author' });
    }
    
    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop() || 'webm';
    const filename = `${uuidv4()}-${Date.now()}.${fileExtension}`;
    
    // Upload to Supabase Storage
    const filePath = await storageOperations.uploadVoiceNote(req.file.buffer, filename);
    
    const note = {
      id: uuidv4(),
      trackId,
      voiceFilePath: filePath,
      duration: duration ? parseInt(duration) : null,
      author,
      timestamp: new Date().toISOString()
    };
    
    const savedNote = await dbOperations.addVoiceNote(note);
    const publicUrl = storageOperations.getPublicUrl(savedNote.voice_file_path);
    
    res.json({
      id: savedNote.id,
      type: 'voice',
      content: publicUrl,
      duration: savedNote.duration,
      author: savedNote.author,
      timestamp: savedNote.timestamp
    });
  } catch (error) {
    console.error('Error adding voice note:', error);
    res.status(500).json({ error: 'Failed to add voice note', message: error.message });
  }
});

// Delete a note
app.delete('/api/notes/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { author } = req.query;
    
    if (!author) {
      return res.status(400).json({ error: 'Missing author parameter' });
    }
    
    const deleted = await dbOperations.deleteNote(noteId, author);
    
    if (deleted) {
      res.json({ success: true, message: 'Note deleted' });
    } else {
      res.status(404).json({ error: 'Note not found' });
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    if (error.message.includes('Unauthorized')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete note', message: error.message });
    }
  }
});

// Serve static files from Vite build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  
  // Serve static assets (JS, CSS, images, etc.) but NOT index.html
  // Setting index: false prevents express.static from automatically serving index.html
  app.use(express.static(distPath, {
    index: false  // Don't auto-serve index.html - we'll handle it explicitly below
  }));
  
  // Catch-all handler: serve index.html for all non-API routes
  // This ensures React Router can handle client-side routes like /callback
  app.get('*', (req, res, next) => {
    // Skip API routes - they should return 404 if not found
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    // For all other routes (including /callback), serve index.html
    // This allows React to load and handle the routing client-side
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  });
}

// Start server (for local dev and production hosting like Railway)
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
app.listen(PORT, host, () => {
  console.log(`🚀 Server running on http://${host}:${PORT}`);
  console.log(`📝 Notes API available at http://${host}:${PORT}/api/notes`);
});

export default app;
