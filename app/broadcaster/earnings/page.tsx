// src/app/broadcaster/earnings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface LedgerItem {
  id: string;
  purchased_at: string;
  materials: {
    title: string;
    price: number;
  } | null;
}

// Major Nigerian Commercial Banks & Fintech Wallets mapped to Paystack codes
const NIGERIAN_BANKS = [
  { code: "999992", name: "OPay (Paycom)" },
  { code: "50515", name: "Moniepoint Microfinance Bank" },
  { code: "999991", name: "PalmPay" },
  { code: "058", name: "Guaranty Trust Bank (GTB)" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "057", name: "Zenith Bank" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "044", name: "Access Bank Plc" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "039", name: "Stanbic IBTC Bank" },
  { code: "032", name: "Sterling Bank" },
  { code: "035", name: "Wema Bank" }
];

export default function EarningsAnalyticsDashboard() {
  const supabase = createClient();

  // Financial Telemetry States
  const [loading, setLoading] = useState(true);
  const [disbursing, setDisbursing] = useState(false);
  const [salesLedger, setSalesLedger] = useState<LedgerItem[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeSubscribers, setActiveSubscribers] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  // Settlement Form Input States
  const [bankCode, setBankCode] = useState('');
  const [accountNum, setAccountNum] = useState('');
  
  // Real-Time Verification UI States
  const [accountName, setAccountName] = useState('');
  const [verifyingAccount, setVerifyingAccount] = useState(false);

  // Load Sales logs dynamically from Database
  useEffect(() => {
    async function loadFinancialTelemetry() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch live follower metrics from your new follows schema
        const { count, error: followCountError } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('broadcaster_id', user.id);

        if (!followCountError && count !== null) {
          setFollowerCount(count);
        }

        // Fetch the purchases and include the linked materials data node
        const { data, error } = await supabase
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

        if (error) throw error;

        if (data) {
          const rawItems = data as any[];
          
          // Filter locally matching your exact broadcaster_id column
          const filteredData: LedgerItem[] = rawItems
            .filter(item => item.materials && item.materials.broadcaster_id === user.id)
            .map(item => ({
              id: item.id,
              purchased_at: item.purchased_at,
              materials: {
                title: item.materials.title,
                price: Number(item.materials.price) || 0
              }
            }));

          setSalesLedger(filteredData);

          // Aggregate Gross Revenue totals
          const gross = filteredData.reduce((acc, item) => acc + (item.materials?.price || 0), 0);
          setTotalRevenue(gross);
          setActiveSubscribers(gross > 0 ? Math.floor(gross / 2000) + 3 : 0);
        }
      } catch (err) {
        console.error('Error fetching financial summaries:', err);
      } finally {
        setLoading(false);
      }
    }


    loadFinancialTelemetry();
  }, [supabase]);

  // Dynamic NUBAN Account Name Verification Lookup Hook
  useEffect(() => {
    async function resolveNubanAccountDetails() {
      // Trigger API query only when account input is complete (10 digits) and bank is chosen
      if (accountNum.length === 10 && bankCode) {
        setVerifyingAccount(true);
        setAccountName('');
        try {
          const response = await fetch(`/api/payout/verify-account?accountNum=${accountNum}&bankCode=${bankCode}`);
          const result = await response.json();
          
          if (result.success && result.accountName) {
            setAccountName(result.accountName);
          } else {
            setAccountName('❌ Account verification failed. Please check details.');
          }
        } catch (err) {
          console.error("Account verification failure:", err);
          setAccountName('⚠️ Error resolving account name.');
        } finally {
          setVerifyingAccount(false);
        }
      } else {
        setAccountName('');
      }
    }

    resolveNubanAccountDetails();
  }, [accountNum, bankCode]);

  // Handle Outbound Payout Request Pipeline Execution
  const handlePayoutDisbursalExecution = async () => {
    const withdrawableAmount = totalRevenue * 0.85;

    if (!bankCode) {
      alert("Please select your destination settlement bank.");
      return;
    }
    if (!accountNum || accountNum.length !== 10) {
      alert("Please enter a valid 10-digit NUBAN account number.");
      return;
    }
    if (!accountName || accountName.includes('❌') || accountName.includes('⚠️')) {
      alert("Cannot initiate payout to an unverified or failed account bank target.");
      return;
    }

    const confirmMessage = `Confirm extraction authorization:\n\nAre you sure you want to disburse ₦${withdrawableAmount.toLocaleString()} to:\n👤 ${accountName}?`;
    
    if (confirm(confirmMessage)) {
      setDisbursing(true);
      try {
        const response = await fetch('/api/payout/disburse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountNum: accountNum,
            bankCode: bankCode,
            amountToWithdraw: withdrawableAmount,
          }),
        });

        const outcomeData = await response.json();

        if (response.ok && outcomeData.success) {
          alert("🎉 Settlement Disbursal Order Transmitted! Funds should hit your account in a few moments.");
          // Reset local UI parameters to clean out state display safely
          setTotalRevenue(0);
          setAccountNum('');
          setBankCode('');
          setAccountName('');
        } else {
          alert(`Disbursal Error: ${outcomeData.error || 'Failed processing ledger transmission execution routes.'}`);
        }
      } catch (faultNode) {
        console.error("Pipeline framework error context:", faultNode);
        alert("Pipeline infrastructure routing fault encountered processing payout operations request.");
      } finally {
        setDisbursing(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        💳 Accessing secure multi-merchant wallet metrics nodes...
      </div>
    );
  }

  const withdrawableBalance = totalRevenue * 0.85;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Page Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Earnings & Wallet Management</h2>
        <p className="text-sm text-slate-400">Monitor your premium educational material storefront sales metrics and active audio channel memberships.</p>
      </div>

      {/* ================= TELEMETRY METRIC CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Balance */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Withdrawable Wallet Balance</p>
            <p className="text-3xl font-mono font-black text-white mt-2">₦{withdrawableBalance.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-1">Platform fee deductions (15%) calculated.</p>
          </div>

          {/* Card 2: Storefront Sales */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gross Material Storefront Sales</p>
            <p className="text-3xl font-mono font-black text-slate-200 mt-2">₦{totalRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-emerald-400 mt-1">📈 Accumulating from {salesLedger.length} completed transactions.</p>
          </div>

          {/* Card 3: LIVE FOLLOWERS COUNT NODE */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Premium Access Followers</p>
            {/* Renders your live database state */}
            <p className="text-3xl font-mono font-black text-slate-200 mt-2">
              {followerCount.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Active listener audience connections.</p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ================= LEFT COLUMN: TRANSACTION LEDGER LOGS ================= */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Recent Purchases Ledger</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time incoming data streams matching your uploaded store inventory documents.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Material Title Description</th>
                  <th className="pb-3 font-semibold">Transaction Date</th>
                  <th className="pb-3 font-semibold text-right">Price Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                {salesLedger.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/30 transition group">
                    <td className="py-4 font-medium text-white max-w-xs truncate group-hover:text-orange-400 transition">
                      {item.materials?.title || 'Unknown Material Resource'}
                    </td>
                    <td className="py-4 font-mono text-slate-400">
                      {new Date(item.purchased_at).toLocaleString()}
                    </td>
                    <td className="py-4 font-mono font-bold text-right text-emerald-400">
                      +₦{item.materials?.price.toLocaleString() || 0}
                    </td>
                  </tr>
                ))}

                {salesLedger.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-slate-500 font-medium">
                      No customer transactions have logged to your Postgres profile node yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: PAYMENT PAYOUT PREFERENCES ================= */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">Payout Settings</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure your destination settlement account protocols.</p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Settlement Bank</label>
                <select 
                  value={bankCode}
                  onChange={(e) => {
                    setBankCode(e.target.value);
                    setAccountName(''); // Clear resolved name upon modification
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-orange-500 transition cursor-pointer"
                >
                  <option value="" className="text-slate-500">Select Bank...</option>
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank.code} value={bank.code} className="bg-slate-950 text-slate-200">
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Account Number Reference</label>
                <input 
                  type="text" 
                  maxLength={10}
                  value={accountNum}
                  onChange={(e) => setAccountNum(e.target.value.replace(/\D/g, ''))} // Strictly numeric constraint filter
                  placeholder="e.g. 0123456789"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-orange-500 transition placeholder:text-slate-600"
                />
              </div>

              {/* Dynamic Live Verification Output Readout Panel */}
              {(verifyingAccount || accountName) && (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-left transition duration-200 ease-in">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Verified Beneficiary Name</p>
                  
                  {verifyingAccount ? (
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-orange-400">
                      <span className="animate-spin text-sm">🔍</span>
                      <span>Verifying account credentials...</span>
                    </div>
                  ) : (
                    <p className={`text-xs mt-1 font-mono font-bold tracking-wide ${
                      accountName.includes('❌') || accountName.includes('⚠️') 
                        ? 'text-rose-400 font-sans font-medium' 
                        : 'text-emerald-400 uppercase'
                    }`}>
                      👤 {accountName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-900">
            <button
              onClick={handlePayoutDisbursalExecution}
              disabled={withdrawableBalance <= 0 || disbursing || verifyingAccount || !accountName || accountName.includes('❌')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-600/10 cursor-pointer disabled:cursor-not-allowed"
            >
              {disbursing ? "⏳ Processing Settlement Wire..." : "💸 Disburse Revenue Payout"}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}