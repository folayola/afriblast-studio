// src/app/pricing/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';

export default function AfriBlastPricingPage() {
  const supabase = createClient();
  const { initializePayment, isInitializing } = usePaystackCheckout();

  // Component Hooks & Tracking States
  const [isAnnual, setIsAnnual] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  const [processingPlanName, setProcessingPlanName] = useState<string | null>(null);

  // Synchronize authenticated user credentials on mount
  useEffect(() => {
    async function getAuthContext() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
        setBuyerId(user.id);
      }
    }
    getAuthContext();
  }, [supabase]);

  const plans = [
    {
      name: 'Starter Tier (7-Day Trial)',
      description: 'Full studio access free for 7 days. Experience high-yield live streaming and test your digital asset pipelines risk-free.',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '⏳ Complete studio feature access for 7 full days',
        '🎙️ Up to 2 hours of live audio streaming daily',
        '👥 Maximum 100 concurrent live listeners',
        '📦 Secure Storage: up to 1GB for asset vaults',
        '💬 Real-time classroom & audience chat tray',
        '💳 Direct NUBAN weekend payout routing validation'
      ],
      ctaText: 'Start 7-Day Free Trial',
      ctaLink: '/auth?trial=true',
      popular: false,
      isTrial: true,
      isEnterprise: false,
    },
    {
      name: 'Pro Ministry & Studio',
      description: 'Built for active churches, busy educational brands, and high-volume digital content publishers.',
      monthlyPrice: 20000,
      annualPrice: 15000, // Per month billed annually (₦180,000 total)
      features: [
        '🎙️ Unlimited daily streaming hours',
        '👥 Maximum 2,500 concurrent live listeners',
        '📦 Premium Storage: up to 50GB for asset vaults',
        '📊 Reduced 2.5% platform distribution fee',
        '⚡ High-Priority Opus audio edge allocation',
        '🛠️ Custom branding panel on public profiles',
        '📈 Advanced database sales ledger charts'
      ],
      ctaText: 'Upgrade to Pro Studio',
      ctaLink: '#', // Handled via interactive Paystack execution onClick
      popular: true,
      isTrial: false,
      isEnterprise: false,
    },
    {
      name: 'Enterprise Network',
      description: 'Tailored for multi-branch regional ministries, large corporate seminars, and institutional test boards.',
      monthlyPrice: 65000,
      annualPrice: 52000,
      features: [
        '🎙️ Multi-broadcaster sub-account controls',
        '👥 Infinite concurrent live listener capacity',
        '📦 Uncapped storage configuration for files',
        '📊 Flat 0.5% custom transaction split matching',
        '🚀 Dedicated server relay node pipeline isolation',
        '🤝 Designated account systems manager support',
        '🔒 Custom domain mapping integration'
      ],
      ctaText: 'Contact Network Sales',
      ctaLink: 'mailto:sales@afriblast.com?subject=Enterprise%20Network%20Inquiry',
      popular: false,
      isTrial: false,
      isEnterprise: true, // Keep standard contact routing loop active
    }
  ];

  // Paystack Subscription Checkout Trigger
  const handleSubscriptionPurchase = (plan: typeof plans[0]) => {
    if (plan.isTrial || plan.isEnterprise) return;

    if (!userEmail || !buyerId) {
      alert("Please sign in to your AfriBlast workspace account node before choosing a subscription.");
      return;
    }

    const billingRate = isAnnual ? plan.annualPrice : plan.monthlyPrice;
    const computedTotalCharge = isAnnual ? billingRate * 12 : billingRate;

    setProcessingPlanName(plan.name);

    initializePayment({
      email: userEmail,
      amount: computedTotalCharge,
      // Ensure metadata is wrapped deeply so Paystack forwards it correctly
      metadata: {
        custom_fields: [
          {
            display_name: "Purchase Type",
            variable_name: "purchase_type",
            value: "subscription"
          }
        ],
        purchase_type: 'subscription',
        buyer_id: buyerId,
        plan_name: plan.name, // This fixes the exact null constraint error!
        billing_cycle: isAnnual ? 'annual' : 'monthly'
      } as any,
      onSuccess: async (reference: string) => {
        try {
          const res = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference })
          });

          const result = await res.json();

          if (result.success) {
            alert(`🎉 Success! Your workspace has been upgraded to the ${plan.name} Tier.`);
            window.location.href = '/broadcaster/dashboard';
          } else {
            alert(`Subscription verification failure node: ${result.error}`);
          }
        } catch (err) {
          console.error("Backend billing validation error:", err);
        } finally {
          setProcessingPlanName(null);
        }
      },
      onClose: () => {
        setProcessingPlanName(null);
      }
    });
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen font-sans selection:bg-orange-600 selection:text-white relative">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] bg-gradient-to-b from-orange-600/5 to-transparent rounded-full blur-3xl pointer-events-none z-0" />

      {/* NAVIGATION HEADER */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <span className="text-xl font-black tracking-tight text-white group-hover:text-orange-400 transition">
              Afri<span className="text-orange-500">Blast</span>
            </span>
            <span className="text-[9px] font-mono font-bold bg-orange-600/10 text-orange-400 px-1.5 py-0.5 rounded">
              v1.0 MVP
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
            <Link href="/#features" className="hover:text-white transition">Core Engine</Link>
            <Link href="/listener/marketplace" className="hover:text-white transition">Storefront Marketplace</Link>
            <Link href="/#use-cases" className="hover:text-white transition">Solutions</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-xs font-bold text-slate-300 hover:text-white transition px-4 py-2">
              Sign In
            </Link>
            <Link href="/auth?signup=true" className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-lg shadow-orange-600/10">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* PAGE HERO */}
      <div className="max-w-5xl mx-auto px-6 pt-16 pb-8 text-center space-y-4 relative z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-400">
          💎 Transparent, Scalable Pricing Matrices
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
          Choose the Perfect Scale for Your Audience
        </h1>
        <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          From grassroots study hubs to regional multi-site ministries, pick an infrastructure plan optimized to keep bandwidth low and impact high.
        </p>

        {/* BILLING TOGGLE */}
        <div className="pt-6 flex items-center justify-center gap-3">
          <span className={`text-xs font-semibold transition ${!isAnnual ? 'text-white' : 'text-slate-500'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="w-12 h-6 bg-slate-900 border border-slate-800 rounded-full p-1 transition relative flex items-center cursor-pointer"
            aria-label="Toggle between monthly and annual billing options"
          >
            <div className={`w-4 h-4 bg-orange-500 rounded-full transition-transform transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs font-semibold transition flex items-center gap-1.5 ${isAnnual ? 'text-white' : 'text-slate-500'}`}>
            Annually 
            <span className="text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              SAVE 20%
            </span>
          </span>
        </div>
      </div>

      {/* PRICING TIERS GRID */}
      <main className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {plans.map((plan) => {
          const displayedPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
          const isProcessingThisPlan = processingPlanName === plan.name;

          return (
            <div
              key={plan.name}
              className={`bg-slate-950 border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition relative group ${
                plan.popular 
                  ? 'border-orange-500/60 bg-gradient-to-b from-slate-950 via-slate-950 to-orange-950/5 ring-1 ring-orange-500/30 shadow-orange-950/10' 
                  : 'border-slate-900 hover:border-slate-800'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-6 bg-orange-600 border border-orange-500 text-white font-mono font-bold text-[9px] uppercase tracking-widest px-2.5 py-0.5 rounded-md shadow-md">
                  ★ MOST POPULAR CHOICE
                </span>
              )}

              <div className="space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed min-h-[48px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display Block */}
                <div className="pt-2 flex items-baseline gap-1 border-t border-slate-900/60">
                  {plan.isTrial ? (
                    <span className="text-xl md:text-3xl font-black text-orange-400 tracking-tight uppercase font-mono">
                      FREE TRIAL
                    </span>
                  ) : (
                    <>
                      <span className="text-2xl md:text-4xl font-black text-white tracking-tight font-mono">
                        ₦{displayedPrice.toLocaleString()}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        / month
                      </span>
                    </>
                  )}
                </div>
                {!plan.isTrial && isAnnual && displayedPrice > 0 && (
                  <p className="text-[10px] font-mono text-emerald-400 font-medium">
                    Billed annually (₦{(displayedPrice * 12).toLocaleString()}/year)
                  </p>
                )}

                {/* Features Checklist */}
                <ul className="space-y-3 pt-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-xs text-slate-300 font-medium flex items-start gap-2.5 leading-snug">
                      <span className="shrink-0 text-[10px] text-orange-500">✔</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ACTION CALL TRANSACTIONS */}
              <div className="mt-8">
                {plan.isTrial || plan.isEnterprise ? (
                  // Native normal link for Free Trials or Enterprise mailto configurations
                  <Link
                    href={plan.ctaLink}
                    className={`block w-full text-center font-bold text-xs py-3 rounded-xl transition shadow-md tracking-wide ${
                      plan.popular
                        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/10'
                        : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {plan.ctaText}
                  </Link>
                ) : (
                  // Paystack Interactive Checkout Button Node for core platform subscriptions
                  <button
                    onClick={() => handleSubscriptionPurchase(plan)}
                    disabled={isInitializing || isProcessingThisPlan}
                    className={`block w-full text-center font-bold text-xs py-3 rounded-xl transition shadow-md tracking-wide cursor-pointer disabled:bg-slate-800 disabled:text-slate-500 ${
                      plan.popular
                        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/10'
                        : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isProcessingThisPlan ? 'Contacting Paystack Gateway...' : plan.ctaText}
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </main>

      {/* QUICK FAQ AND FOOTER */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center border-t border-slate-900 mt-12 space-y-4 relative z-10">
        <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500 font-mono">
          Looking for a custom plan?
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Need custom compliance logs or have a sprawling audience network of over 10,000 simultaneous listeners? We can spin up custom server configurations instantly.
        </p>
        <div className="pt-2">
          <a href="mailto:support@afriblast.com?subject=Custom%20Sizing%20Request" className="text-xs font-bold text-slate-300 hover:text-white underline underline-offset-4 transition">
            Connect with our system architects →
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-6 text-center text-[10px] font-mono text-slate-600 relative z-10">
        © {new Date().getFullYear()} AfriBlast Network Org. All rights reserved. Plans are elastic and can be scaled directly from client workspaces.
      </footer>

    </div>
  );
}