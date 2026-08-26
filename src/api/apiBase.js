// Where the API lives.
//
// VITE_API_URL is the intended knob, but when it is unset the old fallback was
// the relative '/api'. On Vercel that path is swallowed by the SPA rewrite in
// vercel.json, which answers every API call with index.html — so the site
// looks online while nothing actually loads: empty menu, empty district list,
// no way to order. A silent 200 of HTML is worse than a failure, because
// nothing in the UI reports it.
//
// Only a local dev server has a proxy worth falling back to, so anywhere else
// address the production backend explicitly — the same approach mobile_rn
// already takes with its PRODUCTION_API_URL.
const PRODUCTION_API_URL = 'https://sushitime-backend-production.up.railway.app/api';

const isLocalHost = () => {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]' || h.endsWith('.local');
};

/** Base URL for REST calls. */
export function resolveApiBase() {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) return explicit;
  return isLocalHost() ? '/api' : PRODUCTION_API_URL;
}

/** Origin for the Socket.io connection — same host as the REST API. */
export function resolveSocketOrigin() {
  const explicit = import.meta.env.VITE_SOCKET_URL;
  if (explicit) return explicit;
  try {
    const u = new URL(resolveApiBase(), window.location.origin);
    return `${u.protocol}//${u.host}`;
  } catch {
    return window.location.origin;
  }
}
