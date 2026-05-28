// src/app/broadcaster/content/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface MaterialItem {
  id: string;
  title: string;
  description: string;
  price: number;
  file_url: string;
  created_at: string;
}

export default function DigitalStorefrontManagement() {
  const supabase = createClient();

  // Component UI States
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [myMaterials, setMyMaterials] = useState<MaterialItem[]>([]);

  // Form Field Input States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [fileUrl, setFileUrl] = useState('');

  // Fetch all existing uploaded materials for this broadcaster
  const loadCatalogInventory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('materials')
        .select('id, title, description, price, file_url, created_at')
        .eq('broadcaster_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMyMaterials(data as MaterialItem[]);
    } catch (err) {
      console.error('Error loading storefront metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogInventory();
  }, [supabase]);

  // Handle Local File Upload to Supabase Storage Bucket
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth session missing');

      // Create a unique file path using timestamp + clean file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to 'storefront-assets' bucket
      const { data, error } = await supabase.storage
        .from('storefront-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      // Retrieve the Public URL link for the uploaded document
      const { data: { publicUrl } } = supabase.storage
        .from('storefront-assets')
        .getPublicUrl(filePath);

      setFileUrl(publicUrl);
      alert('📄 File successfully uploaded and linked to form!');
    } catch (err: any) {
      console.error('File upload failure:', err);
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle Submission: Add New Document into materials table
  const handlePublishResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      alert('Please fill out the item Title and Price field metrics.');
      return;
    }
    if (!fileUrl) {
      alert('Please upload a file or specify an asset delivery URL before publishing.');
      return;
    }

    try {
      setPublishing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication session missing.');

      const { error } = await supabase
        .from('materials')
        .insert([
          {
            title: title,
            description: description,
            price: Number(price),
            file_url: fileUrl,
            broadcaster_id: user.id
          }
        ]);

      if (error) throw error;

      alert(`🎉 Published successfully! "${title}" is now live.`);
      setTitle('');
      setDescription('');
      setPrice('');
      setFileUrl('');
      
      await loadCatalogInventory();
    } catch (err: any) {
      console.error('Publishing storefront failure:', err);
      alert(`Failed to add material: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        📦 Accessing dynamic inventory storage systems...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      
      <div>
        <h2 className="text-2xl font-bold text-white">Digital Storefront Management</h2>
        <p className="text-sm text-slate-400">Upload educational guides, syllabus companions, and textbooks to distribute directly to your audience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= UPLOAD CONTROL FORM WITH FILE PICKER ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h3 className="text-base font-bold text-white mb-4">Publish New Material</h3>
          
          <form onSubmit={handlePublishResource} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Material Title</label>
              <input
                type="text"
                placeholder="e.g., MASTER GUIDE to 250+ scores in JAMB"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Description Summary</label>
              <textarea
                placeholder="Brief summary of syllabus coverage, topics covered..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition resize-none"
              />
            </div>

            {/* REAL INTERACTIVE FILE UPLOADER CONTROL */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Upload Document Asset (PDF, EPub, ZIP)</label>
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-4 bg-slate-900/40 text-center hover:border-orange-500/30 transition relative">
                <input
                  type="file"
                  accept=".pdf,.epub,.zip,.docx"
                  onChange={handleFileUpload}
                  disabled={uploadingFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-300">
                    {uploadingFile ? 'Uploading file to cloud node...' : fileUrl ? '✅ Document attached successfully!' : '📁 Click or drag file here to upload'}
                  </p>
                  <p className="text-[10px] text-slate-500">Supports PDF or study guide archives up to 25MB</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Price (₦)</label>
                <input
                  type="number"
                  placeholder="3500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition font-mono"
                  required
                />
              </div>
            </div>

            {/* Hidden / Read Only URL feedback field showing verification link string state */}
            {fileUrl && (
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 truncate">
                Verified Cloud Path: {fileUrl}
              </div>
            )}

            <button
              type="submit"
              disabled={publishing || uploadingFile}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-orange-600/10 mt-2"
            >
              {publishing ? 'Publishing to Cloud Node...' : '🚀 PUBLISH TO MARKETPLACE'}
            </button>
          </form>
        </div>

        {/* ================= HOSTED INVENTORY SHOWCASE ================= */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">Your Live Store Inventory ({myMaterials.length})</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myMaterials.map((item) => (
              <div key={item.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-md relative group">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-white text-sm group-hover:text-orange-400 transition line-clamp-1">{item.title}</h4>
                    <span className="font-mono text-xs font-bold text-emerald-400 shrink-0">
                      ₦{item.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {item.description || 'No descriptive context parameters provided for this resource profile.'}
                  </p>
                </div>

                <div className="border-t border-slate-900/60 pt-3 mt-4 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Uploaded: {new Date(item.created_at).toLocaleDateString()}</span>
                  <span className="text-slate-400 truncate max-w-[120px]" title={item.file_url}>
                    🔗 {item.file_url ? 'Linked Attachment' : 'No Source Attached'}
                  </span>
                </div>
              </div>
            ))}

            {myMaterials.length === 0 && (
              <div className="col-span-full bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                📥 You haven't added any digital assets to your marketplace catalog yet. Use the control form to publish your first resource.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}