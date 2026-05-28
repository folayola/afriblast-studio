// src/app/listener/player/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ChatMessage {
  id: string;
  sender_name: string;
  message_text: string;
  timestamp: string;
}

export default function ListenerPlayerRoom() {
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audio Playback & Channel Connection States
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [streamTitle, setStreamTitle] = useState('Live Broadcast Event');
  const [hostName, setHostName] = useState('Broadcaster Channel');
  const [volume, setVolume] = useState(80);

  // Live Chat Matrix States
  const [listenerName, setListenerName] = useState('Anonymous Listener');
  const [chatInput, setChatInput] = useState('');
  const [chatFeed, setChatFeed] = useState<ChatMessage[]>([]);
  const realtimeChannelRef = useRef<any>(null);

  // 1. Fetch current active broadcaster profile data to show room details
  useEffect(() => {
    async function initializeListenerIdentity() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Try parsing current user's profile name to use in chat
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (data && data.full_name) {
          setListenerName(data.full_name);
        }

        // Fetch the most recent stream title parameter from the profiles table as a fallback mock
        const { data: streamData } = await supabase
          .from('profiles')
          .select('full_name, current_stream_title')
          .limit(1);
          
        if (streamData && streamData[0]) {
          if (streamData[0].current_stream_title) setStreamTitle(streamData[0].current_stream_title);
          if (streamData[0].full_name) setHostName(streamData[0].full_name);
        }
      } catch (err) {
        console.error('Error synchronizing listener environment:', err);
      }
    }

    initializeListenerIdentity();
  }, [supabase]);

  // 2. Connect to the global Supabase Realtime Broadcast room
  useEffect(() => {
    const channelName = `studio_chat_global_node`;
    
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
      },
    });

    // Handle incoming chat messages sent by anyone in the room
    channel.on('broadcast', { event: 'new_chat_text' }, (payload: any) => {
      const incomingMsg: ChatMessage = payload.payload;
      setChatFeed((prev) => [...prev, incomingMsg]);
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('📡 Listener successfully synced to Realtime Message Cluster!');
      }
    });

    realtimeChannelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Auto-scroll chat tray on new arrivals
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatFeed]);

  // Dispatches text through the shared realtime pipeline
  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !realtimeChannelRef.current) return;

    const textPayload: ChatMessage = {
      id: crypto.randomUUID(),
      sender_name: listenerName,
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

  const handleTuneInToggle = () => {
    if (isConnected) {
      setIsConnected(false);
      setIsPlaying(false);
    } else {
      setIsConnected(true);
      setIsPlaying(true);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Upper Status Feed Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Live Streaming Player</h2>
        <p className="text-sm text-slate-400">Tune into live audio broadcasts, sermons, and lectures with ultra-low data consumption.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[500px]">
        
        {/* ================= LEFT COLUMN: DIGITAL AUDIO PLAYER DECK ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Broadcaster Info */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-orange-500 tracking-wider font-mono">
                🎙️ Host Channel: {hostName}
              </span>
              <h3 className="text-base font-bold text-white leading-snug">{streamTitle}</h3>
            </div>

            {/* Visualizer & Tuning Interface Container */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center space-y-6 py-10">
              
              {/* Dynamic Waveform Visualizer simulation */}
              <div className="h-12 flex items-center gap-1">
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-1 bg-orange-500 rounded-full transition-all duration-300 ${
                      isPlaying ? 'animate-pulse' : 'h-2 bg-slate-800'
                    }`}
                    style={{ 
                      height: isPlaying ? `${Math.floor(Math.random() * 40) + 12}px` : '8px',
                      animationDelay: `${i * 75}ms`
                    }}
                  />
                ))}
              </div>

              {/* Core Audio Trigger Button */}
              <button
                onClick={handleTuneInToggle}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition shadow-lg text-lg ${
                  isConnected 
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/15' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/15'
                }`}
              >
                {isConnected ? '⏸️' : '▶️'}
              </button>

              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-white">
                  {isConnected ? 'Connected to Audio Stream' : 'Ready to Connect'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isConnected ? '⚡ Stream Quality: Highly Optimized (Opus 48kbps)' : 'Click play to connect to edge relay node'}
                </p>
              </div>

              {/* Volume Slider Controls */}
              {isConnected && (
                <div className="w-full flex items-center gap-3 pt-2 px-2">
                  <span className="text-xs text-slate-500">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-400 w-6">
                    {volume}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Infrastructure Diagnostic Feed */}
          <div className="border-t border-slate-900/80 pt-4 font-mono text-[10px] text-slate-500 space-y-1.5">
            <div className="flex justify-between"><span>Connection Link:</span><span className={isConnected ? "text-emerald-400 font-bold" : "text-slate-400"}>{isConnected ? "ACTIVE" : "DISCONNECTED"}</span></div>
            <div className="flex justify-between"><span>Edge Node Relay:</span><span className="text-slate-400">Lagos Main Hub</span></div>
            <div className="flex justify-between"><span>Bandwidth Metric:</span><span className="text-slate-400">{isConnected ? "~5.8 KB/s" : "0.0 KB/s"}</span></div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: AUDIO SYNCED CLASSROOM CHAT ================= */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl">
          
          {/* Chat Window Title Header */}
          <div className="bg-slate-950 border-b border-slate-900 px-5 py-3.5 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">Live Interaction Room Feed</h3>
              <p className="text-[10px] text-slate-500">Type questions or reactions into the live transmission channel.</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-orange-600/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-md">
              Realtime Sync Active
            </span>
          </div>

          {/* Messages Scroll Area */}
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
                <span>💬 Welcome to the Live Stream Room.</span>
                <p className="text-[10px] text-slate-700 max-w-xs">Be the first to leave a message or note for the host.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Text Input Base Form */}
          <div className="bg-slate-950 border-t border-slate-900 p-4">
            <form onSubmit={sendChatMessage} className="flex gap-2">
              <input
                type="text"
                placeholder="Type your message or ask a question live..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition font-medium"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-900 disabled:text-slate-700 border disabled:border-slate-800 border-transparent text-white font-bold text-xs px-5 rounded-xl transition shadow-lg shadow-orange-600/10 whitespace-nowrap"
              >
                Send Message
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}