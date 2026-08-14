import { useEffect, useRef, useState } from 'react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || ' ';

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

/**
 * React hook for real-time polling of an API endpoint.
 * @param {string} path - API path to poll
 * @param {number} intervalMs - Polling interval in ms (default 20000 = 20s)
 * @param {any} initialValue - Initial state value
 */
export function usePoll(path, intervalMs = 20000, initialValue = null) {
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let timer = null;

    async function poll() {
      if (!path) {
        if (mountedRef.current) setLoading(false);
        return;
      }
      try {
        const result = await fetchApi(path);
        if (mountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mountedRef.current) setError(err.message);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    }

    poll();
    timer = setInterval(poll, intervalMs);

    return () => {
      mountedRef.current = false;
      clearInterval(timer);
    };
  }, [path, intervalMs]);

  return { data, loading, error, reload: () => fetchApi(path).then(setData) };
}
