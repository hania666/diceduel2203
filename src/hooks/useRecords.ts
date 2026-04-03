import { useState, useEffect, useCallback } from 'react';

const SUPABASE_URL = 'https://wxmhulfkckhejizkgjpc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4bWh1bGZrY2toZWppemtnanBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMDQ4MTAsImV4cCI6MjA4OTc4MDgxMH0.sp3BfZt_SYC2dafcemy-ZWYUWClSFp_A4TO_uRM8BR8';

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Prefer': 'return=representation',
};

export interface Record {
  id: string;
  wallet_address: string;
  short_address: string;
  win_amount: number;
  bet_type: string;
  multiplier: number;
  is_boss: boolean;
  created_at: string;
}

export function useRecords() {
  const [dailyRecords, setDailyRecords] = useState<Record[]>([]);
  const [weeklyRecords, setWeeklyRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [dayRes, weekRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/records?created_at=gte.${dayAgo}&order=win_amount.desc&limit=10`, { headers: HEADERS }),
        fetch(`${SUPABASE_URL}/rest/v1/records?created_at=gte.${weekAgo}&order=win_amount.desc&limit=10`, { headers: HEADERS }),
      ]);

      const [dayData, weekData] = await Promise.all([dayRes.json(), weekRes.json()]);
      if (Array.isArray(dayData)) setDailyRecords(dayData);
      if (Array.isArray(weekData)) setWeeklyRecords(weekData);
    } catch (e) {
      console.warn('Records fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRecord = useCallback(async (
    walletAddress: string,
    winAmount: number,
    betType: string,
    multiplier: number,
    isBoss: boolean,
  ) => {
    if (winAmount <= 0) return;
    const shortAddress = walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/records`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({
          wallet_address: walletAddress,
          short_address: shortAddress,
          win_amount: winAmount,
          bet_type: betType,
          multiplier,
          is_boss: isBoss,
        }),
      });
      await fetchRecords();
    } catch (e) {
      console.warn('Add record error:', e);
    }
  }, [fetchRecords]);

  useEffect(() => {
    fetchRecords();
  }, []);

  return { dailyRecords, weeklyRecords, loading, fetchRecords, addRecord };
}
