'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import FollowButton from '../../components/FollowButton';

interface MaterialItem {
  id: string;
  title: string;
  description: string; // Fixed: Matched to database schema column name
  price: number;
  broadcaster_id: string;
  profiles: {
    full_name: string;
    username: string;
  } | null;
}

export default function MaterialsMarketplace() {
  const supabase = createClient();
  const { initializePayment, isInitializing } = usePaystackCheckout();

  // Component States
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // NEW: Virality clipboard link state
  const [copiedStreamId, setCopiedStreamId] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarketplaceAssets() {
      try {
        setLoading(true);

        // 1. Grab current authenticated user context and assign states safely
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email ?? null);
          setBuyerId(user.id);
        }

        // 2. Query available resources along with author profile nodes
        const { data, error: supabaseError } = await supabase
          .from('materials')
          .select(`
            id,
            title,
            description,
            price,
            broadcaster_id,
            profiles (
              full_name,
              username
            )
          `);

        // Fixed: Explicitly throw the renamed 'supabaseError' variable
        if (supabaseError) throw supabaseError;
        if (data) setMaterials(data as any[]);

      } catch (err: any) {
        // Formatted to print clear descriptive text instead of an un-stringifyable empty object
        console.log("❌ SUPABASE CATALOG FETCH FAILURE:", err?.message || err);
        console.log("🔍 SQL ERROR CODE:", err?.code);
        console.log("💡 INFRASTRUCTURE HINT:", err?.hint);
      } finally {
        setLoading(false);
      }
    }

    loadMarketplaceAssets();
  }, [supabase]);

  // UPGRADED: Multi-Channel Virality Intent Handler
  const handleShareStream = (broadcasterId: string, platform: 'copy' | 'twitter' | 'whatsapp' = 'copy') => {
    // Generates the absolute URL pointing to this specific creator's live room
    const shareUrl = `${window.location.origin}/listener/stream/${broadcasterId}`;
    
    // Custom pre-written message for the text templates
    const shareText = `Join this live audio broadcast session on AfriBlast! Tune in here:`;

    if (platform === 'copy') {
      // Standard Clipboard Copy Action Engine
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setCopiedStreamId(broadcasterId);
          // Revert the button text back after 2 seconds
          setTimeout(() => setCopiedStreamId(null), 2000);
        })
        .catch((err) => console.error('Could not copy live streaming link token:', err));
    } else if (platform === 'twitter') {
      // Opens Twitter/X intent window with pre-filled text and link node
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    } else if (platform === 'whatsapp') {
      // Opens WhatsApp web/app transmission window with pre-filled layout text
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle Purchase Triggers
  const handlePurchaseClick = (item: MaterialItem) => {
    if (!userEmail || !buyerId) {
      alert("Please sign in to your account node before checking out.");
      return;
    }

    setProcessingId(item.id);

    initializePayment({
      email: userEmail,
      amount: item.price,
      metadata: {
        material_id: item.id,
        broadcaster_id: item.broadcaster_id,
        purchase_type: 'material',
        buyer_id: buyerId
      } as any,
      onSuccess: async (reference: string) => {
        try {
          const res = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference })
          });

          const verificationResult = await res.json();

          if (verificationResult.success) {
            alert(`🎉 Success! "${item.title}" has been added to your library.`);
          } else {
            alert(`Verification warning: ${verificationResult.error}`);
          }
        } catch (err) {
          console.error("Backend validation call failed:", err);
        } finally {
          setProcessingId(null);
        }
      },
      onClose: () => {
        setProcessingId(null);
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        📚 Synchronizing digital library nodes and catalog index...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-white">Materials Marketplace</h2>
        <p className="text-sm text-slate-400">Browse verified UTME guides, syllabus compacts, and academic materials published by top educators.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((item) => (
          <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xl hover:border-slate-700 transition">
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-wider font-mono bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/10">
                Study Guide
              </span>
              <h3 className="text-base font-bold text-white leading-snug line-clamp-2">{item.title}</h3>
              
              {/* BRAND NEW UPGRADED FLEX PROFILE & INTERACTIVE FOLLOW ACTION ROW */}
              <div className="flex items-center justify-between gap-4 py-1.5 border-b border-slate-900/60 pb-3">
                <p className="text-xs text-slate-500 font-medium truncate">
                  By <span className="text-slate-300 font-semibold">{item.profiles?.full_name || `@${item.profiles?.username || 'educator'}`}</span>
                </p>
                {/* Mount the network toggle element right here inside the loop */}
                <FollowButton broadcasterId={item.broadcaster_id} />
              </div>

              {/* Fixed: Read item.description instead of item.description_summary */}
              <p className="text-xs text-slate-400 line-clamp-3 pt-2">{item.description || "No description attached by publisher node."}</p>
            </div>

            <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">Price Token</p>
                <p className="text-lg font-mono font-black text-emerald-400">₦{item.price.toLocaleString()}</p>
              </div>

              {/* Action Buttons Cluster Wrapper */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* 1. Clipboard Copy Button */}
                <button
                  onClick={() => handleShareStream(item.broadcaster_id, 'copy')}
                  className={`px-2.5 py-2 text-[11px] font-semibold rounded-xl border transition flex items-center gap-1 ${
                    copiedStreamId === item.broadcaster_id
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                  title="Copy Stream Link"
                >
                  {copiedStreamId === item.broadcaster_id ? 'Copied!' : '🔗 Copy'}
                </button>

                {/* 2. Direct WhatsApp Trigger */}
                <button
                  onClick={() => handleShareStream(item.broadcaster_id, 'whatsapp')}
                  className="px-2.5 py-2 text-[11px] font-semibold rounded-xl border border-slate-800 bg-slate-900/50 text-slate-300 hover:text-green-400 hover:bg-green-950/20 hover:border-green-500/30 transition flex items-center gap-1"
                  title="Share to WhatsApp Groups"
                >
                  <span>💬</span>
                  <span className="hidden lg:inline">WhatsApp</span>
                </button>

                {/* 3. Direct Twitter/X Intent Trigger */}
                <button
                  onClick={() => handleShareStream(item.broadcaster_id, 'twitter')}
                  className="px-2.5 py-2 text-[11px] font-semibold rounded-xl border border-slate-800 bg-slate-900/50 text-slate-300 hover:text-sky-400 hover:bg-sky-950/20 hover:border-sky-500/30 transition flex items-center gap-1"
                  title="Post on X / Twitter"
                >
                  <span>𝕏</span>
                  <span className="hidden lg:inline">Post</span>
                </button>

                {/* Paystack Checkout Button */}
                <button
                  onClick={() => handlePurchaseClick(item)}
                  disabled={isInitializing || processingId !== null}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition shadow-lg shadow-orange-600/10"
                >
                  {processingId === item.id ? '...' : 'Buy'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}