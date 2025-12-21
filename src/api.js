// In production (Vercel), API routes are at the same origin
// In development, we use the local server
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:3001');

// Get all notes for a specific track
export const getNotesForTrack = async (trackId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${trackId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

// Get all notes (for syncing)
export const getAllNotes = async (afterTimestamp = null) => {
  try {
    const url = afterTimestamp 
      ? `${API_BASE_URL}/api/notes?after=${encodeURIComponent(afterTimestamp)}`
      : `${API_BASE_URL}/api/notes`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all notes:', error);
    throw error;
  }
};

// Add a text note
export const addTextNote = async (trackId, content, author) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trackId, content, author }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to add note: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding text note:', error);
    throw error;
  }
};

// Add a voice note
export const addVoiceNote = async (trackId, audioBlob, author, duration) => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-note.webm');
    formData.append('trackId', trackId);
    formData.append('author', author);
    formData.append('duration', duration.toString());
    
    const response = await fetch(`${API_BASE_URL}/api/notes/voice`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to add voice note: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error adding voice note:', error);
    throw error;
  }
};

// Delete a note
export const deleteNote = async (noteId, author) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}?author=${encodeURIComponent(author)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to delete note: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

