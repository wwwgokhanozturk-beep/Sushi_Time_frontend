import React, { useEffect, useState } from 'react';
import { isVideoUrl } from '../utils/promo';

// A promotion's media lives in `imageUrl`, but it may actually be a video.
// An <img> can't play video — it stays blank on desktop/Android — so we detect
// video and render <video> instead. The URL often has no file extension
// (e.g. UploadThing), so besides the extension check we probe the Content-Type
// with a HEAD request, and keep an onError fallback as a last resort.
export default function PromoMedia({ src, alt = '', style, muted = true }) {
  // 'video' | 'image' | 'unknown'
  const [kind, setKind] = useState(() => (isVideoUrl(src) ? 'video' : 'unknown'));

  useEffect(() => {
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
  }, [src]);

  if (kind === 'video') {
    return (
      <video
        src={src}
        style={style}
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="metadata"
      />
    );
  }

  // image or still-unknown: render <img>; if it turns out to be a video the
  // load fails and we fall back to <video>.
  return <img src={src} alt={alt} style={style} onError={() => setKind('video')} />;
}
