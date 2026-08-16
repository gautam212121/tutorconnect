import { useEffect, useRef, useState, useCallback } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const apiUrl = (path) => `${BASE_URL}${path}`;

export const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('verifiedtutor-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchApi(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || response.statusText || 'API request failed');
  }
  return data;
}

// In-memory cache: { [path]: { data, timestamp } }
const cache = new Map();
const CACHE_TTL = 8000; // 8 seconds fresh cache — avoid duplicate fetches

/**
 * React hook for polling an API endpoint with cache deduplication.
 * @param {string|null} path - API path to poll (pass null to skip)
 * @param {number} intervalMs - Polling interval in ms (default 30000 = 30s)
 * @param {any} initialValue - Initial state value
 */
export function usePoll(path, intervalMs = 30000, initialValue = null) {
  const [data, setData] = useState(() => {
    // Serve from cache immediately if fresh
    if (path && cache.has(path)) {
      const cached = cache.get(path);
      if (Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
    }
    return initialValue;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const timerRef = useRef(null);

  const poll = useCallback(async (force = false) => {
    if (!path) {
      if (mountedRef.current) setLoading(false);
      return;
    }

    // Use cache if fresh and not forced
    if (!force && cache.has(path)) {
      const cached = cache.get(path);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        if (mountedRef.current) {
          setData(cached.data);
          setLoading(false);
        }
        return;
      }
    }

    try {
      const result = await fetchApi(path);
      cache.set(path, { data: result, timestamp: Date.now() });
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    poll();

    // Set up polling interval
    timerRef.current = setInterval(() => poll(true), intervalMs);

    return () => {
      mountedRef.current = false;
      clearInterval(timerRef.current);
    };
  }, [path, intervalMs, poll]);

  const reload = useCallback(() => {
    // Clear cache for this path and force re-fetch
    if (path) cache.delete(path);
    return poll(true);
  }, [path, poll]);

  return { data, loading, error, reload };
}
