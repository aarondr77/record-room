import { useState, useEffect, useCallback, useMemo } from 'react';
import { Room } from '../components/canvas/Room';
import { RecordModal } from '../components/ui/RecordModal';
import { NowPlayingBar } from '../components/ui/NowPlayingBar';
import { InteractionPrompt } from '../components/ui/InteractionPrompt';
import { HelpIcon } from '../components/ui/HelpIcon';
import { HelpModal } from '../components/ui/HelpModal';
import { useCatMovement } from '../hooks/useCatMovement';
import { useNotes } from '../hooks/useNotes';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { getMedalPlatform, getPlatform } from '../config/platforms';
import type { SpotifyTrack, SpotifyUser, ToyState } from '../types';
import { FLOOR_Y, FLOOR_Z } from '../types';
import './RoomPage.css';

// Medal grid position - must match platforms.ts
const MEDAL_COL = 3;

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
  const [isMedalZoomed, setIsMedalZoomed] = useState(false);
  
  const selectedTrack = selectedTrackIndex !== null ? tracks[selectedTrackIndex] : null;
  const trackId = selectedTrack?.id || null;
  
  // Get medal platform position for zoom target
  const medalPlatform = useMemo(() => getMedalPlatform(), []);
  const zoomTarget = useMemo(() => {
    if (!medalPlatform) return undefined;
    return {
      x: medalPlatform.position.x,
      y: medalPlatform.position.y,
      z: medalPlatform.position.z,
    };
  }, [medalPlatform]);

  // Check if cat is on or near the medal case (can zoom in on medal)
  // Cat can be on the medal platform itself OR on the shelf directly below
  const isNearMedal = useMemo(() => {
    const currentPlatform = getPlatform(catState.platform);
    if (!currentPlatform) return false;
    
    // Cat is on the medal case itself
    if (currentPlatform.type === 'medal') {
      return true;
    }
    
    // Cat is on shelf directly below medal (row 1, same column as medal)
    if (currentPlatform.type === 'shelf' && 
        currentPlatform.grid.row === 1 && 
        currentPlatform.grid.col === MEDAL_COL) {
      return true;
    }
    
    return false;
  }, [catState.platform]);
  
  // Only fetch notes when modal is open
  const { notes, isLoading: isLoadingNotes, createNote, deleteNote } = useNotes(trackId, isModalOpen);
  const { isPlaying, currentTrack, playTrack, togglePlay, position, duration } = useSpotifyPlayer(accessToken);

  // Handle Space key to open modal or zoom medal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't prevent default if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      
      if (e.key === ' ') {
        e.preventDefault();
        
        // If already zoomed on medal, exit zoom
        if (isMedalZoomed) {
          setIsMedalZoomed(false);
          return;
        }
        
        // If near medal, zoom in on it
        if (isNearMedal && !isModalOpen) {
          setIsMedalZoomed(true);
          return;
        }
        
        // Otherwise, open record modal if on a record
        if (catState.currentTrackIndex !== null && !isModalOpen) {
          setSelectedTrackIndex(catState.currentTrackIndex);
          setIsModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [catState.currentTrackIndex, isNearMedal, isMedalZoomed, isModalOpen]);

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

  const showPrompt = catState.currentTrackIndex !== null && !isModalOpen && !isMedalZoomed && !isNearMedal;
  
  // Show toy prompt when near toy on floor and not carrying
  const showToyPrompt = catState.isNearToy && !toyState.isCarried && !isModalOpen && !isMedalZoomed;
  
  // Show medal prompt when near medal (not zoomed in yet)
  const showMedalPrompt = isNearMedal && !isMedalZoomed && !isModalOpen;
  
  // Show exit prompt when zoomed in on medal
  const showMedalExitPrompt = isMedalZoomed;
  
  // Show window pullup prompt when on window and not already pulling up
  const currentPlatform = getPlatform(catState.platform);
  const showWindowPullupPrompt = currentPlatform?.type === 'window' && !catState.startPullup && !isModalOpen && !isMedalZoomed;

  return (
    <div className="room-page">
      <HelpIcon onClick={() => setIsHelpModalOpen(true)} />
      
      <div className="room-scene-container">
        <Room
          tracks={tracks}
          catState={catState}
          toyState={toyState}
          onRecordClick={handleRecordClick}
          isZoomed={isMedalZoomed}
          zoomTarget={zoomTarget}
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
      
      <InteractionPrompt
        message="to view medal"
        visible={showMedalPrompt}
      />
      
      <InteractionPrompt
        message="to exit"
        visible={showMedalExitPrompt}
      />
      
      <InteractionPrompt
        message="to do pullup on window"
        visible={showWindowPullupPrompt}
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
