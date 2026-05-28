// src/app/listener/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAudioEngine } from '@/context/AudioContext';

interface BroadcasterProfile {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url: string | null;
}

export default function ListenerDashboard() {
  const supabase = createClient();
  const { tuneIn, currentStation } = useAudioEngine();

  // Component States
  const [broadcasters, setBroadcasters] = useState<BroadcasterProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch real broadcasters from Supabase profiles table
  useEffect(() => {
    async function fetchBroadcasters() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, bio, avatar_url')
          .eq('role', 'broadcaster');

        if (error) {
          console.error('Error fetching broadcasters:', error.message);
        } else if (data) {
          setBroadcasters(data as BroadcasterProfile[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchBroadcasters();
  }, [supabase]);

  // Search Filter
  const filteredBroadcasters = broadcasters.filter((profile) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (profile.full_name?.toLowerCase() || '').includes(searchLower) ||
      (profile.username?.toLowerCase() || '').includes(searchLower) ||
      (profile.bio?.toLowerCase() || '').includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        📊 Connecting to database and scanning the airwaves...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      
      {/* Header Search Dashboard Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Discover Airwaves</h2>
          <p className="text-sm text-slate-400">Tune into live classrooms and creators pulling directly from your Postgres backend cloud node.</p>
        </div>
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="Search broadcasters or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* DYNAMIC BROADCASTER LIVE FEED */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Channels</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBroadcasters.map((profile) => (
            <div 
              key={profile.id} 
              className={`bg-slate-950 rounded-xl border p-5 flex flex-col justify-between space-y-4 transition hover:border-slate-700 ${currentStation?.id === profile.id ? 'border-orange-500/50 ring-1 ring-orange-500/20' : 'border-slate-800'}`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold bg-orange-600/10 border border-orange-500/20 px-2 py-0.5 rounded text-orange-400">
                    📻 Channel
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base line-clamp-1">{profile.full_name || 'Anonymous Creator'}</h4>
                  <p className="text-xs text-orange-500 font-mono mt-0.5">@{profile.username}</p>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 pt-1">{profile.bio || 'No custom stream bio written yet.'}</p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                <span className="text-xs text-slate-500">Free Access</span>
                <button
                  onClick={() => tuneIn(profile)}
                  className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-1.5 rounded-lg transition"
                >
                  {currentStation?.id === profile.id ? '🎯 Tuning In' : '🎧 Tune In'}
                </button>
              </div>
            </div>
          ))}

          {filteredBroadcasters.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 text-sm bg-slate-950/40 rounded-xl border border-slate-800/50">
              No registered broadcasters are matching your parameters.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}