// src/app/listener/layout.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AudioEngineProvider, useAudioEngine } from '@/context/AudioContext';
// Import your Supabase client bundle
import { createClient } from '@/utils/supabase/client';

function ListenerLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  // 1. EXTRACT NEW HANDLERS FROM THE RECONFIGURED AUDIO CONTEXT ENGINE
  const { 
    currentStation, 
    isPlaying, 
    volume, 
    togglePlayPause, 
    changeVolume, 
    disconnectStream 
  } = useAudioEngine();
  
  // State to manage button loading states during execution trace checking
  const [checkingAccess, setCheckingAccess] = useState(false);
  const supabase = createClient();

  // Secure Interception Checkpoint Route Guard
  const handleBecomeBroadcaster = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (checkingAccess) return;
    
    setCheckingAccess(true);

    try {
      // Fetch current authenticated session profile context
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }

      // Query the database table for an active billing row match
      const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error("Database permission validation error node:", error);
        alert("Verification failure code: Could not query user schema parameters.");
        setCheckingAccess(false);
        return;
      }

      // Routing Guard Filter Block
      if (subscription && subscription.status === 'active') {
        // Safe access confirmed! Direct verified subscriber straight to studio panel
        router.push('/broadcaster/dashboard');
      } else {
        // Block free listener bypass. Trigger secure interception down to payments paywall!
        alert("🔒 Premium Studio Token Required: Please select an active broadcasting plan tier to deploy your custom streaming node channels.");
        router.push('/pricing');
      }
    } catch (err) {
      console.error("Unexpected authentication verification failure:", err);
    } finally {
      setCheckingAccess(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-900 text-slate-100 font-sans overflow-hidden relative">
      
      {/* 1. PERSISTENT SIDEBAR */}
      <aside className="w-64 min-w-[260px] bg-slate-950 border-r border-slate-800 flex flex-col justify-between h-full flex-shrink-0 z-20">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-black tracking-wider text-orange-500">AfriBlast</h1>
            <p className="text-xs text-slate-400">Audio Hub</p>
          </div>
          
          <nav className="mt-6 px-4 space-y-1">
            <Link 
              href="/listener" 
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                pathname === '/listener' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🔍 Discover Streams
            </Link>
            <Link 
              href="/listener/library" 
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                pathname === '/listener/library' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              📚 My Library
            </Link>
            <Link 
              href="/listener/marketplace" 
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
                pathname === '/listener/marketplace' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              🛒 Materials Marketplace
            </Link>
          </nav>
        </div>

        {/* UPGRADE CALL TO ACTION PANEL */}
        <div className="p-4 m-4 bg-gradient-to-br from-orange-600/20 to-amber-600/5 rounded-xl border border-orange-500/20 space-y-3">
          <div>
            <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Have a Voice?</h4>
            <p className="text-[11px] text-slate-300 mt-1">Start your own live audio channel, upload study guides, and monetize your knowledge.</p>
          </div>
          
          <button 
            onClick={handleBecomeBroadcaster}
            disabled={checkingAccess}
            className="w-full text-center bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 px-3 rounded-md transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {checkingAccess ? "🔑 Verifying Access..." : "🎙️ Become a Broadcaster"}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT SHELL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 min-h-[64px] bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8 z-10 w-full">
          <div className="text-sm font-medium text-slate-400 truncate pr-4">
            Welcome to the airwaves ✨
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-orange-400 flex-shrink-0">
            AL
          </div>
        </header>

        {/* Page Content Body View */}
        <main className={`flex-1 overflow-y-auto p-8 bg-slate-900 w-full ${currentStation ? 'pb-32' : 'pb-8'}`}>
          {children}
        </main>
      </div>

      {/* ================= PERSISTENT AUDIO PLAYER BAR ================= */}
      {currentStation && (
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 h-24 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-6 md:px-8 flex items-center justify-between z-50 shadow-2xl transition-all">
          
          {/* LEFT SIDE: STATION METADATA DISPLAY */}
          <div className="flex items-center space-x-4 w-1/4 min-w-[200px]">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center text-xl shadow-lg shadow-orange-600/10 shrink-0">
              🎙️
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{currentStation.full_name || currentStation.title}</p>
              <p className="text-xs text-orange-400 font-mono truncate">Live: @{currentStation.username || 'broadcaster'}</p>
            </div>
          </div>

          {/* CENTER: CORE AUDIO MANIPULATION ENGINE CONTROLS */}
          <div className="flex flex-col items-center space-y-2 w-2/4">
            <div className="flex items-center space-x-6">
              {/* PLAY / PAUSE INTERACTIVE TOGGLE */}
              <button 
                onClick={togglePlayPause}
                className="w-10 h-10 rounded-full bg-white hover:bg-orange-500 text-slate-950 hover:text-white flex items-center justify-center text-sm font-black transition transform hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                title={isPlaying ? "Pause Stream" : "Play Stream"}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
            </div>

            {/* AUDIO TIMELINE PIPELINE STATUS BAR */}
            <div className="flex items-center space-x-3 w-full max-w-md">
              <span className="text-[10px] font-mono text-slate-500">LIVE</span>
              <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden relative">
                {isPlaying ? (
                  <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full animate-pulse" />
                ) : (
                  <div className="absolute top-0 left-0 h-full w-1/3 bg-slate-600 rounded-full" />
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isPlaying ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                )}
                <span className="text-[10px] font-mono text-slate-400">
                  {isPlaying ? 'Streaming' : 'Paused'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: VOLUME UTILITY TOOLS */}
          <div className="flex items-center justify-end space-x-4 w-1/4 min-w-[180px]">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl">
              <span className="text-xs text-slate-400">
                {volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : '🔊'}
              </span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={Math.round(volume * 100)}
                className="w-16 md:w-20 accent-orange-500 h-1 bg-slate-700 rounded-lg cursor-pointer appearance-none" 
                onChange={(e) => changeVolume(parseFloat(e.target.value) / 100)}
              />
            </div>

            <button 
              onClick={disconnectStream}
              className="text-xs font-semibold bg-slate-900 border border-slate-800 hover:bg-red-950/40 hover:border-red-900/40 hover:text-red-400 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              Disconnect ✖
            </button>
          </div>

        </div>
      )}

    </div>
  );
}

export default function ListenerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AudioEngineProvider>
      <ListenerLayoutContent>{children}</ListenerLayoutContent>
    </AudioEngineProvider>
  );
}