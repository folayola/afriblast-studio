// src/app/broadcaster/studio/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface ChatMessage {
  id: string;
  sender_name: string;
  message_text: string;
  timestamp: string;
}

export default function LiveAudioStudioRoom() {
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState('');

  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Studio Engineering Operation States
  const [isLive, setIsLive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [streamTitle, setStreamTitle] = useState('Loading broadcast parameters...');
  const [activeListeners, setActiveListeners] = useState(134); // Interactive mock metrics count
  
  // Realtime Chat Matrix States
  const [currentUser, setCurrentUser] = useState<string>('Broadcaster');
  const [chatInput, setChatInput] = useState('');
  const [chatFeed, setChatFeed] = useState<ChatMessage[]>([]);
  const realtimeChannelRef = useRef<any>(null);

  // OBS Encryption Keys Reveal States
  const [showStreamKey, setShowStreamKey] = useState(false);
  const [streamKey, setStreamKey] = useState('live_749204712_afriblast_node_prod_x97b'); 
  const rtmpServerUrl = 'rtmp://stream.afriblast.com/live';

  // 1. Download verified profile context details and stream preset tags
  useEffect(() => {
    async function runSubscriptionGatekeeper() {
      try {
        setCheckingAccess(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRejectionMessage('Active login credentials could not be verified.');
          setHasAccess(false);
          return;
        }

        // Pull full profile details
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('subscription_tier, subscription_status, trial_ends_at')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          setRejectionMessage('No subscription profile row discovered for this user identifier.');
          setHasAccess(false);
          return;
        }

        // --- ULTRA-SAFE STRING NORMALIZATION ---
        const userTier = (profile.subscription_tier || '').toLowerCase().trim();
        const subStatus = (profile.subscription_status || '').toLowerCase().trim();

        console.log("🛡️ Studio Debug Portal:", { fetchedTier: userTier, fetchedStatus: subStatus });

        // Force access if the tier contains 'pro' or 'enterprise' OR if status is explicitly active
        if (userTier.includes('pro') || userTier.includes('enterprise') || subStatus === 'active') {
          setHasAccess(true);
          return;
        }

        // Check for active trials as a fallback
        if (userTier.includes('trial')) {
          const expirationDate = new Date(profile.trial_ends_at).getTime();
          if (expirationDate > Date.now()) {
            setHasAccess(true);
            return;
          }
        }

        setRejectionMessage(`Access Denied. Found Tier: "${profile.subscription_tier}", Status: "${profile.subscription_status}". A paid account status mapping is required.`);
        setHasAccess(false);

      } catch (err) {
        console.error('Subscription gatekeeper runtime crash:', err);
      } finally {
        setCheckingAccess(false);
      }
    }

    runSubscriptionGatekeeper();
  }, [supabase]);

  useEffect(() => {
    async function initializeStudioContext() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, current_stream_title, id')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          if (data.full_name) setCurrentUser(data.full_name);
          if (data.current_stream_title) setStreamTitle(data.current_stream_title);
          // Set a unique stream key based on user ID node if needed
          setStreamKey(`ab_${data.id.substring(0, 8)}_stream_secure`);
        }
      } catch (err) {
        console.error('Error establishing audio studio data matrix:', err);
      }
    }

    initializeStudioContext();
  }, [supabase]);

  // 2. Wire up the Supabase Realtime WebSocket Room for live interactive texting
  useEffect(() => {
    const channelName = `studio_chat_global_node`;
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    channel.on('broadcast', { event: 'new_chat_text' }, (payload: any) => {
      const incomingMsg: ChatMessage = payload.payload;
      setChatFeed((prev) => [...prev, incomingMsg]);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('📡 Connected to Supabase Realtime Broadcast Node!');
      }
    });

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatFeed]);

  const dispatchChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !realtimeChannelRef.current) return;

    const textPayload: ChatMessage = {
      id: crypto.randomUUID(),
      sender_name: `${currentUser} (Host)`,
      message_text: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    await realtimeChannelRef.current.send({
      type: 'broadcast',
      event: 'new_chat_text',
      payload: textPayload,
    });

    setChatInput('');
  };

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-xs font-mono text-slate-500">
        🛡️ Validating broadcaster license matrices & network trial tokens...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 bg-slate-950 text-white">
        <div className="max-w-md w-full bg-slate-950 border border-slate-900 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-12 h-12 bg-orange-600/10 border border-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center text-xl mx-auto">
            🔒
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold tracking-tight">Studio Access Revoked</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {rejectionMessage} Broadcasters must maintain active subscriptions or ongoing verification trials to initiate real-time audio server links.
            </p>
          </div>
          <div className="pt-2">
            <Link 
              href="/pricing" 
              className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-md shadow-orange-600/10"
            >
              💳 Select or Renew Your Account Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner Control Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-slate-700'}`} />
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Active Transmission Status</span>
            <h4 className="text-xs font-bold text-white uppercase font-mono">{isLive ? '🔴 LIVE STREAM ONLINE' : '⚪ STUDIO OFFLINE'}</h4>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right font-mono text-xs text-slate-400">
            👥 <span className="text-emerald-400 font-bold">{isLive ? activeListeners : 0}</span> Tuned In
          </div>
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-md ${
              isLive 
                ? 'bg-slate-900 hover:bg-slate-800 text-red-400 border border-red-500/20' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/10'
            }`}
          >
            {isLive ? 'STOP BROADCAST' : 'GO LIVE NOW'}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[550px]">
        
        {/* ================= LEFT CONTROLS: MIC & OBS SETUP CONFIGURATION ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider">Active Room Meta</span>
              <h3 className="text-sm font-bold text-white mt-1 leading-snug">{streamTitle}</h3>
            </div>

            {/* Microphone State Box */}
            <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 flex flex-col items-center justify-center space-y-3 py-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                !isLive ? 'bg-slate-800 text-slate-600' : isMuted ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500 animate-pulse'
              }`}>
                <span className="text-lg">{isMuted ? '🔇' : '🎙️'}</span>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-white">{!isLive ? 'Microphone Dormant' : isMuted ? 'Audio Input Muted' : 'Audio Input Hot'}</p>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                disabled={!isLive}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 font-bold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
              >
                {isMuted ? '🎙️ Unmute Mic' : '🔇 Mute Mic'}
              </button>
            </div>

            {/* ================= DYNAMIC OBS STREAMING PANEL ================= */}
            <div className="border-t border-slate-900 pt-4 space-y-3">
              <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider block">
                External Encoder Setup (OBS / Mixlr)
              </span>

              {isLive ? (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Open your streaming client (e.g., **OBS Studio**), navigate to **Settings &rarr; Stream**, set your service target to **Custom...**, and insert these parameters:
                  </p>
                  
                  {/* Server URL Input Group */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wide block">Server / RTMP URL</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={rtmpServerUrl}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 font-mono outline-none"
                      />
                      <button 
                        type="button" 
                        onClick={() => { navigator.clipboard.writeText(rtmpServerUrl); alert('Server URL Copied!'); }}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white px-2.5 rounded-lg text-[10px] transition font-bold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>

                  {/* Stream Key Input Group */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wide block">Stream Key</label>
                    <div className="flex gap-2">
                      <input 
                        type={showStreamKey ? "text" : "password"} 
                        readOnly 
                        value={streamKey}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-orange-400/90 font-mono tracking-wide outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowStreamKey(!showStreamKey)}
                        className="bg-slate-900 border border-slate-800 text-slate-400 text-[10px] px-2 rounded-lg font-bold"
                      >
                        {showStreamKey ? 'Hide' : 'Show'}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { navigator.clipboard.writeText(streamKey); alert('Stream Key Copied!'); }}
                        className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white px-2.5 rounded-lg text-[10px] transition font-bold"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-orange-600/5 border border-orange-500/10 rounded-xl p-3 text-[10px] text-slate-400 leading-normal">
                    💡 **Audio Encoding Rule:** Set your OBS output audio bitrate configuration to **128kbps (Opus/AAC)** for optimal performance across Nigerian mobile networks.
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-4 text-center py-6 text-slate-600 text-xs">
                  <span>💤 Pipeline offline.</span>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1">
                    Click the **Go Live Now** toggle on the upper control deck to generate server stream endpoints and handshake tokens.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick System Monitoring Diagnostic Display */}
          <div className="border-t border-slate-900 pt-3 font-mono text-[9px] text-slate-500 space-y-1">
            <div className="flex justify-between"><span>Codec Node:</span><span className="text-slate-400">Opus Audio Multi-Channel</span></div>
            <div className="flex justify-between"><span>Server Pipeline:</span><span className="text-slate-400">AzuraCast Edge Relay</span></div>
            <div className="flex justify-between"><span>Latency Metric:</span><span className="text-emerald-500 font-bold">{isLive ? '~140ms' : '0ms'}</span></div>
          </div>
        </div>

        {/* ================= RIGHT CONTROLS: INTERACTIVE CHAT STATION ================= */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
          
          <div className="bg-slate-950 border-b border-slate-900 px-5 py-3.5 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">Live Chat</h3>
              <p className="text-[10px] text-slate-500">Realtime streaming sync enabled across listener portals.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-orange-600/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-md">
              Supabase Realtime v3
            </span>
          </div>

          {/* Core Interactive Messages Scroll Window */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-950/40 space-y-4 custom-scrollbar">
            {chatFeed.map((msg) => (
              <div key={msg.id} className="space-y-1 group animate-fade-in">
                <div className="flex items-baseline justify-between gap-4">
                  <span className={`text-[11px] font-bold ${msg.sender_name.includes('(Host)') ? 'text-orange-400 font-extrabold' : 'text-slate-300'}`}>
                    {msg.sender_name}
                  </span>
                  <span className="text-[9px] font-mono text-slate-600 tracking-tighter shrink-0">{msg.timestamp}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/40 border border-slate-900 px-3 py-2 rounded-xl w-fit max-w-[85%]">
                  {msg.message_text}
                </p>
              </div>
            ))}

            {chatFeed.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 text-xs py-24 space-y-2">
                <span>💬 Classroom chat module online.</span>
                <p className="text-[10px] text-slate-700 max-w-xs">When listeners post text questions during live events, updates will stream down here instantly.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Interactive Input Form Base */}
          <div className="bg-slate-950 border-t border-slate-900 p-4">
            <form onSubmit={dispatchChatMessage} className="flex gap-2">
              <input
                type="text"
                placeholder={isLive ? "Cast real-time announcement instructions down into the stream classroom..." : "Go live above to enable global text broad-casting links..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={!isLive}
                className="flex-1 bg-slate-900 border border-slate-800 disabled:opacity-40 disabled:placeholder-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition font-medium"
              />
              <button
                type="submit"
                disabled={!isLive || !chatInput.trim()}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-900 disabled:text-slate-700 border disabled:border-slate-800 border-transparent text-white font-bold text-xs px-5 rounded-xl transition shadow-lg shadow-orange-600/10 whitespace-nowrap"
              >
                Send Text
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}