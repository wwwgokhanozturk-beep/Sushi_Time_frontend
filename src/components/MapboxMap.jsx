import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MAPBOX_TOKEN, RESTAURANT_LAT, RESTAURANT_LNG, Colors } from '../theme';

const MAPBOX_VERSION = '3.7.0';
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

let loaderPromise = null;

/** Подгружает mapbox-gl с CDN один раз (без npm-зависимости, как и остальная карта проекта). */
function loadMapboxGL() {
  if (window.mapboxgl) return Promise.resolve(window.mapboxgl);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const cssId = 'mapbox-gl-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}/mapbox-gl.js`;
    script.async = true;
    script.onload = () => resolve(window.mapboxgl);
    script.onerror = () => reject(new Error('Mapbox GL failed to load'));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

/** Красный «фирменный» пин ресторана. */
function buildRestaurantEl(label) {
  const el = document.createElement('div');
  el.style.cssText = 'cursor:default;transform:translateY(-2px);text-align:center;';
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:${Colors.primary};color:#fff;font-size:11px;font-weight:800;
        padding:3px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25);
        font-family:Inter,sans-serif;margin-bottom:3px;">🍣 ${label}</div>
      <div style="width:30px;height:30px;background:${Colors.primary};border:3px solid #fff;border-radius:50% 50% 50% 0;
        transform:rotate(45deg);box-shadow:0 3px 8px rgba(0,0,0,.35);"></div>
    </div>`;
  return el;
}

/** Пин точки доставки (перетаскиваемый). */
function buildDeliveryEl() {
  const el = document.createElement('div');
  el.style.cssText = 'cursor:grab;';
  el.innerHTML = `
    <div style="width:26px;height:26px;background:${Colors.primaryDark};border:3px solid #fff;border-radius:50% 50% 50% 0;
      transform:rotate(45deg);box-shadow:0 3px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;">
      <div style="width:8px;height:8px;background:#fff;border-radius:50%;transform:rotate(-45deg);"></div>
    </div>`;
  return el;
}

/** Пульсирующий красный кружок — текущее местоположение пользователя. */
function buildUserEl() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="position:relative;width:18px;height:18px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${Colors.primary};opacity:.35;
        animation:stxPulse 1.8s ease-out infinite;"></div>
      <div style="position:absolute;top:3px;left:3px;width:12px;height:12px;border-radius:50%;
        background:${Colors.primary};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);"></div>
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
 * MapboxMap — карта оформления заказа.
 *  - красный пин ресторана (фиксированный),
 *  - тап по карте ставит точку доставки (перетаскиваемую),
 *  - кнопка «Моё местоположение» запрашивает геолокацию и рисует красный кружок.
 *
 * Props:
 *   value     — { lat, lng } выбранная точка доставки (или null)
 *   onChange  — (lat, lng) => void
 *   height    — высота карты (px), default 280
 */
export default function MapboxMap({ value, onChange, height = 280 }) {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const placeDelivery = useCallback((lng, lat) => {
    const mapboxgl = window.mapboxgl;
    const map = mapRef.current;
    if (!map || !mapboxgl) return;
    if (deliveryMarkerRef.current) {
      deliveryMarkerRef.current.setLngLat([lng, lat]);
    } else {
      const marker = new mapboxgl.Marker({ element: buildDeliveryEl(), anchor: 'bottom', draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);
      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        onChange?.(ll.lat, ll.lng);
      });
      deliveryMarkerRef.current = marker;
    }
    onChange?.(lat, lng);
  }, [onChange]);

  // Инициализация карты
  useEffect(() => {
    let cancelled = false;
    loadMapboxGL()
      .then((mapboxgl) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;
        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: MAP_STYLE,
          center: [RESTAURANT_LNG, RESTAURANT_LAT],
          zoom: 14.5,
          attributionControl: false,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
        map.on('load', () => {
          // Маркер ресторана
          new mapboxgl.Marker({ element: buildRestaurantEl(t('app_title')), anchor: 'bottom' })
            .setLngLat([RESTAURANT_LNG, RESTAURANT_LAT])
            .addTo(map);
          if (!cancelled) setReady(true);
        });
        map.on('click', (e) => placeDelivery(e.lngLat.lng, e.lngLat.lat));
        mapRef.current = map;
      })
      .catch(() => !cancelled && setError(t('map_load_error')));
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Внешнее значение -> маркер
  useEffect(() => {
    if (!ready) return;
    if (value?.lat != null && value?.lng != null) {
      if (!deliveryMarkerRef.current || deliveryMarkerRef.current.getLngLat().lat !== value.lat) {
        placeDelivery(value.lng, value.lat);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, value?.lat, value?.lng]);

  const handleLocate = useCallback(() => {
    setError('');
    if (!navigator.geolocation) { setError(t('location_unavailable')); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        const mapboxgl = window.mapboxgl;
        const map = mapRef.current;
        if (!map || !mapboxgl) return;
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat([longitude, latitude]);
        } else {
          userMarkerRef.current = new mapboxgl.Marker({ element: buildUserEl(), anchor: 'center' })
            .setLngLat([longitude, latitude])
            .addTo(map);
        }
        map.flyTo({ center: [longitude, latitude], zoom: 16, essential: true });
        placeDelivery(longitude, latitude);
      },
      () => { setLocating(false); setError(t('location_denied')); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [placeDelivery, t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', height, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1.5px solid var(--divider)', boxShadow: 'var(--shadow-sm)' }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          style={{
            position: 'absolute', top: 12, right: 12, zIndex: 2,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: '#fff', color: 'var(--primary)',
            border: 'none', borderRadius: 'var(--radius-full)', fontSize: 13, fontWeight: 700,
            cursor: locating ? 'default' : 'pointer', boxShadow: 'var(--shadow-md)',
          }}
        >
          <span>📍</span>
          <span>{locating ? t('locating') : t('use_my_location')}</span>
        </button>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <span>{value?.lat != null ? `📌 ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : t('tap_map_to_pick')}</span>
        {error && <span style={{ color: 'var(--error)', fontWeight: 600 }}>{error}</span>}
      </div>
    </div>
  );
}
