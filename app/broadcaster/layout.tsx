'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function BroadcasterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // --- REGISTRATION STATES FOR DYNAMIC META INTERFACES ---
  const [profileName, setProfileName] = useState('Loading...');
  const [profileTier, setProfileTier] = useState('Pro');
  const [initials, setInitials] = useState('AB');
  
  // State to handle opening/closing mobile menu drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile sidebar menu drawer automatically whenever route navigation changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function loadSidebarIdentityContext() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, subscription_tier')
          .eq('id', user.id)
          .maybeSingle();

        const targetedName = profile?.full_name || user.email?.split('@')[0] || 'Broadcaster';
        const targetedTier = profile?.subscription_tier || 'Pro';

        setProfileName(targetedName);
        setProfileTier(targetedTier);

        const nameParts = targetedName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          setInitials((nameParts[0][0] + nameParts[1][0]).toUpperCase());
        } else if (nameParts.length === 1 && nameParts[0].length > 0) {
          setInitials(nameParts[0].slice(0, 2).toUpperCase());
        }
      } catch (err) {
        console.error('Error handling layout metadata streaming bindings:', err);
      }
    }

    loadSidebarIdentityContext();
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/auth';
    } catch (err) {
      console.error('Logout error context:', err);
      router.push('/auth');
    }
  };

  // Shared Navigation List Component to avoid code repetition between Desktop and Mobile
  const NavLinks = () => (
    <>
      <Link 
        href="/broadcaster" 
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
          pathname === '/broadcaster' 
            ? 'bg-slate-800 text-white' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        📊 Dashboard Overview
      </Link>

      <Link 
        href="/broadcaster/studio" 
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
          pathname === '/broadcaster/studio' 
            ? 'bg-slate-800 text-white' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        🎙️ Go Live / Studio
      </Link>

      <Link 
        href="/broadcaster/content" 
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
          pathname === '/broadcaster/content' 
            ? 'bg-slate-800 text-white' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        📦 Digital Storefront
      </Link>

      <Link 
        href="/broadcaster/earnings" 
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
          pathname === '/broadcaster/earnings' 
            ? 'bg-slate-800 text-white' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        💳 Earnings & Subscription
      </Link>

      <Link 
        href="/broadcaster/settings" 
        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition ${
          pathname === '/broadcaster/settings' 
            ? 'bg-slate-800 text-white' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        ⚙️ Profile Settings
      </Link>
    </>
  );

  return (
    // Replaced layout wrapper frame to go full column blocks on mobile viewports, row layout configurations on desktop
    <div className="flex flex-col md:flex-row h-screen w-screen bg-slate-900 text-slate-100 font-sans overflow-hidden relative">
      
      {/* ================= MOBILE HEADER NAVIGATION TOP-BAR ================= */}
      <header className="md:hidden flex items-center justify-between h-16 min-h-[64px] bg-slate-950 border-b border-slate-800 px-6 z-30 w-full shrink-0">
        <div className="flex flex-col">
          <h1 className="text-xl font-black tracking-wider text-orange-500">AfriBlast</h1>
          <p className="text-[10px] text-slate-400">Creator Studio Deck</p>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? (
            <span className="text-xl font-bold">✕</span>
          ) : (
            <span className="text-xl font-bold">☰</span>
          )}
        </button>
      </header>

      {/* ================= MOBILE SLIDEOUT DRAWER PANEL ================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-950/95 z-40 flex flex-col justify-between p-6 transition-all duration-200 animate-fadeIn">
          <nav className="space-y-2">
            <NavLinks />
          </nav>
          
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-200 truncate capitalize">{profileName}</p>
                <p className="text-xs text-emerald-400 font-mono font-bold">• {profileTier} Tier</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-xs bg-slate-900 border border-slate-800 hover:border-red-500/30 text-slate-400 py-1.5 px-3 rounded-lg"
              >
                Sign Out
              </button>
            </div>
            <Link 
              href="/listener" 
              className="block text-center bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold py-3 px-4 rounded-xl"
            >
              🔄 Switch User Mode
            </Link>
          </div>
        </div>
      )}

      {/* ================= 1. PERSISTENT DESKTOP SIDEBAR (Hidden on mobile via 'hidden md:flex') ================= */}
      <aside className="hidden md:flex w-64 min-w-[260px] bg-slate-950 border-r border-slate-800 flex-col justify-between h-full flex-shrink-0 z-20">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6">
            <h1 className="text-2xl font-black tracking-wider text-orange-500">AfriBlast</h1>
            <p className="text-xs text-slate-400">Creator Studio Deck</p>
          </div>
          
          {/* Navigation Links Tree */}
          <nav className="mt-6 px-4 space-y-1">
            <NavLinks />
          </nav>
        </div>

        {/* Bottom Profile Account Switcher & Sign Out Actions */}
        <div className="p-4 border-t border-slate-900 space-y-2 bg-slate-950/50">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="max-w-[130px]">
              <p className="text-xs font-bold text-slate-200 truncate capitalize" title={profileName}>
                {profileName}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono font-bold capitalize">
                • {profileTier} Tier
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="text-[10px] bg-slate-900 border border-slate-800 hover:border-red-500/30 hover:text-red-400 text-slate-400 py-1 px-2 rounded transition"
              title="Sign Out of Session"
            >
              Sign Out
            </button>
          </div>

          <Link 
            href="/listener" 
            className="block text-center bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl transition"
          >
            🔄 Switch User Mode
          </Link>
        </div>
      </aside>

      {/* ================= 2. MAIN APPLICATION CONTENT VIEW SHELL ================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 w-full">
        
        {/* Universal Studio Header (Hidden sub-text elements on ultra-small mobile displays safely) */}
        <header className="h-16 min-h-[64px] bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 md:px-8 z-10 w-full shrink-0">
          <div className="text-[11px] md:text-xs font-mono font-medium text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-full">
            🛰️ System Node Operational
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-400 hidden sm:inline">Broadcaster Control Room</span>
            
            <div 
              className="w-8 h-8 rounded-full bg-orange-600/10 border border-orange-500/30 flex items-center justify-center font-black text-xs text-orange-400 uppercase"
              title={profileName}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page Children Injected View Panel */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-900 w-full">
          {children}
        </main>
        
      </div>
    </div>
  );
}