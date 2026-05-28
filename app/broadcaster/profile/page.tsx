// src/app/broadcaster/profile/page.tsx
'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ProfileData {
  fullName: string;
  username: string;
  bio: string;
}

export default function ProfileCustomization() {
  const supabase = createClient();
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Form profile values state
  const [profile, setProfile] = useState<ProfileData>({
    fullName: '',
    username: '',
    bio: '',
  });

  // Pull existing session and data on render
  useEffect(() => {
    async function fetchProfile() {
      try {
        // 1. Get current authenticated user ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;
        
        setUserId(user.id);

        // 2. Query target record row from profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, username, bio')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error.message);
        } else if (data) {
          setProfile({
            fullName: data.full_name || '',
            username: data.username || '',
            bio: data.bio || '',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [supabase]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // Live write operational call to Supabase Engine
  const handleSave = async () => {
    if (!userId) return alert('You must be logged in to sync modifications.');
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: profile.fullName,
        username: profile.username,
        bio: profile.bio,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);

    if (error) {
      alert(`Sync Failed: ${error.message}`);
    } else {
      alert('Profile successfully synchronized with your cloud database!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        ⌛ Fetching secure pipeline metadata parameters...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile & Branding</h2>
        <p className="text-sm text-slate-400">Manage your creator identity integrated directly into your cloud repository backend.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* EDIT FORM CONTAINER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Account Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Display Name</label>
                <input 
                  type="text" 
                  name="fullName" 
                  value={profile.fullName} 
                  onChange={handleChange} 
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Handle / Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-slate-500">@</span>
                  <input 
                    type="text" 
                    name="username" 
                    value={profile.username} 
                    onChange={handleChange} 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" 
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Channel Description / Bio</label>
              <textarea 
                name="bio" 
                rows={3} 
                value={profile.bio} 
                onChange={handleChange} 
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none" 
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-800 text-white font-bold text-sm px-6 py-2.5 rounded-lg transition shadow-lg"
            >
              {saving ? 'Syncing...' : 'Save Configuration Changes'}
            </button>
          </div>
        </div>

        {/* SIDEBAR PREVIEW BOX REPLICA */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Listener View Preview</h3>
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-5 space-y-4 shadow-2xl">
            <div>
              <h4 className="text-base font-bold text-white tracking-wide">{profile.fullName || 'Untitled Host'}</h4>
              <p className="text-xs text-orange-500 font-mono">@{profile.username || 'handle'}</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-900">
              {profile.bio || 'No custom descriptive information profile bio configured.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}