import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Где была прокручена каждая запись истории вкладки: { "/menu:<key>": y }.
// Лежит в sessionStorage, чтобы и перезагрузка возвращала на то же место.
const STORAGE_KEY = 'sushi_scroll';
const MAX_ENTRIES = 100;
// Сколько ждать, пока страница дорастёт до сохранённого места (после
// перезагрузки меню строится только после ответа API), и какой недобор высоты
// не считать «ещё грузится»: на телефоне высота окна гуляет с адресной строкой.
const RESTORE_MS = 3000;
const SLACK_PX = 120;
// Пользователь сам взялся за прокрутку — больше не вмешиваемся.
const USER_INPUT = ['wheel', 'touchstart', 'keydown', 'mousedown'];

function loadPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

const positions = loadPositions();

function savePositions() {
  const keys = Object.keys(positions);
  for (const old of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) delete positions[old];
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Хранилище недоступно (приватный режим) — помним только до перезагрузки.
  }
}

// Возвращает страницу на y, как только она достаточно высокая. Отдаёт функцию,
// которая отменяет ожидание.
function restoreScroll(y) {
  const root = document.documentElement;
  let observer = null;
  let timer = 0;
  const stop = () => {
    observer?.disconnect();
    clearTimeout(timer);
    USER_INPUT.forEach((type) => window.removeEventListener(type, stop));
  };
  const attempt = (force) => {
    const max = root.scrollHeight - window.innerHeight;
    if (!force && max < y - SLACK_PX) return false;
    window.scrollTo(0, Math.min(y, Math.max(0, max)));
    stop();
    return true;
  };
  if (attempt(false)) return stop;
  observer = new ResizeObserver(() => attempt(false));
  observer.observe(document.body);
  timer = setTimeout(() => attempt(true), RESTORE_MS);
  USER_INPUT.forEach((type) => window.addEventListener(type, stop, { passive: true }));
  return stop;
}

// Новая страница открывается сверху, а «Назад» и «Вперёд» возвращают страницу
// туда, где её оставили: меню — к блюду, со страницы которого вернулись. Окно
// «i» кладёт в историю запись с тем же ключом, поэтому его закрытие прокрутку
// не трогает.
export default function ScrollMemory() {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const lastPathname = useRef(pathname);

  // Браузер восстанавливает прокрутку сам, но раньше, чем страница успевает
  // построиться, и попадает мимо.
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useLayoutEffect(() => {
    const id = `${pathname}:${key}`;
    let stopRestore = () => {};
    if (navigationType === 'POP') {
      if (positions[id] > 0) stopRestore = restoreScroll(positions[id]);
    } else if (pathname !== lastPathname.current) {
      window.scrollTo(0, 0);
    }
    lastPathname.current = pathname;

    // Запоминаем в момент прокрутки: к уходу со страницы на экране уже
    // следующая, и scrollY относится к ней.
    let persistTimer = 0;
    const onScroll = () => {
      positions[id] = Math.round(window.scrollY);
      clearTimeout(persistTimer);
      persistTimer = setTimeout(savePositions, 250);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      stopRestore();
      window.removeEventListener('scroll', onScroll);
      clearTimeout(persistTimer);
      savePositions();
    };
    // Срабатывает на смену записи истории; navigationType меняется вместе с ней.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, key]);

  return null;
}
