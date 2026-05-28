// src/app/api/stream/go-live/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';

// Initialize the Resend mail transmission subsystem
const resendKey = process.env.RESEND_API_KEY || 're_mock_key_for_build_purposes';
export const resend = new Resend(resendKey);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticate the broadcaster setting the stream online
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized credentials' }, { status: 401 });
    }

    // 2. Fetch the broadcaster's full display handle profile metrics
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const broadcasterName = profile?.full_name || 'A Premium AfriBlast Broadcaster';

    // 3. Query the user profiles linked to followers using Supabase's auth data link tables
    // Adjust target path configurations if you sync user details down to your public profile schema rows
    const { data: followers, error: followError } = await supabase
      .from('follows')
      .select(`
        listener_id,
        profiles!follows_listener_id_fkey (
          full_name
        )
      `)
      .eq('broadcaster_id', user.id);

    if (followError || !followers) {
      console.error('Database connection error mapping profiles:', followError);
      return NextResponse.json({ error: 'Failed retrieving follower routing directories' }, { status: 500 });
    }

    // Since auth.users is protected inside its own database schema layer, 
    // it's safest to look up emails directly from profiles or via a specialized secure service proxy route.
    // For local evaluation, we'll fetch follower profiles. Assuming your profiles table contains emails:
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('email')
      .in('id', followers.map(f => f.listener_id));

    const emailList = userProfiles?.map(p => p.email).filter(Boolean) || [];

    if (emailList.length === 0) {
      return NextResponse.json({ success: true, message: 'Broadcast pipeline hot: No followers found.' });
    }

    // 4. Batch Delivery Optimization Engine
    // Instead of looping individual await promises, Resend allows compilation payloads up to 100 blocks at once
    const batchPayloads = emailList.map((email) => ({
      from: 'AfriBlast Studio <onair@resend.dev>', // Replace with your verified custom domain down the line
      to: email,
      subject: `🔴 ${broadcasterName} is LIVE right now!`,
      html: `
        <div style="font-family: sans-serif; background-color: #020617; color: #f8fafc; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ea580c; font-size: 24px; font-weight: 800; margin-bottom: 4px;">AfriBlast Creator Studio</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 0;">Real-time Airwave Transmissions Notification</p>
          <hr style="border-color: #1e293b; margin: 24px 0;" />
          <p style="font-size: 16px; line-height: 1.6;">Hey there listener,</p>
          <p style="font-size: 16px; line-height: 1.6; font-weight: bold; color: #ffffff;">
            👤 ${broadcasterName} just pushed their audio control room slider hot and is broadcasting live on air right now!
          </p>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6;">
            Don't miss the premium educational study analysis, user interaction discussions, and marketplace storefront document reviews.
          </p>
          <div style="margin-top: 32px; text-align: center;">
            <a href="http://localhost:3000/listener/marketplace" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">
              📻 Join Live Audio Room Hub
            </a>
          </div>
        </div>
      `,
    }));

    // Trigger the atomic batch transmission array safely down the network pipeline
    const { data, error: mailError } = await resend.batch.send(batchPayloads);

    if (mailError) {
      console.error('Resend delivery subsystem core exception:', mailError);
      return NextResponse.json({ error: 'Mail distribution network rejected payload strings' }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully broadcasted live notifications to ${emailList.length} listeners dynamically!`,
      batchId: data?.data ? data.data : null
    });

  } catch (err: any) {
    console.error('Fatal crash on go-live webhook routing loops:', err);
    return NextResponse.json({ error: 'Internal pipeline system processing failure' }, { status: 500 });
  }
}