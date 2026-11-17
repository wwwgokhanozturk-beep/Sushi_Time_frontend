import httpClient from '../api/httpClient';
import i18n from '../i18n';

// «Сайтом пользуются» — анонимная отметка для статистики в админке: сколько
// браузеров заходило за 30 дней, с аккаунтом или без (POST /devices/ping).
// Номер устройства случайный, его придумывает сам браузер: ни имени, ни
// телефона в нём нет. Отправляется раз в день и ещё раз, когда человек вошёл
// в аккаунт или вышел, — чтобы его отнесли к нужной группе. Аккаунт сервер
// узнаёт по обычному токену запроса.
const DEVICE_KEY = 'sushi_time_device_id';
const PING_KEY = 'sushi_time_device_ping';

const randomId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
};

function deviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// Отметка, которая уже в пути: второй вызов до ответа сервера её не дублирует
// (React в режиме разработки запускает эффекты дважды, вкладки открывают разом).
let sending = null;

export function pingDeviceActivity(signedIn) {
  try {
    const mark = `${new Date().toISOString().slice(0, 10)}|${signedIn ? 'account' : 'guest'}`;
    if (sending === mark || localStorage.getItem(PING_KEY) === mark) return;
    sending = mark;
    httpClient
      .post('/devices/ping', { deviceId: deviceId(), platform: 'web', language: i18n.language })
      .then(() => localStorage.setItem(PING_KEY, mark))
      .catch(() => {})
      .finally(() => { if (sending === mark) sending = null; });
  } catch {
    // Хранилище браузера закрыто (приватный режим и т. п.) — просто не считаем.
  }
}
