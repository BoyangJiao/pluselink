// =============================================================================
// Element Overlay Component
// =============================================================================

import { useEffect, useRef } from 'react';

interface ElementOverlayProps {
  element: HTMLElement;
  type: 'hover' | 'selected';
}

export function ElementOverlay({ element, type }: ElementOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (!overlayRef.current || !element) return;
      
      const rect = element.getBoundingClientRect();
      overlayRef.current.style.left = `${rect.left}px`;
      overlayRef.current.style.top = `${rect.top}px`;
      overlayRef.current.style.width = `${rect.width}px`;
      overlayRef.current.style.height = `${rect.height}px`;
    };

    updatePosition();

    // Update on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [element]);

  const isHover = type === 'hover';

  return (
    <div
      ref={overlayRef}
      data-pulselink-overlay
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 999997,
        border: isHover ? '1px dashed rgba(97, 85, 245, 0.6)' : '2px solid #6155F5',
        borderRadius: '4px',
        background: isHover 
          ? 'rgba(97, 85, 245, 0.05)' 
          : 'rgba(97, 85, 245, 0.1)',
        transition: 'all 0.1s ease',
      }}
    />
  );
}
