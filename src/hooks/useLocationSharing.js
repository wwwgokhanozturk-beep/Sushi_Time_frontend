import { useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket } from '../api/socket';
import { useProfileStore } from '../store/profileStore';

// Не чаще одного раза в 7 секунд — этого хватает для плавной карты и не сажает
// батарею. Сервер всё равно отбрасывает всё чаще 2 секунд.
const MIN_SEND_INTERVAL_MS = 7000;
// Сдвиг меньше 20 м считаем дрожанием GPS и не отправляем…
const MIN_DISTANCE_M = 20;
// …но раз в 25 секунд отправляем в любом случае, чтобы клиент видел «живой» сигнал.
const HEARTBEAT_MS = 25000;

/** Расстояние между двумя точками в метрах (гаверсинус). */
function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Передача геопозиции курьера по сокету.
 *
 * Браузер отдаёт координаты только пока вкладка жива, поэтому дополнительно
 * запрашиваем Wake Lock — экран не гаснет и поток не прерывается. Это главное
 * ограничение веб-варианта: свернуть браузер нельзя.
 */
export function useLocationSharing() {
  const token = useProfileStore((s) => s.token);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [lastSentAt, setLastSentAt] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);

  const watchIdRef = useRef(null);
  const wakeLockRef = useRef(null);
  const orderIdsRef = useRef([]);
  const lastSentRef = useRef({ at: 0, point: null });

  const releaseWakeLock = useCallback(() => {
    try { wakeLockRef.current?.release?.(); } catch {}
    wakeLockRef.current = null;
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // Не критично — просто экран может погаснуть.
    }
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    releaseWakeLock();
    orderIdsRef.current = [];
    lastSentRef.current = { at: 0, point: null };
    setSharing(false);
  }, [releaseWakeLock]);

  const start = useCallback(
    async (orderIds) => {
      const ids = (Array.isArray(orderIds) ? orderIds : [orderIds]).filter(Boolean).map(String);
      if (ids.length === 0) return;
      if (!navigator.geolocation) {
        setError('geolocation_unsupported');
        return;
      }
      if (!token) {
        setError('not_authenticated');
        return;
      }

      setError('');
      orderIdsRef.current = ids;
      const socket = connectSocket(token);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const point = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentPosition(point);

          const now = Date.now();
          const { at, point: prev } = lastSentRef.current;
          const movedEnough = !prev || distanceMeters(prev, point) >= MIN_DISTANCE_M;
          const dueForHeartbeat = now - at >= HEARTBEAT_MS;

          if (now - at < MIN_SEND_INTERVAL_MS) return;
          if (!movedEnough && !dueForHeartbeat) return;

          lastSentRef.current = { at: now, point };
          setLastSentAt(now);
          orderIdsRef.current.forEach((orderId) => {
            socket?.emit('driver:location', { orderId, lat: point.lat, lng: point.lng });
          });
        },
        (err) => {
          setError(err.code === err.PERMISSION_DENIED ? 'permission_denied' : 'position_unavailable');
          stop();
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
      );

      setSharing(true);
      await requestWakeLock();
    },
    [token, requestWakeLock, stop],
  );

  // Wake Lock снимается системой при уходе со вкладки — возвращаем его обратно.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && sharing && !wakeLockRef.current) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [sharing, requestWakeLock]);

  // Уход со страницы не должен оставлять висящий watchPosition.
  useEffect(() => stop, [stop]);

  return { sharing, error, lastSentAt, currentPosition, start, stop };
}
