// =============================================================================
// Inspector Component
// =============================================================================

import { usePulselinkStore } from '../store';
import { findBestSelector } from '../../../core/src/index';

export function Inspector() {
  const { selectedElement, breadcrumbs, layers, selectElement } = usePulselinkStore();

  if (!selectedElement) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <p style={{ fontSize: '13px' }}>Click an element to inspect</p>
        <p style={{ fontSize: '11px', marginTop: '8px' }}>
          or use the DOM tree below
        </p>
      </div>
    );
  }

  const selector = findBestSelector(selectedElement);

  return (
    <div style={{
      padding: '12px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      {/* Breadcrumbs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginBottom: '8px',
      }}>
        {breadcrumbs.map((crumb, index) => (
          <span key={index} style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            display: 'flex',
            alignItems: 'center',
          }}>
            {index > 0 && <span style={{ margin: '0 4px' }}>›</span>}
            <span
              onClick={() => selectElement(crumb.element)}
              style={{
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '4px',
                background: crumb.element === selectedElement 
                  ? 'rgba(97, 85, 245, 0.2)' 
                  : 'transparent',
              }}
            >
              {crumb.tagName}
              {crumb.id && `#${crumb.id}`}
            </span>
          </span>
        ))}
      </div>

      {/* Selector */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        padding: '8px 12px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#6155F5',
        wordBreak: 'break-all',
      }}>
        {selector}
      </div>

      {/* Layers Dropdown (if multiple layers) */}
      {layers.length > 1 && (
        <div style={{ marginTop: '8px' }}>
          <select
            onChange={(e) => {
              const index = parseInt(e.target.value);
              selectElement(layers[index].element);
            }}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
            }}
          >
            {layers.map((layer, index) => (
              <option key={index} value={index}>
                #{index + 1} {layer.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
