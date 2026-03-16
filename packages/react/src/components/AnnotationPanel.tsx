// =============================================================================
// Annotation Panel Component
// =============================================================================

import { useState } from 'react';
import { usePulselinkStore } from '../store';
import { findBestSelector } from '../../../core/src/index';

export function AnnotationPanel() {
  const { selectedElement, annotations, addAnnotation, removeAnnotation } = usePulselinkStore();
  const [comment, setComment] = useState('');

  if (!selectedElement) {
    return null;
  }

  const handleAddAnnotation = () => {
    if (!comment.trim()) return;

    const selector = findBestSelector(selectedElement);
    const rect = selectedElement.getBoundingClientRect();
    
    addAnnotation({
      elementPath: selector,
      selector,
      comment: comment.trim(),
      x: rect.left,
      y: rect.top,
    });
    
    setComment('');
  };

  const elementAnnotations = annotations.filter(
    a => a.selector === findBestSelector(selectedElement)
  );

  return (
    <div style={{
      padding: '12px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.02)',
    }}>
      <h4 style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '10px',
      }}>
        Add Note
      </h4>
      
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Describe the issue or feedback..."
        style={{
          width: '100%',
          minHeight: '60px',
          padding: '8px 10px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '6px',
          color: '#fff',
          fontSize: '12px',
          resize: 'vertical',
          fontFamily: 'inherit',
        }}
      />
      
      <button
        onClick={handleAddAnnotation}
        disabled={!comment.trim()}
        style={{
          marginTop: '8px',
          width: '100%',
          padding: '8px',
          background: comment.trim() ? '#6155F5' : 'rgba(255,255,255,0.06)',
          border: 'none',
          borderRadius: '6px',
          color: comment.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
          cursor: comment.trim() ? 'pointer' : 'not-allowed',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        Add Annotation
      </button>

      {/* Existing annotations for this element */}
      {elementAnnotations.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <h5 style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}>
            Notes on this element
          </h5>
          {elementAnnotations.map(ann => (
            <div
              key={ann.id}
              style={{
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '6px',
                marginBottom: '6px',
              }}
            >
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.8)',
                margin: 0,
              }}>
                {ann.comment}
              </p>
              <button
                onClick={() => removeAnnotation(ann.id)}
                style={{
                  marginTop: '6px',
                  padding: '2px 8px',
                  background: 'transparent',
                  border: '1px solid rgba(255,100,100,0.3)',
                  borderRadius: '4px',
                  color: 'rgba(255,100,100,0.7)',
                  cursor: 'pointer',
                  fontSize: '10px',
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
