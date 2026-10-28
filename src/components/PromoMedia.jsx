import React, { useEffect, useRef, useState } from 'react';
import { isVideoUrl } from '../utils/promo';

// A promotion's media lives in `imageUrl`, but it may actually be a video.
// An <img> can't play video — it stays blank on desktop/Android — so we detect
// video and render <video> instead. The server stores the real type as
// `mediaType`; without it (older records) the URL often has no file extension
// (e.g. UploadThing), so besides the extension check we probe the Content-Type
// with a HEAD request, and keep an onError fallback as a last resort.
// `onFrame(video)` fires once, a second into playback, so the banner can
// paint a still of the clip as its blurred backdrop.
//
// `active` — only the slide on screen plays and downloads its clip; the rest
// wait with preload="none" and show `poster` (the first frame, made by the
// server), so a carousel of several clips doesn't load them all at once.
export default function PromoMedia({
  src, alt = '', style, muted = true, scale = 1, offsetX = 0, offsetY = 0, onFrame,
  mediaType, poster, active = true,
}) {
  const known = mediaType === 'video' || mediaType === 'image' ? mediaType : null;
  // 'video' | 'image' | 'unknown'
  const [kind, setKind] = useState(() => known || (isVideoUrl(src) ? 'video' : 'unknown'));
  const videoRef = useRef(null);

  useEffect(() => {
    if (known) { setKind(known); return; }
    if (isVideoUrl(src)) { setKind('video'); return; }
    setKind('unknown');
    if (!src) return;

    let cancelled = false;
    fetch(src, { method: 'HEAD' })
      .then((r) => {
        const ct = r.headers.get('content-type') || '';
        if (!cancelled) setKind(ct.startsWith('video/') ? 'video' : 'image');
      })
      .catch(() => { /* keep optimistic <img>; onError switches to video */ });

    return () => { cancelled = true; };
  }, [src, known]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) video.play().catch(() => { /* autoplay refused — poster stays */ });
    else video.pause();
  }, [active, kind]);

  // Кадрирование, заданное в админке (масштаб + смещение в % рамки) — как в меню.
  const framed = (scale !== 1 || offsetX !== 0 || offsetY !== 0)
    ? { ...style, transform: `translate(${offsetX}%, ${offsetY}%) scale(${scale})`, transformOrigin: 'center' }
    : style;

  if (kind === 'video') {
    return (
      <video
        ref={videoRef}
        src={src}
        poster={poster || undefined}
        style={framed}
        autoPlay={active}
        muted={muted}
        loop
        playsInline
        preload={active ? 'auto' : 'none'}
        onTimeUpdate={onFrame ? (e) => { if (e.currentTarget.currentTime >= 1) onFrame(e.currentTarget); } : undefined}
      />
    );
  }

  // image or still-unknown: render <img>; if it turns out to be a video the
  // load fails and we fall back to <video>.
  return <img src={src} alt={alt} style={framed} onError={() => setKind('video')} />;
}
