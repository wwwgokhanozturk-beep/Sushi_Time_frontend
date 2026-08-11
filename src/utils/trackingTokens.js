const STORAGE_KEY = 'sushi_time_tracking_tokens';

/**
 * Токены отслеживания заказов { [orderId]: trackingToken }.
 *
 * Заказ, оформленный без регистрации, принадлежит устройству, а не аккаунту —
 * токен из ответа на оформление это единственное доказательство, что заказ
 * действительно наш. Без него сервер не отдаст позицию курьера.
 */
const readAll = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch { return {}; }
};

export function getTrackingToken(orderId) {
  if (!orderId) return null;
  return readAll()[String(orderId)] || null;
}

export function saveTrackingToken(orderId, token) {
  if (!orderId || !token) return;
  const all = readAll();
  all[String(orderId)] = token;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch {}
}
