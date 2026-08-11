import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MAPBOX_TOKEN, RESTAURANT_LAT, RESTAURANT_LNG, Colors } from '../theme';
import { loadMapboxGL } from '../utils/mapboxLoader';

const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
// Длительность плавного «доезда» маркера до новой точки.
const MOVE_ANIMATION_MS = 900;

/** Пин ресторана — тот же фирменный логотип, что и на карте оформления заказа. */
function buildRestaurantEl(label) {
  const el = document.createElement('div');
  el.style.cssText = 'text-align:center;';
  el.innerHTML = `
    <img src="/image.png" alt="${label}"
      style="height:38px;width:auto;display:block;filter:drop-shadow(0 2px 5px rgba(0,0,0,.45));" />`;
  return el;
}

/** Пин точки доставки (адрес клиента). */
function buildDeliveryEl() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="width:26px;height:26px;background:${Colors.primaryDark};border:3px solid #fff;border-radius:50% 50% 50% 0;
      transform:rotate(45deg);box-shadow:0 3px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;background:#fff;border-radius:50%;transform:rotate(-45deg);"></div>
    </div>`;
  return el;
}

/** Курьер — скутер в белом кружке с пульсацией, чтобы его было видно в движении. */
function buildDriverEl() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="position:relative;width:44px;height:44px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${Colors.primary};opacity:.3;
        animation:stxPulse 1.8s ease-out infinite;"></div>
      <div style="position:absolute;top:5px;left:5px;width:34px;height:34px;border-radius:50%;background:#fff;
        border:3px solid ${Colors.primary};box-shadow:0 3px 10px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;">🛵</div>
    </div>`;
  if (!document.getElementById('stx-pulse-style')) {
    const s = document.createElement('style');
    s.id = 'stx-pulse-style';
    s.textContent = '@keyframes stxPulse{0%{transform:scale(1);opacity:.5}100%{transform:scale(3.2);opacity:0}}';
    document.head.appendChild(s);
  }
  return el;
}

/**
 * DeliveryTrackingMap — карта «где мой заказ».
 * Показывает ресторан, адрес доставки и живую позицию курьера.
 *
 * Props:
 *   driverLocation   — { lat, lng } | null — позиция курьера (обновляется по сокету)
 *   deliveryLocation — { lat, lng } | null — точка доставки (координаты заказа)
 *   height           — высота карты, default 260
 */
export default function DeliveryTrackingMap({ driverLocation, deliveryLocation, height = 260 }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const animationRef = useRef(null);
  // Как только пользователь сам подвинул карту — перестаём её автоцентрировать.
  const userMovedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  // ── Инициализация карты ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const center = deliveryLocation
          ? [deliveryLocation.lng, deliveryLocation.lat]
          : [RESTAURANT_LNG, RESTAURANT_LAT];

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center,
          zoom: 14,
          attributionControl: false,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        map.on('load', () => {
          new mapboxgl.Marker({ element: buildRestaurantEl(t('app_title')), anchor: 'bottom' })
            .setLngLat([RESTAURANT_LNG, RESTAURANT_LAT])
            .addTo(map);
          if (!cancelled) setReady(true);
        });
        // Ручное перетаскивание/зум отключает автоподгон границ.
        map.on('dragstart', () => { userMovedRef.current = true; });
        map.on('zoomstart', (e) => { if (e.originalEvent) userMovedRef.current = true; });

        mapRef.current = map;
      })
      .catch(() => !cancelled && setError(t('map_load_error')));

    return () => {
      cancelled = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Точка доставки ─────────────────────────────────────────────────────
  useEffect(() => {
    const mapboxgl = window.mapboxgl;
    const map = mapRef.current;
    if (!ready || !map || !mapboxgl || !deliveryLocation) return;

    const lngLat = [deliveryLocation.lng, deliveryLocation.lat];
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLngLat(lngLat);
    } else {
      deliveryMarkerRef.current = new mapboxgl.Marker({ element: buildDeliveryEl(), anchor: 'bottom' })
        .setLngLat(lngLat)
        .addTo(map);
    }
  }, [ready, deliveryLocation?.lat, deliveryLocation?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Курьер: плавное перемещение + автоподгон границ ────────────────────
  useEffect(() => {
    const mapboxgl = window.mapboxgl;
    const map = mapRef.current;
    if (!ready || !map || !mapboxgl) return;

    // Курьера сняли (заказ доставлен/отменён) — убираем маркер.
    if (!driverLocation) {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
      return;
    }

    const target = [driverLocation.lng, driverLocation.lat];

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new mapboxgl.Marker({ element: buildDriverEl(), anchor: 'center' })
        .setLngLat(target)
        .addTo(map);
    } else {
      // Позиции приходят раз в несколько секунд — интерполируем, иначе маркер
      // будет телепортироваться.
      const start = driverMarkerRef.current.getLngLat();
      const from = [start.lng, start.lat];
      const startedAt = performance.now();

      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const step = (now) => {
        const progress = Math.min(1, (now - startedAt) / MOVE_ANIMATION_MS);
        driverMarkerRef.current?.setLngLat([
          from[0] + (target[0] - from[0]) * progress,
          from[1] + (target[1] - from[1]) * progress,
        ]);
        if (progress < 1) animationRef.current = requestAnimationFrame(step);
      };
      animationRef.current = requestAnimationFrame(step);
    }

    // Держим в кадре курьера и адрес доставки, пока пользователь не вмешался.
    if (!userMovedRef.current) {
      if (deliveryLocation) {
        const bounds = new mapboxgl.LngLatBounds(target, target);
        bounds.extend([deliveryLocation.lng, deliveryLocation.lat]);
        map.fitBounds(bounds, { padding: 60, maxZoom: 15.5, duration: 800 });
      } else {
        map.easeTo({ center: target, zoom: 15, duration: 800 });
      }
    }
  }, [ready, driverLocation?.lat, driverLocation?.lng, deliveryLocation?.lat, deliveryLocation?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: 'relative',
        height,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1.5px solid var(--divider)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {error && (
        <div
          style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'var(--surface)', color: 'var(--error)',
            fontWeight: 600, fontSize: 14, padding: 16, textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
