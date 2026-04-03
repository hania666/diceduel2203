import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = 'https://wxmhulfkckhejizkgjpc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bWh1bGZrY2toZWppemtnanBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDQ4MTAsImV4cCI6MjA4OTc4MDgxMH0.sp3BfZt_SYC2dafcemy-ZWYUWClSFp_A4TO_uRM8BR8';
const HEADERS = { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Prefer': 'return=representation' };
const CACHE_TTL = 60000;
const TIMEOUT = 8000;
let cache: any[] = [];
let cacheTime = 0;
let pending: any = null;
let timer: any = null;

async function req(url: string, opts: RequestInit = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT);
  try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
  finally { clearTimeout(t); }
}

export interface GlobalLeaderboardEntry {
  wallet_address: string; short_address: string; points: number;
  total_wins: number; total_games: number; best_streak: number; updated_at: string;
}

export function useSupabaseLeaderboard() {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboardEntry[]>(cache);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && cache.length > 0 && now - cacheTime < CACHE_TTL) { setGlobalLeaderboard(cache); return; }
    setLoading(true);
    try {
      const res = await req(`${SUPABASE_URL}/rest/v1/leaderboard?order=points.desc&limit=10`, { headers: HEADERS });
      const data = await res.json();
      if (Array.isArray(data)) { cache = data; cacheTime = now; setGlobalLeaderboard(data); }
    } catch(e: any) {
      console.warn(e?.name === 'AbortError' ? 'Leaderboard timeout' : e);
      if (cache.length > 0) setGlobalLeaderboard(cache);
    } finally { setLoading(false); }
  }, []);

  const updateScore = useCallback(async (walletAddress: string, points: number, totalWins: number, totalGames: number, bestStreak: number) => {
    const shortAddress = walletAddress.slice(0,4) + '...' + walletAddress.slice(-4);
    pending = { walletAddress, shortAddress, points, totalWins, totalGames, bestStreak };
    if (timer) return;
    timer = setTimeout(async () => {
      const u = pending; pending = null; timer = null;
      if (!u) return;
      try {
        await req(`${SUPABASE_URL}/rest/v1/leaderboard`, {
          method: 'POST',
          headers: { ...HEADERS, 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify({ wallet_address: u.walletAddress, short_address: u.shortAddress, points: u.points, total_wins: u.totalWins, total_games: u.totalGames, best_streak: u.bestStreak, updated_at: new Date().toISOString() }),
        });
        cacheTime = 0;
      } catch(e: any) { console.warn(e?.name === 'AbortError' ? 'Update timeout' : e); }
    }, 5000);
  }, []);

  useEffect(() => { fetchLeaderboard(); }, []);
  return { globalLeaderboard, loading, fetchLeaderboard: () => fetchLeaderboard(true), updateScore };
}
