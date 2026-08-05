'use client';

import React, { useEffect, useState } from 'react';

export default function HeliosLogo({ className = '' }: { className?: string }) {
  const [transparentDataUrl, setTransparentDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = '/images/Helios towers logo.jpeg';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Scan all pixels and convert white/light background to 100% transparent
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Threshold for white/off-white background removal
        if (r > 210 && g > 210 && b > 210) {
          data[i + 3] = 0; // Set alpha to zero (transparent)
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setTransparentDataUrl(canvas.toDataURL('image/png'));
    };
  }, []);

  return (
    <div className={`flex items-center ${className}`}>
      {transparentDataUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={transparentDataUrl}
          alt="Helios Towers"
          className="h-10 w-auto object-contain drop-shadow-xs"
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src="/images/Helios towers logo.jpeg"
          alt="Helios Towers"
          className="h-10 w-auto object-contain mix-blend-multiply"
        />
      )}
    </div>
  );
}
