import type { APIRoute } from 'astro';
import { getAppEnv } from '@/lib/env';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const formData = await request.formData();
  const authType = formData.get('auth_type')?.toString();
  const supabase = locals.supabase;

  // 1. Email + Password
  if (authType === 'password') {
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return redirect('/dashboard');
  }

  // 2. Magic Link
  if (authType === 'magic_link') {
    const email = formData.get('email')?.toString();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const env = await getAppEnv();
    const appUrl = env?.PUBLIC_APP_URL || import.meta.env.PUBLIC_APP_URL || 'http://localhost:4321';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/api/auth/callback`,
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'Magic link sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Mobile OTP Request
  if (authType === 'otp_request') {
    const phone = formData.get('phone')?.toString();

    if (!phone) {
      return new Response(JSON.stringify({ error: 'Phone number is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let cleanPhone = phone.replace(/[\s\-\+]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone: cleanPhone,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. Mobile OTP Verification
  if (authType === 'otp_verify') {
    const phone = formData.get('phone')?.toString();
    const token = formData.get('token')?.toString();

    if (!phone || !token) {
      return new Response(JSON.stringify({ error: 'Phone and OTP are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let cleanPhone = phone.replace(/[\s\-\+]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `+91${cleanPhone}`;
    } else if (!cleanPhone.startsWith('+')) {
      cleanPhone = `+${cleanPhone}`;
    }

    const { error } = await supabase.auth.verifyOtp({
      phone: cleanPhone,
      token,
      type: 'sms',
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return redirect('/dashboard');
  }

  // 5. Google OAuth Initiator
  if (authType === 'google') {
    const env = await getAppEnv();
    const appUrl = env?.PUBLIC_APP_URL || import.meta.env.PUBLIC_APP_URL || 'http://localhost:4321';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${appUrl}/api/auth/callback`,
      },
    });

    if (error || !data.url) {
      return new Response(JSON.stringify({ error: error?.message || 'OAuth error' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return redirect(data.url);
  }

  return new Response(JSON.stringify({ error: 'Invalid authentication type' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
};
