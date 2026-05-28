// src/app/auth/AuthClient.tsx
'use client';

// Force Next.js compilation workers to skip tracking this client module tree at build time
export const dynamic = 'force-dynamic'; 

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';

export default function AuthClientForm() {
  const supabase = createClient();
  const router = useRouter();

  // Mode management: 'login' | 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form Field parameters
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<'listener' | 'broadcaster'>('listener');

  // ================= 1. DYNAMIC URL STATE PARSER =================
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    const targetRole = searchParams.get('role');
    if (targetRole === 'listener' || targetRole === 'broadcaster') {
      setRole(targetRole);
    }

    const triggerSignup = searchParams.get('signup') === 'true' || searchParams.has('plan') || searchParams.has('trial');
    if (triggerSignup) {
      setMode('signup');
      if (searchParams.has('plan') || searchParams.has('trial')) {
        setRole('broadcaster');
      }
    }
  }, []);

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'signup') {
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        if (authData?.user) {
          const searchParams = new URLSearchParams(window.location.search);
          const planSelected = searchParams.get('plan') || 'none';
          const isTrialRequested = searchParams.get('trial') === 'true';

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              username: username.toLowerCase().trim(),
              full_name: fullName.trim(),
              role: role,
              bio: role === 'broadcaster' ? 'Welcome to my new AfriBlast broadcaster hub!' : 'AfriBlast listener account.',
              subscription_tier: role === 'broadcaster' ? (isTrialRequested ? 'starter_trial' : planSelected) : 'none',
              subscription_status: role === 'broadcaster' ? (isTrialRequested ? 'active' : 'pending_payout') : 'inactive',
              trial_ends_at: role === 'broadcaster' && isTrialRequested 
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                : null
            });

          if (profileError) throw profileError;
          
          alert('Registration successful! Redirecting to dashboard...');
          router.push(role === 'broadcaster' ? '/broadcaster' : '/listener');
        }

      } else {
        const { data: logInData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;

        if (logInData?.user) {
          const { data: profile, error: profileFetchError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', logInData.user.id)
            .maybeSingle();

          if (profileFetchError) throw profileFetchError;

          if (profile?.role === 'broadcaster') {
            router.push('/broadcaster');
          } else if (profile?.role === 'listener') {
            router.push('/listener');
          } else {
            router.push('/broadcaster');
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An operational Pipeline interrupt event occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-wider text-orange-500">AfriBlast</h1>
          <p className="text-sm text-slate-400">
            {mode === 'login' ? 'Access your audio transmission console' : 'Establish your creative cloud node'}
          </p>
        </div>

        {errorMessage && (
          <div className="bg-red-600/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg animate-fadeIn">
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Full Name</label>
                  <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Paul Olatoye" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Username</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="paul_dev" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Select Account Persona</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('listener')}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${role === 'listener' ? 'bg-orange-600/10 border-orange-500 text-orange-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    🎧 <span>Join as Listener</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('broadcaster')}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1 ${role === 'broadcaster' ? 'bg-orange-600/10 border-orange-500 text-orange-500' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                  >
                    🎙️ <span>Become Broadcaster</span>
                  </button>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm py-3 rounded-lg transition shadow-lg mt-2"
          >
            {loading ? 'Processing Authentication Payload...' : mode === 'login' ? 'Sign In to Studio' : 'Create AfriBlast Account'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-900 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <p>
              New to the platform?{' '}
              <button onClick={() => setMode('signup')} className="text-orange-500 font-medium hover:underline">
                Create an Account
              </button>
            </p>
          ) : (
            <p>
              Already running an audio node?{' '}
              <button onClick={() => setMode('login')} className="text-orange-500 font-medium hover:underline">
                Log In Instead
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}