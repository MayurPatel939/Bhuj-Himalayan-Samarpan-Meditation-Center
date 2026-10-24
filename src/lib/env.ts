/**
 * Helper to safely resolve Cloudflare Worker environment bindings
 * Compatible with Astro v6+ / @astrojs/cloudflare v14 (import { env } from 'cloudflare:workers')
 * with fallback to import.meta.env in local development/build time.
 */
export async function getAppEnv(): Promise<Record<string, any>> {
  try {
    // Dynamic import to prevent bundler errors in non-worker environments
    const cf = await import('cloudflare:workers');
    if (cf && cf.env) {
      return cf.env;
    }
  } catch {
    // Not running inside Cloudflare runtime
  }

  return (import.meta as any).env || {};
}
