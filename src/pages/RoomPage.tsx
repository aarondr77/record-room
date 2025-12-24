import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import type { SpotifyTrack, SpotifyUser, ToyState, HatState, LampState } from '../types';
import { FLOOR_Y, FLOOR_Z } from '../types';
import './RoomPage.css';


interface RoomPageProps {
  tracks: SpotifyTrack[];
  currentUser: SpotifyUser;
  accessToken: string;
}

// Initial toy position on the floor
const INITIAL_TOY_POSITION = { x: 2, y: FLOOR_Y, z: FLOOR_Z };

// Initial hat position on the floor (different from toy)
const INITIAL_HAT_POSITION = { x: -2, y: FLOOR_Y, z: FLOOR_Z };

export function RoomPage({ tracks, currentUser, accessToken }: RoomPageProps) {
  // Toy state management
  const [toyState, setToyState] = useState<ToyState>({
    position: INITIAL_TOY_POSITION,
    isCarried: false,
  });

  // Hat state management
  const [hatState, setHatState] = useState<HatState>({
    position: INITIAL_HAT_POSITION,
    isWorn: false,
  });

  // Lamp state management (lamp is on a shelf at position [4, -1.4, 0.8])
  const [lampState, setLampState] = useState<LampState>({
    position: { x: 4, y: -1.4, z: 0.8 },
    isWorn: false,
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

  // Handlers for hat pickup and drop
  const handlePickupHat = useCallback(() => {
    setHatState(prev => ({ ...prev, isWorn: true }));
  }, []);

  const handleDropHat = useCallback((x: number, z: number) => {
    setHatState({
      position: { x, y: FLOOR_Y, z },
      isWorn: false,
    });
  }, []);

  // Handlers for lamp pickup and drop
  const handlePickupLamp = useCallback(() => {
    setLampState(prev => ({ ...prev, isWorn: true }));
  }, []);

  // Use ref to track platform for drop handler
  const platformRef = useRef<number>(0);
  
  const handleDropLamp = useCallback((x: number, z: number) => {
    const currentPlatform = getPlatform(platformRef.current);
    const dropY = currentPlatform?.type === 'shelf' ? currentPlatform.position.y - 1 : FLOOR_Y;
    setLampState({
      position: { x, y: dropY, z },
      isWorn: false,
    });
  }, []);

  const catState = useCatMovement({ 
    trackCount: tracks.length,
    toyState,
    hatState,
    lampState,
    onPickupToy: handlePickupToy,
    onDropToy: handleDropToy,
    onPickupHat: handlePickupHat,
    onDropHat: handleDropHat,
    onPickupLamp: handlePickupLamp,
    onDropLamp: handleDropLamp,
  });

  // Update platform ref when catState changes
  useEffect(() => {
    platformRef.current = catState.platform;
  }, [catState.platform]);
  
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

  // Check if cat is on the medal case (can zoom in on medal)
  const isNearMedal = useMemo(() => {
    const currentPlatform = getPlatform(catState.platform);
    if (!currentPlatform) return false;
    
    // Only trigger when cat is on the medal platform itself
    return currentPlatform.type === 'medal';
  }, [catState.platform]);
  
  // Only fetch notes when modal is open
  const { notes, isLoading: isLoadingNotes, createNote, deleteNote } = useNotes(trackId, isModalOpen);
  
  // Track current playing index for auto-play next
  const currentPlayingIndexRef = useRef<number | null>(null);
  
  // Callback when a track ends - play the next one
  const handleTrackEnd = useCallback(() => {
    const currentIndex = currentPlayingIndexRef.current;
    if (currentIndex !== null && currentIndex < tracks.length - 1) {
      const nextIndex = currentIndex + 1;
      const nextTrack = tracks[nextIndex];
      currentPlayingIndexRef.current = nextIndex;
      // playTrack will be available from the hook
      // We need to call it via a ref since the hook isn't initialized yet
      playTrackRef.current?.(nextTrack.uri);
    }
  }, [tracks]);
  
  const { isPlaying, currentTrack, playTrack, togglePlay, position, duration } = useSpotifyPlayer(accessToken, {
    onTrackEnd: handleTrackEnd,
  });
  
  // Keep playTrack ref updated for the callback
  const playTrackRef = useRef(playTrack);
  useEffect(() => {
    playTrackRef.current = playTrack;
  }, [playTrack]);
  
  // Update current playing index when track changes
  useEffect(() => {
    if (currentTrack) {
      const index = tracks.findIndex(t => t.uri === currentTrack.uri);
      if (index !== -1) {
        currentPlayingIndexRef.current = index;
      }
    }
  }, [currentTrack, tracks]);

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
  
  // Show hat prompt when near hat on floor and not wearing
  const showHatPrompt = catState.isNearHat && !hatState.isWorn && !isModalOpen && !isMedalZoomed;
  
  // Show lamp prompt when near lamp on shelf and not wearing
  const showLampPrompt = catState.isNearLamp && !lampState.isWorn && !isModalOpen && !isMedalZoomed;
  
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
          hatState={hatState}
          lampState={lampState}
          onRecordClick={handleRecordClick}
          isZoomed={isMedalZoomed}
          zoomTarget={zoomTarget}
          isPlaying={isPlaying}
        />
      </div>

      <div className="interaction-prompts-container">
        <InteractionPrompt
          message="to open record"
          visible={showPrompt}
          keyLabel="Space"
        />
        
        <InteractionPrompt
          message="to pick up toy"
          visible={showToyPrompt}
          keyLabel="G"
        />
        
        <InteractionPrompt
          message="to put on hat"
          visible={showHatPrompt}
          keyLabel="G"
        />
        
        <InteractionPrompt
          message="to put on lamp"
          visible={showLampPrompt}
          keyLabel="G"
        />
        
        <InteractionPrompt
          message="to view medal"
          visible={showMedalPrompt}
          keyLabel="Space"
        />
        
        <InteractionPrompt
          message="to exit"
          visible={showMedalExitPrompt}
          keyLabel="Space"
        />
        
        <InteractionPrompt
          message="to do pullup on window"
          visible={showWindowPullupPrompt}
          keyLabel="Space"
        />
      </div>

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
        onPlayPause={async () => {
          try {
            await togglePlay();
          } catch (err) {
            console.error('Failed to toggle play:', err);
          }
        }}
      />
    </div>
  );
}
