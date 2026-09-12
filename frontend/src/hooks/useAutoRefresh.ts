import { useEffect, useRef } from 'react';

/**
 * useAutoRefresh
 * Calls `fetchFn` immediately and then every `intervalMs` milliseconds.
 * Cleans up on unmount or when dependencies change.
 *
 * @param fetchFn  - async function to call for refreshing data
 * @param intervalMs - polling interval in milliseconds (default: 15 seconds)
 * @param enabled  - set to false to pause polling
 */
export function useAutoRefresh(
  fetchFn: () => void | Promise<void>,
  intervalMs = 15000,
  enabled = true
) {
  const fetchRef = useRef(fetchFn);

  // Keep the ref up-to-date so the interval always uses the latest version
  useEffect(() => {
    fetchRef.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) return;

    // Fire immediately
    fetchRef.current();

    const id = setInterval(() => {
      fetchRef.current();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
