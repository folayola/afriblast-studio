'use client';

import React, { useState } from 'react';

interface CredentialsProps {
  serverUrl: string;
  streamKey: string;
}

export default function StreamCredentialsCard({ serverUrl, streamKey }: CredentialsProps) {
  const [showKey, setShowKey] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-200">OBS Stream Integration Credentials</h3>
        <p className="text-xs text-slate-500">Use these unique integration vectors inside streaming hubs like OBS Studio to pipe live feeds directly onto AfriBlast.</p>
      </div>

      <div className="space-y-4">
        {/* SERVER URL ENTRY */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">RTMP Server URL</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={serverUrl}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-3 w-full font-mono text-slate-300 focus:outline-none"
            />
            <button 
              onClick={() => copyToClipboard(serverUrl, 'url')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold px-4 rounded-xl transition min-w-[75px] cursor-pointer"
            >
              {copiedField === 'url' ? '✅ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        {/* STREAM KEY ENTRY */}
        <div className="space-y-2">
          <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400">Stream Key (Keep Private)</label>
          <div className="flex gap-2">
            <input 
              type={showKey ? "text" : "password"} 
              readOnly 
              value={streamKey}
              className="bg-slate-950 border border-slate-800 text-xs rounded-xl px-4 py-3 w-full font-mono text-orange-400 tracking-wide focus:outline-none"
            />
            <button 
              onClick={() => setShowKey(!showKey)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold px-3 rounded-xl transition cursor-pointer"
            >
              {showKey ? '👁️ Hide' : '👁️ Show'}
            </button>
            <button 
              onClick={() => copyToClipboard(streamKey, 'key')}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold px-4 rounded-xl transition min-w-[75px] cursor-pointer"
            >
              {copiedField === 'key' ? '✅ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}