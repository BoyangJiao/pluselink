// =============================================================================
// Props Editor Component
// =============================================================================

import { usePulselinkStore } from '../store';
import type { ComponentProp } from '../../../core/src/types';

export function PropsEditor() {
  const { selectedElement, componentProps } = usePulselinkStore();

  if (!selectedElement) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <p style={{ fontSize: '13px' }}>No element selected</p>
      </div>
    );
  }

  if (componentProps.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <p style={{ fontSize: '13px' }}>No editable props detected</p>
        <p style={{ fontSize: '11px', marginTop: '8px' }}>
          This may not be a React component, or props are not accessible
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px' }}>
      <h4 style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '12px',
      }}>
        Component Props
      </h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {componentProps.map(prop => (
          <PropRow key={prop.name} prop={prop} />
        ))}
      </div>
    </div>
  );
}

// Prop Row Component
function PropRow({ prop }: { prop: ComponentProp }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    }}>
      <label style={{
        fontSize: '12px',
        color: 'rgba(255,255,255,0.7)',
        minWidth: '80px',
      }}>
        {prop.name}
        <span style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.3)',
          marginLeft: '4px',
        }}>
          ({prop.type})
        </span>
      </label>
      
      <div style={{ flex: 1 }}>
        <PropInput prop={prop} />
      </div>
    </div>
  );
}

// Prop Input Component
function PropInput({ prop }: { prop: ComponentProp }) {
  const { type, value, options } = prop;

  switch (type) {
    case 'boolean':
      return (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}>
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={() => {}}
            style={{ accentColor: '#6155F5' }}
          />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            {value ? 'true' : 'false'}
          </span>
        </label>
      );

    case 'enum':
      return (
        <select
          value={String(value)}
          onChange={() => {}}
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
          }}
        >
          {options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'number':
      return (
        <input
          type="number"
          value={value as number}
          onChange={() => {}}
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        />
      );

    case 'object':
      return (
        <div style={{
          padding: '6px 10px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.5)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {JSON.stringify(value)}
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={String(value || '')}
          onChange={() => {}}
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        />
      );
  }
}
