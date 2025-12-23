import { useState, useEffect, useCallback } from 'react';
import { Room } from '../components/canvas/Room';
import { RecordModal } from '../components/ui/RecordModal';
import { NowPlayingBar } from '../components/ui/NowPlayingBar';
import { InteractionPrompt } from '../components/ui/InteractionPrompt';
import { useCatMovement } from '../hooks/useCatMovement';
import { useNotes } from '../hooks/useNotes';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import type { SpotifyTrack, SpotifyUser } from '../types';
import './RoomPage.css';

interface RoomPageProps {
  tracks: SpotifyTrack[];
  currentUser: SpotifyUser;
  accessToken: string;
}

export function RoomPage({ tracks, currentUser, accessToken }: RoomPageProps) {
  const catState = useCatMovement({ trackCount: tracks.length });
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const selectedTrack = selectedTrackIndex !== null ? tracks[selectedTrackIndex] : null;
  const trackId = selectedTrack?.id || null;
  
  // Only fetch notes when modal is open
  const { notes, isLoading: isLoadingNotes, createNote, deleteNote } = useNotes(trackId, isModalOpen);
  const { isPlaying, currentTrack, playTrack, togglePlay, position, duration } = useSpotifyPlayer(accessToken);

  // Handle Space key to open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't prevent default if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if (e.key === ' ' && catState.currentTrackIndex !== null) {
        e.preventDefault();
        setSelectedTrackIndex(catState.currentTrackIndex);
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [catState.currentTrackIndex]);

  const handleRecordClick = useCallback((trackIndex: number) => {
    setSelectedTrackIndex(trackIndex);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handlePlayPause = useCallback(async () => {
    if (selectedTrack) {
      if (currentTrack?.uri === selectedTrack.uri && isPlaying) {
        await togglePlay();
      } else {
        await playTrack(selectedTrack.uri);
      }
    } else {
      await togglePlay();
    }
  }, [selectedTrack, currentTrack, isPlaying, playTrack, togglePlay]);

  const handleCreateNote = useCallback(async (content: string, author: string) => {
    await createNote(content, author);
  }, [createNote]);

  const handleDeleteNote = useCallback(async (noteId: string, author: string) => {
    await deleteNote(noteId, author);
  }, [deleteNote]);

  const showPrompt = catState.currentTrackIndex !== null && !isModalOpen;

  return (
    <div className="room-page">
      <div className="room-scene-container">
        <Room
          tracks={tracks}
          catState={catState}
          onRecordClick={handleRecordClick}
        />
      </div>

      <InteractionPrompt
        message="to open record"
        visible={showPrompt}
      />

      <RecordModal
        track={selectedTrack}
        isOpen={isModalOpen}
        isPlaying={selectedTrack ? currentTrack?.uri === selectedTrack.uri && isPlaying : false}
        position={selectedTrack && currentTrack?.uri === selectedTrack.uri ? position : undefined}
        duration={selectedTrack && currentTrack?.uri === selectedTrack.uri ? duration : selectedTrack?.duration_ms}
        notes={notes}
        currentUserId={currentUser.display_name}
        isLoadingNotes={isLoadingNotes}
        onClose={handleCloseModal}
        onPlayPause={handlePlayPause}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
      />

      <NowPlayingBar
        track={currentTrack ? tracks.find((t) => t.uri === currentTrack.uri) || null : null}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
      />
    </div>
  );
}

