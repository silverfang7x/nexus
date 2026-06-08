'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GraphNode } from '@/types/nexus';
import { getAgentColor } from './GraphNode';

interface NodeDetailPanelProps {
  node: GraphNode | null;
  connectedNodes: GraphNode[];
  onClose: () => void;
}

export default function NodeDetailPanel({
  node,
  connectedNodes,
  onClose,
}: NodeDetailPanelProps) {
  if (!node) return null;

  const agentColor = getAgentColor(node.agentId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        bottom: '48px',
        left: '50%',
        width: 'min(480px, 90vw)',
        backgroundColor: 'var(--nx-bg-elevated)',
        border: '1px solid var(--nx-border-hover)',
        backdropFilter: 'blur(16px)',
        borderRadius: 0,
        padding: '16px 20px',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Row 1: Badge & Close Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          className="label-xs"
          style={{
            color: agentColor,
            border: `1px solid color-mix(in srgb, ${agentColor} 40%, transparent)`,
            background: `color-mix(in srgb, ${agentColor} 12%, transparent)`,
            padding: '2px 6px',
            fontSize: '9px',
            fontFamily: 'var(--nx-font-mono)',
          }}
        >
          {node.type.toUpperCase()}
        </span>
        <button
          onClick={onClose}
          aria-label="Close panel"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: 'var(--nx-font-mono)',
            fontSize: '12px',
            color: 'var(--nx-text-muted)',
            transition: 'color var(--nx-transition-fast)',
          }}
          className="hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Row 2: Title */}
      <h3
        style={{
          fontFamily: 'var(--nx-font-display)',
          fontWeight: 700,
          fontSize: '16px',
          color: '#ffffff',
          margin: '8px 0',
          letterSpacing: '0.02em',
        }}
      >
        {node.label}
      </h3>

      {/* Row 3: Content */}
      <p
        style={{
          fontFamily: 'var(--nx-font-mono)',
          fontSize: '12px',
          lineHeight: 1.7,
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '12px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {node.content}
      </p>

      {/* Row 4: Connected Nodes */}
      {connectedNodes.length > 0 && (
        <div style={{ marginBottom: node.confidence !== undefined ? '12px' : 0 }}>
          <p
            className="label-xs"
            style={{
              color: 'var(--nx-text-muted)',
              marginBottom: '6px',
            }}
          >
            CONNECTED NODES
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {connectedNodes.map((conn) => {
              const connColor = getAgentColor(conn.agentId);
              const truncatedLabel =
                conn.label.length > 14
                  ? conn.label.substring(0, 11) + '...'
                  : conn.label;
              return (
                <span
                  key={conn.id}
                  style={{
                    display: 'inline-block',
                    backgroundColor: `color-mix(in srgb, ${connColor} 15%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${connColor} 40%, transparent)`,
                    padding: '2px 8px',
                    fontFamily: 'var(--nx-font-mono)',
                    fontSize: '10px',
                    color: connColor,
                  }}
                >
                  {truncatedLabel}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 5: Confidence Bar */}
      {node.confidence !== undefined && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
            }}
          >
            <span className="label-xs" style={{ color: 'var(--nx-text-muted)' }}>
              CONFIDENCE
            </span>
            <span className="label-xs" style={{ color: agentColor }}>
              {Math.round(node.confidence * 100)}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${node.confidence * 100}%`,
                height: '100%',
                backgroundColor: agentColor,
              }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
