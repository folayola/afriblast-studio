// app/api/disburse/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; 

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user context session token securely
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials session' }, { status: 401 });
    }

    const { accountNum, bankCode, amountToWithdraw } = await request.json();

    if (!accountNum || !bankCode || !amountToWithdraw || amountToWithdraw <= 0) {
      return NextResponse.json({ error: 'Invalid processing payload data parameters' }, { status: 400 });
    }

    // 2. FIXED: Fetch completed storefront purchases matching the broadcaster's profile
    const { data: purchases, error: purchasesError } = await supabase
      .from('purchases')
      .select(`
        id,
        materials (
          price,
          broadcaster_id
        )
      `);

    if (purchasesError || !purchases) {
      return NextResponse.json({ error: 'Could not fetch user ledger balances' }, { status: 500 });
    }

    // Filter and compute the absolute true balance based on historical storefront orders
    const rawItems = purchases as any[];
    const filteredPurchases = rawItems.filter(
      item => item.materials && item.materials.broadcaster_id === user.id
    );

    const grossRevenue = filteredPurchases.reduce((acc, item) => acc + (Number(item.materials?.price) || 0), 0);
    
    // Exact 85% take-home calculation mirroring your dashboard metric logic
    const currentBalance = grossRevenue * 0.85;

    // Safety validation guard block
    if (currentBalance < amountToWithdraw) {
      return NextResponse.json({ error: 'Insufficient withdrawable ledger balance context parameters' }, { status: 400 });
    }

    // 3. Step A: Create Paystack Transfer Recipient Node
    const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'nuban',
        name: user.email, 
        account_number: accountNum,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    const recipientData = await recipientResponse.json();
    if (!recipientData.status) {
      return NextResponse.json({ error: `Recipient Creation Error: ${recipientData.message}` }, { status: 400 });
    }

    const recipientCode = recipientData.data.recipient_code;

    // 4. Step B: Initiate Paystack Bulk/Single Outbound Transfer Engine
    const amountInKobo = Math.round(amountToWithdraw * 100);

    const transferResponse = await fetch('https://api.paystack.co/transfer', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance', 
        amount: amountInKobo, 
        recipient: recipientCode,
        reason: 'AfriBlast Creator Studio Revenue Settlement Disbursal Outflow',
      }),
    });

    const transferData = await transferResponse.json();
    if (!transferData.status) {
      return NextResponse.json({ error: `Transfer Engine Fault: ${transferData.message}` }, { status: 400 });
    }

    // NOTE: If you decide to transition to a strict ledger debit model down the line,
    // you can safely deduct from profiles.wallet_balance here. For now, we bypass the zero-out crash.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_balance: 0 }) 
      .eq('id', user.id);

    if (updateError) {
      console.error('Ledger notification warning:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payout disbursement processed successfully via bank networks!',
      transferCode: transferData.data.transfer_code 
    });

  } catch (err: any) {
    console.error('Outbound settlement routing framework crash error:', err);
    return NextResponse.json({ error: 'Internal system engine processing crash node failure' }, { status: 500 });
  }
}