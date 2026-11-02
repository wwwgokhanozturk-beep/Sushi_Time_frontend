import { useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// useState, значение которого принадлежит записи истории: «Назад» на страницу
// возвращает его (например, текст поиска в меню), а новое открытие страницы
// начинает с initial. Хранится в sessionStorage вкладки.
export default function useHistoryState(name, initial) {
  const { pathname, key } = useLocation();
  const comingBack = useNavigationType() === 'POP';
  const id = `sushi_state:${name}:${pathname}:${key}`;
  const [value, setValue] = useState(() => {
    if (!comingBack) return initial;
    try {
      const saved = sessionStorage.getItem(id);
      return saved === null ? initial : JSON.parse(saved);
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      if (value === initial) sessionStorage.removeItem(id);
      else sessionStorage.setItem(id, JSON.stringify(value));
    } catch {
      // Хранилище недоступно — значение живёт, пока открыта страница.
    }
  }, [id, value, initial]);

  return [value, setValue];
}
