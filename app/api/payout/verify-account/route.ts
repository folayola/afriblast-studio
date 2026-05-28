// src/app/api/payout/verify-account/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Guard check: Make sure a logged-in broadcaster is making the call
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials session' }, { status: 401 });
    }

    // 2. Extract query parameters from the request URL
    const { searchParams } = new URL(request.url);
    const accountNum = searchParams.get('accountNum');
    const bankCode = searchParams.get('bankCode');

    if (!accountNum || !bankCode || accountNum.length !== 10) {
      return NextResponse.json({ error: 'Invalid parameters provided' }, { status: 400 });
    }

    // 3. Connect to Paystack's NUBAN resolution database
    const paystackResponse = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNum}&bank_code=${bankCode}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const paystackData = await paystackResponse.json();

    // 4. Return the verified details back to our dashboard frontend
    if (paystackResponse.ok && paystackData.status) {
      return NextResponse.json({
        success: true,
        accountName: paystackData.data.account_name, // E.g. "PAUL OLATOYE"
      });
    } else {
      return NextResponse.json({
        success: false,
        error: paystackData.message || 'Could not resolve account names via bank networks'
      }, { status: 422 });
    }

  } catch (err: any) {
    console.error('Account lookup internal crash failure:', err);
    return NextResponse.json({ error: 'Internal server network resolution fault' }, { status: 500 });
  }
}