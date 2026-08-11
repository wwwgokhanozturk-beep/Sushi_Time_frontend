const MAPBOX_VERSION = '3.7.0';

let loaderPromise = null;

/**
 * Подгружает mapbox-gl с CDN один раз (без npm-зависимости, как и остальная
 * карта проекта). Общий загрузчик для всех карт: MapboxMap (выбор адреса) и
 * DeliveryTrackingMap (отслеживание курьера).
 */
export function loadMapboxGL() {
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

export { MAPBOX_VERSION };
