// src/app/listener/library/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface UnlockedMaterial {
  purchase_id: string;
  material_id: string;
  title: string;
  description: string;
  file_url: string;
  purchased_at: string;
}

export default function ListenerPrivateLibrary() {
  const supabase = createClient();

  // Core Data Retrieval States
  const [loading, setLoading] = useState(true);
  const [myLibrary, setMyLibrary] = useState<UnlockedMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch the active listener's collection of purchased materials
  useEffect(() => {
    async function loadPurchasedLibrary() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Perform a relational query joining purchases onto materials metrics
        const { data, error } = await supabase
          .from('purchases')
          .select(`
            id,
            purchased_at,
            material_id,
            materials (
              title,
              description,
              file_url
            )
          `)
          .eq('user_id', user.id)
          .order('purchased_at', { ascending: false });

        if (error) throw error;

        if (data) {
          // Format the deeply nested Supabase join response into a flat array structure
          const formattedLibrary: UnlockedMaterial[] = data.map((item: any) => ({
            purchase_id: item.id,
            purchased_at: item.purchased_at,
            material_id: item.material_id,
            title: item.materials?.title || 'Unknown Asset Resource',
            description: item.materials?.description || 'No descriptive summary records found.',
            file_url: item.materials?.file_url || ''
          }));

          setMyLibrary(formattedLibrary);
        }
      } catch (err) {
        console.error('Error synchronizing private user library matrix:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPurchasedLibrary();
  }, [supabase]);

  // Client-side text filter query match check loop
  const filteredLibrary = myLibrary.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        📚 Synchronizing your unlocked study vaults...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Layout Typography Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Digital Library</h2>
          <p className="text-sm text-slate-400">Access, read, and download your purchased syllabus companion blueprints anytime.</p>
        </div>
        
        {/* Simple text filter element input box */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="🔍 Filter your vault collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition"
          />
        </div>
      </div>

      {/* ================= VAULT CONTENT DISPLAY GRID ================= */}
      <div className="space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLibrary.map((item) => (
            <div 
              key={item.purchase_id} 
              className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-xl group relative"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    ✓ Unlocked
                  </span>
                  <span className="text-[9px] font-mono text-slate-600">
                    ID: {item.material_id.substring(0, 8)}...
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm group-hover:text-orange-400 transition line-clamp-2 leading-snug">
                  {item.title}
                </h3>
                
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Download Action Footer Component Bar Layout */}
              <div className="mt-6 pt-3.5 border-t border-slate-900 flex items-center justify-between gap-4">
                <span className="text-[10px] font-mono text-slate-500" title={new Date(item.purchased_at).toLocaleString()}>
                  Unlocked: {new Date(item.purchased_at).toLocaleDateString()}
                </span>

                {item.file_url ? (
                  <a
                    href={item.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-orange-600/5"
                  >
                    📥 Download Asset
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-600 font-medium italic">
                    No attachment url
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredLibrary.length === 0 && (
            <div className="col-span-full bg-slate-950 border border-slate-800 rounded-2xl py-16 px-4 text-center text-slate-500">
              {myLibrary.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-slate-400">Your collection vault is currently empty.</p>
                  <p className="text-xs text-slate-600 max-w-sm mx-auto">Head over to the Marketplace directory to find and unlock top educational resources.</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No unlocked materials in your vault match that description search query.</p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}