'use client';

import React from 'react';
import { AgentId } from '@/types/nexus';

interface LoadingOrbitProps {
  activeAgents: AgentId[];
}

export default function LoadingOrbit({ activeAgents }: LoadingOrbitProps) {
  let activeText = 'INITIALIZING SWARM...';
  if (activeAgents.length > 0) {
    const lastActive = activeAgents[activeAgents.length - 1];
    switch (lastActive) {
      case 'advocate':
        activeText = 'ADVOCATE THINKING...';
        break;
      case 'challenger':
        activeText = 'CHALLENGER RESPONDING...';
        break;
      case 'factchecker':
        activeText = 'FACTCHECKER VERIFYING...';
        break;
      case 'codeanalyst':
        activeText = 'CODEANALYST ANALYZING...';
        break;
      case 'synthesizer':
        activeText = 'SYNTHESIZER SUMMARIZING...';
        break;
      case 'orchestrator':
        activeText = 'ORCHESTRATOR PREPARING...';
        break;
      default:
        activeText = `${(lastActive as string).toUpperCase()} ACTIVE...`;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center pointer-events-none">
      <div className="relative w-[110px] h-[110px] flex items-center justify-center mb-6">
        <style>{`
          .orbit-center-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background-color: var(--nx-orbit-color, #c5c0ff);
            box-shadow: 0 0 8px var(--nx-orbit-color, #c5c0ff);
            position: absolute;
            z-index: 10;
          }
          .orbit-inner-container {
            position: absolute;
            width: 64px;
            height: 64px;
            animation: rotate-clockwise 1.4s linear infinite;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .orbit-outer-container {
            position: absolute;
            width: 104px;
            height: 104px;
            animation: rotate-counter-clockwise 2.2s linear infinite;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          @keyframes rotate-clockwise {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes rotate-counter-clockwise {
            from { transform: rotate(0deg); }
            to { transform: rotate(-360deg); }
          }
        `}</style>
        
        {/* Center dot */}
        <div className="orbit-center-dot" />
        
        {/* Inner orbit (radius 28px) */}
        <div className="orbit-inner-container">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="4" r="2.5" fill="var(--nx-orbit-color, #c5c0ff)" opacity="0.4" />
            <circle cx="56.25" cy="46" r="2.5" fill="var(--nx-orbit-color, #c5c0ff)" opacity="0.4" />
            <circle cx="7.75" cy="46" r="2.5" fill="var(--nx-orbit-color, #c5c0ff)" opacity="0.4" />
          </svg>
        </div>

        {/* Outer orbit (radius 48px) */}
        <div className="orbit-outer-container">
          <svg width="104" height="104" viewBox="0 0 104 104">
            <circle cx="52" cy="4" r="2.5" fill="var(--nx-orbit-color, #c5c0ff)" opacity="0.2" />
            <circle cx="93.57" cy="76" r="2.5" fill="var(--nx-orbit-color, #c5c0ff)" opacity="0.2" />
            <circle cx="10.43" cy="76" r="2.5" fill="var(--nx-orbit-color, #c5c0ff)" opacity="0.2" />
          </svg>
        </div>
      </div>
      
      {/* Agent status text in DM Mono */}
      <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest select-none animate-pulse">
        {activeText}
      </span>
    </div>
  );
}
