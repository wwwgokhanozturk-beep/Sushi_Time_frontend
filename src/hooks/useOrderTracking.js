import { useEffect, useState } from 'react';
import { connectSocket } from '../api/socket';
import { useProfileStore } from '../store/profileStore';
import { getTrackingToken, saveTrackingToken } from '../utils/trackingTokens';

/**
 * Подписка на живое отслеживание одного заказа.
 *
 * Возвращает { driverLocation, status, connected }:
 *   driverLocation — { lat, lng, updatedAt } | null — позиция курьера
 *   status         — статус заказа, приходящий по сокету (обгоняет опрос раз в 15с)
 *
 * Позиция приходит только пока заказ в пути и только тому, кто доказал право
 * на заказ (владелец по JWT либо гость с trackingToken).
 */
export function useOrderTracking(orderId, order) {
  const ensureGuest = useProfileStore((s) => s.ensureGuest);
  const [driverLocation, setDriverLocation] = useState(null);
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);

  // Токен из ответа на оформление заказа мог прийти позже — сохраняем его.
  useEffect(() => {
    if (order?._id && order?.trackingToken) {
      saveTrackingToken(order._id, order.trackingToken);
    }
  }, [order?._id, order?.trackingToken]);

  useEffect(() => {
    if (!orderId) return undefined;

    let cancelled = false;
    let socket = null;
    let subscribe = null;

    const onDriverLocation = (payload) => {
      if (String(payload.orderId) !== String(orderId)) return;
      setDriverLocation({ lat: payload.lat, lng: payload.lng, updatedAt: payload.updatedAt });
    };
    const onStatus = (payload) => {
      if (String(payload.orderId) !== String(orderId)) return;
      setStatus(payload.status);
      // Заказ закрыт — курьера с карты убираем.
      if (['delivered', 'cancelled'].includes(payload.status)) setDriverLocation(null);
    };

    (async () => {
      // Сокет требует токен; у гостя его нет, поэтому берём одноразовый гостевой.
      const token = await ensureGuest();
      if (cancelled || !token) return;

      socket = connectSocket(token);
      if (!socket) return;

      subscribe = () => {
        socket.emit(
          'order:subscribe',
          { orderId, trackingToken: getTrackingToken(orderId) },
          (res) => {
            if (cancelled) return;
            setConnected(!!res?.success);
            if (res?.success) {
              if (res.data?.driverLocation) setDriverLocation(res.data.driverLocation);
              if (res.data?.status) setStatus(res.data.status);
            }
          },
        );
      };

      socket.on('order:driver_location', onDriverLocation);
      socket.on('order:status', onStatus);
      // Переподключение (сон вкладки, смена сети) не должно терять подписку.
      socket.on('connect', subscribe);

      if (socket.connected) subscribe();
    })();

    return () => {
      cancelled = true;
      if (socket) {
        socket.emit('order:unsubscribe', { orderId });
        socket.off('order:driver_location', onDriverLocation);
        socket.off('order:status', onStatus);
        if (subscribe) socket.off('connect', subscribe);
      }
    };
  }, [orderId, ensureGuest]);

  return { driverLocation, status, connected };
}
