// src/app/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';

export default function AfriBlastGlobalLandingPage() {
  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans selection:bg-orange-600 selection:text-white">
      
      {/* ================= NAVIGATION HEADER ================= */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white">
              Afri<span className="text-orange-500">Blast</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* New Clear Link Entry point for Listeners/Students */}
            <Link 
              href="/auth?role=listener" 
              className="text-xs font-bold text-slate-400 hover:text-white border border-slate-800 rounded-xl px-3 py-1.5 hover:bg-slate-900 transition"
            >
              🎧 Listener Login
            </Link>
            
            <Link 
              href="/login?role=broadcaster" 
              className="text-xs font-bold text-slate-300 hover:text-white transition"
            >
              Broadcaster Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* ================= HERO PRESTIGE BLOCK ================= */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-32 md:pb-28">
        {/* Radial Ambient Backdrops */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-orange-600/10 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10 space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
            📡 High-Performance Live Audio & Digital Commerce Network
          </span>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-[1.12] max-w-4xl mx-auto">
            Broadcast Live Audio & Distribute Digital Assets Globally
          </h1>
          
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            A single, ultra-low latency ecosystem built for creators, ministries, and educators. Stream crystal-clear audio to thousands of listeners and securely sell digital resources directly to your audience.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          href="/listener/marketplace"
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs px-8 py-3.5 rounded-xl transition text-center"
        >
          🛒 BROWSE DIGITAL MARKETPLACE
        </Link>
        <Link
          href="/pricing"
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-8 py-3.5 rounded-xl transition shadow-xl shadow-orange-600/15 tracking-wide text-center"
        >
          🎙️ VIEW BROADCASTER PLANS & TRIALS
        </Link>
      </div>

          {/* Infrastructure Metrics Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-16 max-w-4xl mx-auto border-t border-slate-900/60">
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 text-center">
              <p className="font-mono text-xl md:text-2xl font-black text-orange-500">Sub-150ms</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">Real-time Chat Sync</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 text-center">
              <p className="font-mono text-xl md:text-2xl font-black text-white">Opus Audio</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">Low-Data Optimization</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 text-center">
              <p className="font-mono text-xl md:text-2xl font-black text-emerald-400">Direct NUBAN</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">Payout Settlement</p>
            </div>
            <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 text-center">
              <p className="font-mono text-xl md:text-2xl font-black text-white">Row RLS</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mt-0.5">Secure Asset Vaults</p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= VERTICAL MARKET SECTIONS ================= */}
      <section id="use-cases" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-bold text-white">Built for Diverse Streaming Realities</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">Whether sharing spiritual insights, corporate workshops, or academic masterclasses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Use Case 1: Ministries and Non-Profits */}
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">⛪</span>
              <h3 className="font-bold text-sm text-white">Ministries & Assemblies</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Broadcast Sunday services, midweek updates, and prayer gatherings directly to your congregation's devices. Share devotional PDFs, study manuals, and audio archives via your public storefront seamlessly.
            </p>
          </div>

          {/* Use Case 2: Educators & Independent Broadcasters */}
          <div className="bg-slate-950 border border-slate-900 p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xl">🎓</span>
              <h3 className="font-bold text-sm text-white">Educators & Professional Creators</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Host intensive interactive classrooms or professional coaching seminars. Distribute textbook syllabus blueprints, answers files, and premium downloadable archives directly to listeners.
            </p>
          </div>
        </div>
      </section>

      {/* ================= CORE FEATURES SPECIFICATION ================= */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-900">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Feature 1 */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-lg">🎙️</div>
            <h3 className="font-bold text-sm text-white">Low-Bandwidth Audio Rooms</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stream perfectly compiled audio feeds optimized specifically for edge environments and light network connectivity data models.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-lg">📦</div>
            <h3 className="font-bold text-sm text-white">Dynamic Asset Delivery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Broadcasters upload files instantly via intuitive client drag-and-drop interfaces directly to row-level secured public storage bins.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg">💰</div>
            <h3 className="font-bold text-sm text-white">Integrated Split Accounting</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track multi-transaction ledgers cleanly. Calculate network operational cuts automatically and route standard payouts directly to specified NUBAN bank channels.
            </p>
          </div>

        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-900 py-8 text-center text-[10px] font-mono text-slate-600">
        © {new Date().getFullYear()} AfriBlast Network Org. All rights reserved. Powered by Next.js & Supabase Architecture.
      </footer>

    </div>
  );
}