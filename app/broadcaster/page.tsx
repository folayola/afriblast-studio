// src/app/broadcaster/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface SummaryMetrics {
  totalSales: number;
  grossRevenue: number;
  materialsCount: number;
  isLive: boolean;
}

export default function BroadcasterDashboardOverview() {
  const supabase = createClient();

  // Component States
  const [loading, setLoading] = useState(true);
  const [broadcasterName, setBroadcasterName] = useState(''); // <-- ADDED DYNAMIC NAME HOLDER
  const [metrics, setMetrics] = useState<SummaryMetrics>({
    totalSales: 0,
    grossRevenue: 0,
    materialsCount: 0,
    isLive: false,
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    async function loadDashboardSummary() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch live status AND user full name from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_live, full_name') // <-- EXPLICITLY CAPTURE THE NAME VALUE HERE
          .eq('id', user.id)
          .maybeSingle();

        // Safe fallback calculation to parse the string fields dynamically
        if (profileData?.full_name) {
          setBroadcasterName(profileData.full_name);
        } else {
          // Fallback parsing strategy using email handle string splitting if profile row name is empty
          const localHandle = user.email ? user.email.split('@')[0] : 'Broadcaster';
          setBroadcasterName(localHandle);
        }

        // 2. Fetch total materials uploaded by this broadcaster
        const { count: materialsCount } = await supabase
          .from('materials')
          .select('*', { count: 'exact', head: true })
          .eq('broadcaster_id', user.id);

        // 3. Fetch all purchases to calculate metrics locally
        const { data: purchaseData } = await supabase
          .from('purchases')
          .select(`
            id,
            purchased_at,
            materials (
              title,
              price,
              broadcaster_id
            )
          `);

        if (purchaseData) {
          const rawPurchases = purchaseData as any[];
          
          // Filter to only items belonging to this broadcaster
          const validSales = rawPurchases.filter(
            (item) => item.materials && item.materials.broadcaster_id === user.id
          );

          const gross = validSales.reduce((acc, item) => acc + (item.materials?.price || 0), 0);

          setMetrics({
            totalSales: validSales.length,
            grossRevenue: gross,
            materialsCount: materialsCount || 0,
            isLive: profileData?.is_live || false,
          });

          // Take the 3 most recent sales records for the quick preview ledger
          setRecentSales(validSales.slice(-3).reverse());
        }
      } catch (err) {
        console.error('Error compounding dashboard summary nodes:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardSummary();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        📊 Aggregating studio command center telemetry summaries...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Welcome Hero Banner */}
      <div className="bg-gradient-to-r from-orange-600/10 to-amber-600/5 border border-orange-500/10 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          {/* MAPPED DYNAMIC DATA ATTRIBUTE ELEMENT */}
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Welcome back, <span className="text-orange-500 capitalize">{broadcasterName}</span>!
          </h2>
          <p className="text-sm text-slate-400 mt-1">Here is what is happening across your AfriBlast broadcast nodes today.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/broadcaster/studio" className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg shadow-orange-600/10">
            🎙️ Go to Studio
          </Link>
          <Link href="/broadcaster/content" className="bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl transition">
            ➕ Add Material
          </Link>
        </div>
      </div>

      {/* ================= VISUAL TELEMETRY SUMMARY PANELS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stream Node Status */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Broadcast Line</span>
            <span className={`w-2 h-2 rounded-full ${metrics.isLive ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}></span>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{metrics.isLive ? 'LIVE' : 'OFFLINE'}</p>
            <p className="text-xs text-slate-400 mt-0.5">{metrics.isLive ? 'Signal active on listener feeds' : 'Studio pipeline idle'}</p>
          </div>
        </div>

        {/* Storefront Revenue Snapshot */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Take-Home Balance</span>
          <div>
            <p className="text-2xl font-mono font-black text-emerald-400">₦{(metrics.grossRevenue * 0.85).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">85% after platform split</p>
          </div>
        </div>

        {/* Digital Volumes Transacted */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Items Unlocked</span>
          <div>
            <p className="text-2xl font-mono font-black text-white">{metrics.totalSales}</p>
            <p className="text-xs text-slate-400 mt-0.5">Completed store checkouts</p>
          </div>
        </div>

        {/* Catalog Items Hosted */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-32">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Marketplace Items</span>
          <div>
            <p className="text-2xl font-mono font-black text-slate-300">{metrics.materialsCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Published study resources</p>
          </div>
        </div>

      </div>

      {/* ================= SECONDARY SPLIT GRID ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Purchases Mini-Feed */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div>
            <h3 className="text-base font-bold text-white">Recent Purchases Snapshot</h3>
            <p className="text-xs text-slate-400 mt-0.5">The latest student checkouts logged via your catalog items.</p>
          </div>

          <div className="divide-y divide-slate-900">
            {recentSales.map((sale) => (
              <div key={sale.id} className="py-3 flex items-center justify-between text-xs group">
                <div>
                  <p className="font-medium text-white group-hover:text-orange-400 transition truncate max-w-xs md:max-w-md">
                    {sale.materials?.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {new Date(sale.purchased_at).toLocaleDateString()} at {new Date(sale.purchased_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                  +₦{sale.materials?.price.toLocaleString()}
                </span>
              </div>
            ))}

            {recentSales.length === 0 && (
              <p className="text-center py-8 text-xs text-slate-500 font-medium">
                No recent storefront orders recorded.
              </p>
            )}
          </div>
          
          {recentSales.length > 0 && (
            <div className="pt-2">
              <Link href="/broadcaster/earnings" className="text-[11px] text-orange-500 hover:text-orange-400 font-semibold transition flex items-center gap-1">
                View entire financial ledger sheet &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Quick Launch Checklist Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Studio Checklist</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ensure your configurations are set before going live to students.</p>
            
            <ul className="space-y-2.5 pt-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> Database schemas connected
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span> RLS secure policies verified
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-400">🎛️</span> Stream keys assigned in profile
              </li>
              <li className="flex items-center gap-2">
                <span className="text-slate-500">○</span> Encoder testing handshake complete
              </li>
            </ul>
          </div>

          <div className="text-[10px] text-slate-500 font-mono border-t border-slate-900 pt-3 text-center">
            AfriBlast Hub Core Node v1.0.2
          </div>
        </div>

      </div>

    </div>
  );
}