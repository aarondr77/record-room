import { useState, useEffect } from 'react';
import { fetchPlaylist } from '../lib/spotify';
import type { SpotifyPlaylist } from '../types';

export function usePlaylist(accessToken: string | null) {
  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track if we've attempted a fetch - helps avoid race conditions
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setPlaylist(null);
      setHasFetched(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchPlaylist(accessToken)
      .then((data) => {
        setPlaylist(data as SpotifyPlaylist);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to fetch playlist');
        console.error('Error fetching playlist:', err);
      })
      .finally(() => {
        setIsLoading(false);
        setHasFetched(true);
      });
  }, [accessToken]);

  return { playlist, isLoading, error, hasFetched };
}

