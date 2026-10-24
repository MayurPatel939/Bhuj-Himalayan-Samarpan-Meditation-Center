import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase/client';
import { createTranslator, type Locale } from './i18n';
import { getAppEnv } from './lib/env';

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Language / Locale Detection
  const cookieLocale = context.cookies.get('locale')?.value as Locale | undefined;
  const acceptLang = context.request.headers.get('accept-language')?.toLowerCase() ?? '';
  let locale: Locale = 'en';

  if (cookieLocale && (cookieLocale === 'en' || cookieLocale === 'gu')) {
    locale = cookieLocale;
  } else if (acceptLang.includes('gu')) {
    locale = 'gu';
  }

  context.locals.locale = locale;
  context.locals.t = createTranslator(locale);

  // 2. Initialize Supabase Server Client
  const cfEnv = await getAppEnv();
  const supabase = createSupabaseServerClient({
    request: context.request,
    cookies: context.cookies,
    env: cfEnv,
  });

  context.locals.supabase = supabase;

  // 3. Authenticate User session
  try {
    const { data: { user } } = await supabase.auth.getUser();
    context.locals.user = user;

    if (user) {
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      context.locals.profile = profile || null;

      // Fetch user roles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('center_id, roles(name, hierarchy_level)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      context.locals.roles = (userRoles || []).map((ur: any) => ({
        role_name: ur.roles?.name,
        center_id: ur.center_id,
        hierarchy_level: ur.roles?.hierarchy_level ?? 9,
      }));
    } else {
      context.locals.profile = null;
      context.locals.roles = [];
    }
  } catch (err) {
    console.error('Middleware Auth error:', err);
    context.locals.user = null;
    context.locals.profile = null;
    context.locals.roles = [];
  }

  // 4. Protected Route Guard
  const url = new URL(context.request.url);
  const isDashboardRoute = url.pathname.startsWith('/dashboard');

  if (isDashboardRoute && !context.locals.user) {
    return context.redirect(`/login?redirect=${encodeURIComponent(url.pathname)}`);
  }

  return next();
});
