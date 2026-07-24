// Режим работы ресторана — клиентское зеркало backend_api/src/utils/businessHours.js.
// Держите оба файла синхронными. Сервер остаётся источником истины (блокирует
// заказ), а клиент использует это для UI: модалка «закрыто» и блокировка кнопки.

export const RESTAURANT_TZ = 'Europe/Istanbul'; // вся Турция в одной зоне

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function zonedParts(date, tz = RESTAURANT_TZ) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .reduce((acc, p) => ((acc[p.type] = p.value), acc), {});

  return {
    weekday: Math.max(0, WEEKDAYS.indexOf(parts.weekday)),
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: toMinutes(`${parts.hour}:${parts.minute}`),
  };
}

export function emptyWeek() {
  return Array.from({ length: 7 }, () => ({ closed: false, open: '10:00', close: '23:00' }));
}

// Возвращает { enabled, open, date, weekday, today, reason }. Зеркало сервера.
export function computeOpenState(value, date = new Date()) {
  const week = Array.isArray(value?.week) && value.week.length === 7 ? value.week : emptyWeek();
  const holidays = Array.isArray(value?.holidays) ? value.holidays : [];
  const { weekday, date: todayStr, minutes } = zonedParts(date);
  const today = week[weekday] || { closed: false, open: '10:00', close: '23:00' };

  if (!value?.enabled) {
    return { enabled: false, open: true, date: todayStr, weekday, today, reason: 'disabled' };
  }
  if (holidays.includes(todayStr)) {
    return { enabled: true, open: false, date: todayStr, weekday, today, reason: 'holiday' };
  }
  if (today.closed) {
    return { enabled: true, open: false, date: todayStr, weekday, today, reason: 'day_off' };
  }

  const openMin = TIME_RE.test(today.open) ? toMinutes(today.open) : 0;
  const closeMin = TIME_RE.test(today.close) ? toMinutes(today.close) : 0;

  let open;
  if (openMin === closeMin) open = false;
  else if (closeMin > openMin) open = minutes >= openMin && minutes < closeMin;
  else open = minutes >= openMin || minutes < closeMin; // через полночь

  return { enabled: true, open, date: todayStr, weekday, today, reason: open ? 'open' : 'closed' };
}

// Upcoming `days` days (starting today) that the restaurant is open, for the
// pre-order picker shown when it's currently closed. Each entry:
// { date: 'YYYY-MM-DD', weekday, open: 'HH:MM', close: 'HH:MM' }.
// Skips days off and holidays. Overnight schedules (close < open) are kept
// as-is — the time-slot picker only offers times up to 23:30 for those.
export function getUpcomingOpenDays(value, days = 7, from = new Date()) {
  const week = Array.isArray(value?.week) && value.week.length === 7 ? value.week : emptyWeek();
  const holidays = Array.isArray(value?.holidays) ? value.holidays : [];
  const result = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    const { weekday, date } = zonedParts(d);
    const today = week[weekday];
    if (!today || today.closed || holidays.includes(date)) continue;
    if (!TIME_RE.test(today.open) || !TIME_RE.test(today.close) || today.open === today.close) continue;
    result.push({ date, weekday, open: today.open, close: today.close });
  }

  return result;
}

// Half-hour time slots between `open` and `close` (exclusive of close),
// e.g. ('10:00','12:00') -> ['10:00','10:30','11:00','11:30'].
export function getTimeSlots(open, close) {
  const openMin = toMinutes(open);
  const closeMin = toMinutes(close) > openMin ? toMinutes(close) : 24 * 60; // overnight: cap at day end
  const slots = [];
  for (let m = openMin; m < closeMin; m += 30) {
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${h}:${mm}`);
  }
  return slots;
}
