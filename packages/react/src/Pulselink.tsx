// =============================================================================
// Pulselink Main Component
// =============================================================================

import { useEffect, useCallback, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePulselinkStore } from './store';
import { Panel } from './components/Panel';
import { ElementOverlay } from './components/ElementOverlay';
import { 
  getLayersAtPoint,
  getBreadcrumbs,
  findBestSelector,
} from '../../core/src/index';

export interface PulselinkProps {
  /** Initial mode: 'inspect' for visual editing, 'annotate' for comments */
  defaultMode?: 'inspect' | 'annotate';
  /** Whether panel is open by default */
  defaultOpen?: boolean;
  /** Custom panel position */
  panelPosition?: { x: number; y: number };
  /** Custom panel size */
  panelSize?: { width: number; height: number };
  /** Called when element is selected */
  onSelect?: (element: HTMLElement, selector: string) => void;
  /** Called when styles are modified */
  onStyleChange?: (element: HTMLElement, styles: Record<string, string>) => void;
}

export function Pulselink({
  defaultMode = 'inspect',
  defaultOpen = false,
  panelPosition,
  panelSize,
  onSelect,
  onStyleChange,
}: PulselinkProps) {
  const {
    isPanelOpen,
    selectedElement,
    hoveredElement,
    mode,
    togglePanel,
    selectElement,
    hoverElement,
    setLayers,
    setBreadcrumbs,
    modifiedStyles,
  } = usePulselinkStore();

  // Initialize
  useEffect(() => {
    if (defaultOpen) {
      togglePanel();
    }
  }, []);

  // Handle style changes
  useEffect(() => {
    if (selectedElement && Object.keys(modifiedStyles).length > 0) {
      onStyleChange?.(selectedElement, modifiedStyles);
    }
  }, [modifiedStyles, selectedElement, onStyleChange]);

  // Handle click on page elements
  const handleElementClick = useCallback((e: MouseEvent) => {
    if (!isPanelOpen) return;
    
    const target = e.target as HTMLElement;
    
    // Ignore clicks on Pulselink UI - check if target is inside pulselink
    const pulselinkRoot = document.querySelector('[data-pulselink]');
    if (pulselinkRoot && pulselinkRoot.contains(target)) {
      return;
    }
    
    // Don't prevent default in annotate mode to allow text selection
    if (mode === 'inspect') {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('[Pulselink] Click at:', e.clientX, e.clientY, 'Target:', target.tagName);
    
    // Get layers at click point
    const layers = getLayersAtPoint(e.clientX, e.clientY);
    console.log('[Pulselink] Layers found:', layers.length);
    
    if (layers.length === 0) {
      console.log('[Pulselink] No layers found');
      return;
    }
    
    setLayers(layers);
    
    // Select the topmost element
    const element = layers[0].element;
    console.log('[Pulselink] Selecting element:', element.tagName);
    selectElement(element);
    
    const selector = findBestSelector(element);
    onSelect?.(element, selector);
    
    // Update breadcrumbs
    const crumbs = getBreadcrumbs(element);
    setBreadcrumbs(crumbs);
  }, [isPanelOpen, mode, selectElement, setLayers, setBreadcrumbs, onSelect]);

  // Handle mouse move for hover preview
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanelOpen) return;
    
    const target = e.target as HTMLElement;
    if (target.closest('[data-pulselink]')) return;
    
    hoverElement(target as HTMLElement);
  }, [isPanelOpen, hoverElement]);

  // Setup event listeners
  useEffect(() => {
    if (!isPanelOpen) return;
    
    document.addEventListener('click', handleElementClick, true);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('click', handleElementClick, true);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isPanelOpen, handleElementClick, handleMouseMove]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && isPanelOpen) {
        togglePanel();
      }
      
      // V for visual mode
      if (e.key === 'v' && !e.metaKey && !e.ctrlKey) {
        usePulselinkStore.getState().setMode('inspect');
      }
      
      // A for annotate mode
      if (e.key === 'a' && !e.metaKey && !e.ctrlKey) {
        usePulselinkStore.getState().setMode('annotate');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPanelOpen, togglePanel]);

  return createPortal(
    <div data-pulselink style={{ display: 'contents' }}>
      {/* Toggle Button */}
      <ToggleButton onClick={togglePanel} isOpen={isPanelOpen} />
      
      {/* Element Overlay (hover highlight) */}
      {isPanelOpen && hoveredElement && hoveredElement !== selectedElement && (
        <ElementOverlay element={hoveredElement} type="hover" />
      )}
      
      {/* Selected Element Overlay */}
      {isPanelOpen && selectedElement && (
        <ElementOverlay element={selectedElement} type="selected" />
      )}
      
      {/* Main Panel */}
      {isPanelOpen && (
        <Panel 
          position={panelPosition}
          size={panelSize}
        />
      )}
    </div>,
    document.body
  );
}

// Toggle Button Component
function ToggleButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  const [position, setPosition] = useState({ x: window.innerWidth - 68, y: window.innerHeight - 68 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    hasDragged.current = false;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragged
    if (!hasDragged.current) {
      onClick();
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      hasDragged.current = true;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
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
  }, [isDragging]);

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        border: 'none',
        background: isOpen ? '#1a1a1a' : '#6155F5',
        color: '#fff',
        cursor: isDragging ? 'grabbing' : 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 999998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        userSelect: 'none',
      }}
      title={isOpen ? 'Close Pulselink' : 'Open Pulselink'}
    >
      {isOpen ? '✕' : '⚡'}
    </button>
  );
}

export default Pulselink;
