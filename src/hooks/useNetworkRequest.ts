import { useCallback } from 'react';

const DEFAULT_TIMEOUT = 8000; // 8 секунд

export function useNetworkRequest() {
  const fetchWithTimeout = useCallback(async (
    url: string,
    options: RequestInit = {},
    timeout = DEFAULT_TIMEOUT
  ): Promise<Response> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timer);
    }
  }, []);

  return { fetchWithTimeout };
}
