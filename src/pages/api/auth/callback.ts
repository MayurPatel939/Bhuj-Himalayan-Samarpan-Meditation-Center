import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = locals.supabase;
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return redirect(next);
    }
    console.error('[Auth Callback] Code exchange error:', error);
  }

  // Return to login with error if exchange failed
  return redirect('/login?error=auth_callback_failed');
};
