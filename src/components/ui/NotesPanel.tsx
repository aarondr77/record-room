import { NoteCard } from './NoteCard';
import { NoteInput } from './NoteInput';
import './NotesPanel.css';
import type { Note } from '../../types';

interface NotesPanelProps {
  notes: Note[];
  currentUserId: string;
  isLoading: boolean;
  onCreateNote: (content: string, author: string) => Promise<void>;
  onDeleteNote: (noteId: string, author: string) => Promise<void>;
}

export function NotesPanel({
  notes,
  currentUserId,
  isLoading,
  onCreateNote,
}: NotesPanelProps) {
  const handleCreateNote = async (content: string) => {
    await onCreateNote(content, currentUserId);
  };

  // Determine unique names and assign partners
  // First unique name = Partner 1 (left, black), second = Partner 2 (right, blue)
  // Any additional names = Partner 2
  const getPartnerAssignment = () => {
    const uniqueNames = Array.from(new Set(notes.map(note => note.author)));
    const partnerMap = new Map<string, 'partner1' | 'partner2'>();
    
    if (uniqueNames.length > 0) {
      partnerMap.set(uniqueNames[0], 'partner1');
    }
    
    // All other names (including second, third, etc.) are partner2
    for (let i = 1; i < uniqueNames.length; i++) {
      partnerMap.set(uniqueNames[i], 'partner2');
    }
    
    return partnerMap;
  };

  const partnerMap = getPartnerAssignment();

  // Sort notes chronologically by created_at timestamp
  const sortedNotes = [...notes].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div className="notes-panel">
      <h3 className="notes-title">Notes</h3>
      
      <div className="notes-list">
        {isLoading && notes.length === 0 ? (
          <p className="no-notes">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="no-notes"></p>
        ) : (
          sortedNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              partnerClass={partnerMap.get(note.author) || 'partner2'}
            />
          ))
        )}
      </div>

      <NoteInput
        onSubmit={handleCreateNote}
        placeholder="What do you think?"
        disabled={isLoading}
      />
    </div>
  );
}

