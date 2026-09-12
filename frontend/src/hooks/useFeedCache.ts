import { useState, useEffect, useRef } from 'react';
import { Challenge, challengesApi, ChallengeFilterParams } from '../api/challenges';

// In-memory cache singleton
const feedCache: Record<string, { data: Challenge[]; timestamp: number }> = {};
const CACHE_TTL = 1000 * 15; // 15 seconds – matches auto-refresh polling

export function useFeedCache(key: string, fetchParams: ChallengeFilterParams) {
  const [data, setData] = useState<Challenge[]>(feedCache[key]?.data || []);
  const [isLoading, setIsLoading] = useState<boolean>(!feedCache[key]);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const lastFetchedKey = useRef<string>('');

  useEffect(() => {
    let isMounted = true;
    const cacheEntry = feedCache[key];
    const isStale = !cacheEntry || (Date.now() - cacheEntry.timestamp > CACHE_TTL);

    if (cacheEntry) {
      setData(cacheEntry.data);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    if (isStale || lastFetchedKey.current !== key) {
      setIsValidating(true);
      lastFetchedKey.current = key;

      challengesApi.getChallenges(fetchParams)
        .then((freshData) => {
          if (!isMounted) return;
          feedCache[key] = { data: freshData, timestamp: Date.now() };
          setData(freshData);
          setError(null);
        })
        .catch((err) => {
          if (isMounted) setError(err.message || 'Failed to fetch feed');
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
            setIsValidating(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [key]);

  // Method to manually update cache (e.g., after loading more items)
  const mutate = (newData: Challenge[] | ((prev: Challenge[]) => Challenge[])) => {
    setData((prev) => {
      const updated = typeof newData === 'function' ? newData(prev) : newData;
      feedCache[key] = { data: updated, timestamp: Date.now() };
      return updated;
    });
  };

  return { data, isLoading, isValidating, error, mutate };
}
