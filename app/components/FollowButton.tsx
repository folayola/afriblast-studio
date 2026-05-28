// app/components/FollowButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface FollowButtonProps {
  broadcasterId: string;
}

export default function FollowButton({ broadcasterId }: FollowButtonProps) {
  const supabase = createClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function checkFollowStatus() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        // Safety: If no active authenticated listener session exists, exit loading smoothly
        if (authError || !user) {
          setLoading(false);
          return;
        }

        // Don't verify if the creator is trying to follow themselves
        if (user.id === broadcasterId) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('follows')
          .select('id')
          .eq('listener_id', user.id)
          .eq('broadcaster_id', broadcasterId)
          .maybeSingle();

        if (data) setIsFollowing(true);
      } catch (err) {
        console.error('Error tracking client verification nodes:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (broadcasterId) {
      checkFollowStatus();
    } else {
      setLoading(false);
    }
  }, [broadcasterId, supabase]);

  // Render a subtle placeholder text block if the authentication hook is resolving
  if (loading) {
    return <span className="text-[11px] text-slate-600 animate-pulse font-mono">Syncing...</span>;
  }

  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setProcessing(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          alert("Please sign in to follow this educator node!");
          setProcessing(false);
          return;
        }

        try {
          if (isFollowing) {
            await supabase
              .from('follows')
              .delete()
              .eq('listener_id', user.id)
              .eq('broadcaster_id', broadcasterId);

            setIsFollowing(false);
          } else {
            await supabase
              .from('follows')
              .insert({ listener_id: user.id, broadcaster_id: broadcasterId });

            setIsFollowing(true);
          }
        } catch (err) {
          console.error("Failed handling client record mutation:", err);
        } finally {
          setProcessing(false);
        }
      }}
      disabled={processing}
      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0 ${
        isFollowing
          ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 hover:border-rose-900/40'
          : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/5'
      }`}
    >
      {processing ? '...' : isFollowing ? 'Following' : '+ Follow'}
    </button>
  );
}