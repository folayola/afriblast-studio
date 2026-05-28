// src/app/broadcaster/settings/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function BroadcasterSettings() {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Component UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form Field Content States
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [channelBio, setChannelBio] = useState('');
  const [streamTitle, setStreamTitle] = useState('');
  const [settlementBank, setSettlementBank] = useState('Access Bank Plc');
  const [accountNumber, setAccountNumber] = useState('');

  // Target Bank Network List Matrix
  const nigerianBanks = [
    'Access Bank Plc',
    'Zenith Bank Plc',
    'Guaranty Trust Bank (GTB)',
    'United Bank for Africa (UBA)',
    'First Bank of Nigeria',
    'Sterling Bank',
    'Kuda Microfinance Bank',
    'Opay'
  ];

  // Fetch current profile configuration data rows
  useEffect(() => {
    async function loadCurrentProfile() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, channel_bio, current_stream_title, settlement_bank, account_number')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url || '');
          setChannelBio(data.channel_bio || '');
          setStreamTitle(data.current_stream_title || '');
          setSettlementBank(data.settlement_bank || 'Access Bank Plc');
          setAccountNumber(data.account_number || '');
        }
      } catch (err) {
        console.error('Error downloading profile parameters:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentProfile();
  }, [supabase]);

  // Handle Image File Upload directly to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      
      // Basic client validation
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (PNG/JPEG).');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB.');
        return;
      }

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No active user session discovered.');

      // Construct unique path unique path structure: bucket/userId/timestamp-filename
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file directly into the public 'avatars' storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Extract the permanent dynamic public link node configuration
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error('Storage upload engine error:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle Form Submission: Update fields in Supabase profile row
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accountNumber && accountNumber.length !== 10) {
      alert('Nigerian Nuban account numbers must be exactly 10 digits long.');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Active session contexts could not be retrieved.');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          channel_bio: channelBio,
          current_stream_title: streamTitle,
          settlement_bank: settlementBank,
          account_number: accountNumber,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      alert('⚙️ Profile configurations updated successfully across all server nodes!');
    } catch (err: any) {
      console.error('Error saving profile nodes:', err);
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        ⚙️ Downloading profile configuration matrices...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-white">Profile & Channel Settings</h2>
        <p className="text-sm text-slate-400">Configure your broadcast branding identity parameters, stream channels metadata, and settlement account payouts.</p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* ================= PANEL 1: PUBLIC BRANDING ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider">Public Branding Profile</h3>
          
          <div className="grid grid-cols-1 gap-5">
            {/* Field 1: Name */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Broadcaster Profile Name</label>
              <input
                type="text"
                placeholder="e.g., TREM AKURE"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition"
                required
              />
            </div>

            {/* Field 2: NEW UPGRADED NATIVE FILE PICKER BUTTON & INPUT MATRIX */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Profile Avatar Branding Image</label>
              <div className="flex items-center gap-4">
                
                {/* Visual Avatar Preview Circle Frame */}
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-600 font-bold font-mono">NO IMAGE</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {/* Hidden Native File Element Node linked via Ref handler hook */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold py-2 px-4 rounded-xl transition flex items-center gap-2"
                  >
                    {uploading ? 'Uploading asset...' : '📁 Upload Brand Asset'}
                  </button>
                  <p className="text-[10px] text-slate-500 font-medium">Supports PNG or JPEG configurations up to 2MB. Image will link directly onto cloud content storage grids.</p>
                </div>
              </div>
            </div>

            {/* Field 3: Bio */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Channel Description Bio</label>
              <textarea
                placeholder="Tell your student listeners about your credentials, your educational syllabus focus fields, or tutorial timelines..."
                rows={4}
                value={channelBio}
                onChange={(e) => setChannelBio(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* ================= PANEL 2: STUDIO FEED PRESETS ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider">Live Audio Default Stream Data</h3>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Default Stream Broadcast Title</label>
            <input
              type="text"
              placeholder="e.g., Intensive Biology UTME Preparation - Cell Biology Masterclass"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition"
            />
            <p className="text-[10px] text-slate-500 font-medium mt-1.5">This topic title parameters will attach automatically to your audio room card when your server stream goes live.</p>
          </div>
        </div>

        {/* ================= PANEL 3: BANK SETTLEMENTS ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider">Financial Settlement & Payout Routing</h3>
          <p className="text-xs text-slate-400 mt-0.5">Specify the target corporate ledger account nodes where your monthly storefront digital sales payouts will clear.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Settlement Financial Institution</label>
              <select
                value={settlementBank}
                onChange={(e) => setSettlementBank(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-orange-500/50 transition cursor-pointer"
              >
                {nigerianBanks.map((bank) => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">NUBAN Account Number (10 Digits)</label>
              <input
                type="text"
                placeholder="0123456789"
                maxLength={10}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition font-mono tracking-wider"
              />
            </div>
          </div>
        </div>

        {/* Action controls button split panel */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-orange-600 hover:bg-orange-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-lg shadow-orange-600/10 min-w-[140px]"
          >
            {saving ? 'Saving Configurations...' : '💾 SAVE CHANGES'}
          </button>
        </div>

      </form>
    </div>
  );
}