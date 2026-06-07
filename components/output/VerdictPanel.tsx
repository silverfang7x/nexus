import React from 'react';

export interface VerdictPanelProps {
  verdict?: string;
}

export default function VerdictPanel({ verdict }: VerdictPanelProps) {
  return (
    <div 
      className="w-full h-full flex flex-col p-4 overflow-y-auto"
      style={{
        backgroundColor: 'var(--nx-bg)',
        fontFamily: 'var(--nx-font-mono), monospace'
      }}
    >
      <div 
        className="uppercase select-none text-[9px] tracking-widest mb-4"
        style={{
          color: 'rgba(255, 255, 255, 0.3)'
        }}
      >
        Output
      </div>

      {verdict ? (
        <div 
          className="text-xs leading-relaxed whitespace-pre-wrap"
          style={{
            fontFamily: 'var(--nx-font-mono), monospace',
            color: 'rgba(255, 255, 255, 0.85)'
          }}
        >
          {verdict}
        </div>
      ) : (
        <div 
          className="text-xs italic select-none mt-4 text-center"
          style={{
            color: 'rgba(255, 255, 255, 0.2)'
          }}
        >
          Waiting for swarm execution output...
        </div>
      )}
    </div>
  );
}