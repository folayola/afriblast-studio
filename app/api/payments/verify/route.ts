import { NextResponse } from 'next/server';
import { createClient } from '../../../../utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { reference } = await request.json();
    
    // Crucial Fix: Add 'await' because your server-side createClient utility is asynchronous
    const supabase = await createClient();

    if (!reference) {
      return NextResponse.json({ error: 'Missing payment transaction reference' }, { status: 400 });
    }

    // Securely ping Paystack API core servers to audit this reference
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // ... (Keep the exact same Paystack fetch verification block above this) ...

    const paymentData = await paystackResponse.json();

    if (!paymentData.status || paymentData.data.status !== 'success') {
      return NextResponse.json({ error: 'Transaction verification failed.' }, { status: 400 });
    }

    // Extract variables from the metadata payload
    // const { purchase_type, material_id, buyer_id, plan_id } = paymentData.data.metadata;
    const { purchase_type, material_id, buyer_id, plan_name, billing_cycle } = paymentData.data.metadata;

    if (!buyer_id) {
      return NextResponse.json({ error: 'Missing buyer ID trace token.' }, { status: 400 });
    }

    // BRANCH 1: Process Material Purchase
    if (purchase_type === 'material') {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: buyer_id,
          material_id: material_id,
          purchased_at: new Date().toISOString()
        });

      if (purchaseError) throw purchaseError;
    } 
    
    // BRANCH 2: Process Recurring Subscription Tier Authorization
    else if (purchase_type === 'subscription') {
      // Calculate subscription duration boundaries (e.g., active for 30 days)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      const { error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: buyer_id,          // Maps to user_id column
        plan_name: plan_name,       // FIXES BOTH: column name and variable reference!
        billing_cycle: billing_cycle || 'monthly', // Stores 'monthly' or 'annual'
        status: 'active',
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
        paystack_customer_code: paymentData.data.customer.customer_code
      });

    if (subError) throw subError;

      if (subError) throw subError;
    }

    return NextResponse.json({ success: true, message: 'Payment authenticated successfully!' });

  } catch (err: any) {
    console.error('Payment processing breakdown:', err);
    return NextResponse.json({ error: err.message || 'Internal payment processing error' }, { status: 500 });
  }
}