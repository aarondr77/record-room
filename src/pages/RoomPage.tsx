import { useState, useEffect, useCallback } from 'react';
import { Room } from '../components/canvas/Room';
import { RecordModal } from '../components/ui/RecordModal';
import { NowPlayingBar } from '../components/ui/NowPlayingBar';
import { InteractionPrompt } from '../components/ui/InteractionPrompt';
import { HelpIcon } from '../components/ui/HelpIcon';
import { HelpModal } from '../components/ui/HelpModal';
import { useCatMovement } from '../hooks/useCatMovement';
import { useNotes } from '../hooks/useNotes';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import type { SpotifyTrack, SpotifyUser, ToyState } from '../types';
import { FLOOR_Y, FLOOR_Z } from '../types';
import './RoomPage.css';

interface RoomPageProps {
  tracks: SpotifyTrack[];
  currentUser: SpotifyUser;
  accessToken: string;
}

// Initial toy position on the floor
const INITIAL_TOY_POSITION = { x: 2, y: FLOOR_Y, z: FLOOR_Z };

export function RoomPage({ tracks, currentUser, accessToken }: RoomPageProps) {
  // Toy state management
  const [toyState, setToyState] = useState<ToyState>({
    position: INITIAL_TOY_POSITION,
    isCarried: false,
  });

  // Handlers for toy pickup and drop
  const handlePickupToy = useCallback(() => {
    setToyState(prev => ({ ...prev, isCarried: true }));
  }, []);

  const handleDropToy = useCallback((x: number, z: number) => {
    setToyState({
      position: { x, y: FLOOR_Y, z },
      isCarried: false,
    });
  }, []);

  const catState = useCatMovement({ 
    trackCount: tracks.length,
    toyState,
    onPickupToy: handlePickupToy,
    onDropToy: handleDropToy,
  });
  
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  
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
  
  // Show toy prompt when near toy on floor and not carrying
  const showToyPrompt = catState.isNearToy && !toyState.isCarried && !isModalOpen;

  return (
    <div className="room-page">
      <HelpIcon onClick={() => setIsHelpModalOpen(true)} />
      
      <div className="room-scene-container">
        <Room
          tracks={tracks}
          catState={catState}
          toyState={toyState}
          onRecordClick={handleRecordClick}
        />
      </div>

      <InteractionPrompt
        message="to open record"
        visible={showPrompt}
      />
      
      <InteractionPrompt
        message="to pick up toy"
        visible={showToyPrompt}
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

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      <NowPlayingBar
        track={currentTrack ? tracks.find((t) => t.uri === currentTrack.uri) || null : null}
        isPlaying={isPlaying}
        onPlayPause={togglePlay}
      />
    </div>
  );
}
