'use client';

import React from 'react';

export function CanvasLoader({ width, height }: { width: number; height: number }) {
  return (
    <div
      data-width={width}
      data-height={height}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }}
    >
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        {[
          { color: 'var(--nx-advocate)', duration: '2s', radius: 35, delay: '0s' },
          { color: 'var(--nx-synthesizer)', duration: '2.8s', radius: 35, delay: '-0.9s' },
          { color: 'var(--nx-factchecker)', duration: '3.5s', radius: 35, delay: '-1.8s' },
        ].map((dot, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: dot.color,
              opacity: 0.75,
              animation: `nx-orbit ${dot.duration} linear ${dot.delay} infinite`,
              transformOrigin: `-${dot.radius - 3.5}px 3.5px`,
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            animation: 'nx-dot-pulse 1.8s ease infinite',
          }}
        />
      </div>

      <p
        style={{
          position: 'absolute',
          top: 'calc(50% + 60px)',
          fontFamily: 'var(--nx-font-mono)',
          fontSize: 10,
          color: 'var(--nx-text-muted)',
          letterSpacing: '0.1em',
          animation: 'nx-blink 1.5s ease infinite',
        }}
      >
        AGENTS INITIALISING
      </p>
    </div>
  );
}
