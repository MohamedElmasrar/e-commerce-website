"use client";

import { useState } from "react";

export function ProductGallery({ name, urls }: { name: string; urls: string[] }) {
  const [selected, setSelected] = useState(0);
  const current = urls[Math.min(selected, urls.length - 1)];
  return (
    <div>
      <div className="h-64 image-fit rounded-md overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={name} className="rounded-md" src={current} />
      </div>
      {urls.length > 1 ? (
        <div className="flex mt-4">
          {urls.map((url, index) => (
            <button
              key={url}
              type="button"
              aria-label={`Show image ${index + 1}`}
              aria-pressed={index === selected}
              onClick={() => setSelected(index)}
              className={`w-16 h-16 image-fit zoom-in mr-2 border-2 rounded-md overflow-hidden ${index === selected ? "border-primary" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="rounded-md" src={url} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
