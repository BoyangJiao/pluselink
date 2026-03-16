// =============================================================================
// Floating Panel Component
// =============================================================================

import { useRef, useCallback, useState, useEffect } from 'react';
import { usePulselinkStore } from '../store';
import { Inspector } from './Inspector';
import { StyleEditor, StyleEditorErrorBoundary } from './StyleEditor';
import { PropsEditor } from './PropsEditor';
import { AnimationEditor } from './AnimationEditor';
import { AnnotationPanel } from './AnnotationPanel';

export function Panel(_props: { 
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}) {
  const {
    panelPosition,
    panelSize,
    activeTab,
    mode,
    isPinned,
    setPanelPosition,
    setPanelSize,
    setPinned,
    setActiveTab,
    setMode,
  } = usePulselinkStore();

  const panelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Handle drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-panel-header-controls]')) return;
    
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - panelPosition.x,
      y: e.clientY - panelPosition.y,
    };
  }, [panelPosition]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPanelPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setPanelPosition]);

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(280, e.clientX - panelPosition.x);
      const newHeight = Math.max(400, e.clientY - panelPosition.y);
      setPanelSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, panelPosition, setPanelSize]);

  return (
    <div
      ref={panelRef}
      data-pulselink-panel
      style={{
        position: 'fixed',
        left: panelPosition.x,
        top: panelPosition.y,
        width: panelSize.width,
        height: panelSize.height,
        background: '#1a1a1a',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#fff',
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          cursor: isDragging ? 'grabbing' : 'grab',
          background: 'rgba(255,255,255,0.02)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>⚡ Pulselink</span>
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
        <div data-panel-header-controls style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setPinned(!isPinned)}
            style={{
              padding: '4px 8px',
              background: isPinned ? 'rgba(97, 85, 245, 0.3)' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: isPinned ? '#fff' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            📌
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Inspector />
        
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          {(['styles', 'props', 'animation'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '10px',
                background: activeTab === tab ? 'rgba(97, 85, 245, 0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #6155F5' : '2px solid transparent',
                color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'styles' && (
            <StyleEditorErrorBoundary>
              <StyleEditor />
            </StyleEditorErrorBoundary>
          )}
          {activeTab === 'props' && <PropsEditor />}
          {activeTab === 'animation' && <AnimationEditor />}
        </div>

        {/* Annotation Mode */}
        {mode === 'annotate' && <AnnotationPanel />}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: '16px',
          height: '16px',
          cursor: 'nwse-resize',
        }}
      />
    </div>
  );
}

// Mode Toggle Component
function ModeToggle({ mode, onChange }: { mode: string; onChange: (m: 'inspect' | 'annotate') => void }) {
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '6px',
      padding: '2px',
    }}>
      {(['inspect', 'annotate'] as const).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            padding: '4px 10px',
            background: mode === m ? 'rgba(97, 85, 245, 0.3)' : 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: mode === m ? '#fff' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 500,
            textTransform: 'capitalize',
          }}
        >
          {m === 'inspect' ? '🔧 Edit' : '💬 Note'}
        </button>
      ))}
    </div>
  );
}
