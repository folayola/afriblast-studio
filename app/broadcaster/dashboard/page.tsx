// src/app/broadcaster/dashboard/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
// import StreamCredentialsCard from '../StreamCredentialsCard';

// OR use your Next.js absolute path alias to avoid directory nesting guessing games:
import StreamCredentialsCard from '@/app/broadcaster/dashboard/StreamCredentialsCard';

export default async function BroadcasterDashboardPage() {
  const supabase = await createClient();

  // 1. Authenticate session context
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth');
  }

  // 2. Fetch the latest active subscription record node
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('plan_name, billing_cycle, current_period_end')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .maybeSingle();

  // 3. Fallback allocations if no row exists yet
  const activePlan = subscription?.plan_name || 'Starter Tier (7-Day Trial)';
  const isPro = activePlan.toLowerCase().includes('pro') || activePlan.toLowerCase().includes('ministry');
  
  const expiryDate = subscription?.current_period_end 
    ? new Date(subscription.current_period_end).toLocaleDateString('en-NG', { dateStyle: 'long' })
    : '7 days from creation';

  // 4. Mocking operational streaming values based on tier bounds
  const rtmpServerUrl = "rtmp://relay.afriblast.com/live";
  // Generate a private pseudo stream key assigned to the user profile
  const hiddenStreamKey = `ab_${user.id.substring(0, 8)}_stream_key_prod`;

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans selection:bg-orange-600 antialiased">
      
      {/* CONTROL DASHBOARD TOP BAR */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-black tracking-tight">
              Afri<span className="text-orange-500">Blast</span> <span className="text-slate-400 font-light text-sm">Studio Panel</span>
            </span>
            <span className="text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded uppercase tracking-wide">
              {activePlan}
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
            <span className="hidden sm:inline bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
              User ID: <span className="text-slate-300 font-mono">{user.email}</span>
            </span>
            <Link href="/pricing" className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg transition">
              Manage Plan
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        
        {/* HERO ACCOUNT NOTIFICATION PANEL */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-orange-950/20 border border-slate-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Relay Core Connected</p>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
              Welcome back to your Broadcaster Node 🎙️
            </h1>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Your server pipeline configuration is fully optimized. Your workspace has been verified on the <strong className="text-white">{activePlan}</strong> schema, valid through <span className="text-orange-400 font-mono">{expiryDate}</span>.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
            <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Stream Priority</span>
              <span className="text-sm font-bold text-slate-200">{isPro ? '🚀 Tier-1 Edge Routing' : 'Standard Delivery'}</span>
            </div>
          </div>
        </div>

        {/* SECTION BREAK: ANALYTICS AT A GLANCE */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase text-slate-500 tracking-widest font-mono">Studio Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* BANDWIDTH METRIC */}
            <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-900 p-6 rounded-2xl space-y-4 shadow-sm hover:border-slate-800/80 transition group">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono group-hover:text-slate-300">Concurrent Listeners</span>
                <span className="text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">Live</span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black font-mono tracking-tight">0 <span className="text-slate-600 text-sm font-light">/ {isPro ? '2,500 max' : '100 max'}</span></p>
                <p className="text-[11px] text-slate-500 leading-normal">Dedicated sub-relay listener capacities running smoothly.</p>
              </div>
            </div>

            {/* STORAGE METRIC */}
            <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-900 p-6 rounded-2xl space-y-4 shadow-sm hover:border-slate-800/80 transition group">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono group-hover:text-slate-300">Asset Cloud Vault</span>
                <span className="text-[11px] font-mono font-bold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">Cap</span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black font-mono tracking-tight">0 GB <span className="text-slate-600 text-sm font-light">/ {isPro ? '50 GB' : '1 GB'}</span></p>
                <p className="text-[11px] text-slate-500 leading-normal">Storage allocated for your study audio guides and recordings.</p>
              </div>
            </div>

            {/* STREAM QUALITY METRIC */}
            <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-900 p-6 rounded-2xl space-y-4 shadow-sm hover:border-slate-800/80 transition group">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono group-hover:text-slate-300">Audio Stream Codec</span>
                <span className="text-[11px] font-mono font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded">Bitrate</span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-black font-mono tracking-tight text-orange-400">{isPro ? '320 kbps' : '128 kbps'}</p>
                <p className="text-[11px] text-slate-500 leading-normal">{isPro ? 'Ultra-High Fidelity Opus Edge processing enabled.' : 'Standard Quality audio channel compression.'}</p>
              </div>
            </div>

          </div>
        </div>

        {/* INTERACTIVE BROADCAST CONFIG SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
          
          {/* CLIENT SIDE STREAM CREDENTIALS COMPONENT */}
          <div className="lg:col-span-2">
            <StreamCredentialsCard 
              serverUrl={rtmpServerUrl} 
              streamKey={hiddenStreamKey} 
            />
          </div>

          {/* STUDIO QUICK LINKS GUIDE */}
          <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200">OBS Broadcaster Setup</h3>
              <ul className="space-y-3 text-xs text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Open OBS Studio on your machine.</li>
                <li>Navigate to <strong className="text-slate-300">Settings → Stream</strong>.</li>
                <li>Set Service to <strong className="text-slate-300">Custom...</strong></li>
                <li>Paste the Server URL and your Private Stream Key.</li>
                <li>Set Audio Bitrate to <strong className="text-orange-400 font-mono">{isPro ? '320k' : '128k'}</strong> for stable performance.</li>
              </ul>
            </div>
            
            <div className="pt-4 border-t border-slate-900/60 text-center">
              <Link 
                href="/listener/marketplace" 
                className="inline-block w-full text-center text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-orange-400 border border-orange-500/10 py-2.5 rounded-xl transition"
              >
                📚 Go to Resource Marketplace
              </Link>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}