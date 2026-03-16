// =============================================================================
// Pulselink React - State Management (Zustand)
// =============================================================================

import { create } from 'zustand';
import { 
  getComputedStyles, 
  getEditableProps,
  applyStyle,
  applyStyles,
  removeStyle,
  getAnimations,
} from '../../core/src/index';
import type { 
  ElementInfo, 
  LayerInfo, 
  ComputedStyles, 
  ComponentProp,
  Annotation,
  AnimationInfo,
} from '../../core/src/types';

interface PulselinkState {
  // Panel
  isPanelOpen: boolean;
  panelPosition: { x: number; y: number };
  panelSize: { width: number; height: number };
  isPinned: boolean;
  
  // Selection
  selectedElement: HTMLElement | null;
  hoveredElement: HTMLElement | null;
  layers: LayerInfo[];
  breadcrumbs: ElementInfo[];
  
  // Editor
  activeTab: 'styles' | 'props' | 'animation';
  computedStyles: ComputedStyles | null;
  componentProps: ComponentProp[];
  animations: AnimationInfo[];
  originalStyles: Record<string, string>;
  modifiedStyles: Record<string, string>;
  isDirty: boolean;
  
  // Mode
  mode: 'inspect' | 'annotate';
  
  // Annotations
  annotations: Annotation[];
  
  // Actions
  togglePanel: () => void;
  setPanelPosition: (pos: { x: number; y: number }) => void;
  setPanelSize: (size: { width: number; height: number }) => void;
  setPinned: (pinned: boolean) => void;
  
  selectElement: (element: HTMLElement | null) => void;
  hoverElement: (element: HTMLElement | null) => void;
  setLayers: (layers: LayerInfo[]) => void;
  setBreadcrumbs: (breadcrumbs: ElementInfo[]) => void;
  
  setActiveTab: (tab: 'styles' | 'props' | 'animation') => void;
  updateStyle: (property: string, value: string) => void;
  resetStyles: () => void;
  applyStyles: () => void;
  
  setMode: (mode: 'inspect' | 'annotate') => void;
  
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'timestamp'>) => void;
  removeAnnotation: (id: string) => void;
  clearAnnotations: () => void;
}

export const usePulselinkStore = create<PulselinkState>((set, get) => ({
  // Panel
  isPanelOpen: false,
  panelPosition: { x: window.innerWidth - 340, y: 20 },
  panelSize: { width: 320, height: 600 },
  isPinned: false,
  
  // Selection
  selectedElement: null,
  hoveredElement: null,
  layers: [],
  breadcrumbs: [],
  
  // Editor
  activeTab: 'styles',
  computedStyles: null,
  componentProps: [],
  animations: [],
  originalStyles: {},
  modifiedStyles: {},
  isDirty: false,
  
  // Mode
  mode: 'inspect',
  
  // Annotations
  annotations: [],
  
  // Actions
  togglePanel: () => set(state => ({ isPanelOpen: !state.isPanelOpen })),
  
  setPanelPosition: (pos) => set({ panelPosition: pos }),
  
  setPanelSize: (size) => set({ panelSize: size }),
  
  setPinned: (pinned) => set({ isPinned: pinned }),
  
  selectElement: (element) => {
    if (!element) {
      set({
        selectedElement: null,
        computedStyles: null,
        componentProps: [],
        animations: [],
        originalStyles: {},
        modifiedStyles: {},
        isDirty: false,
      });
      return;
    }
    
    const styles = getComputedStyles(element);
    const props = getEditableProps(element);
    const animations = getAnimations(element);
    
    // Get inline styles as original
    const originalStyles: Record<string, string> = {};
    for (let i = 0; i < element.style.length; i++) {
      const prop = element.style[i];
      originalStyles[prop] = element.style.getPropertyValue(prop);
    }
    
    set({
      selectedElement: element,
      computedStyles: styles,
      componentProps: props,
      animations,
      originalStyles,
      modifiedStyles: { ...originalStyles },
      isDirty: false,
    });
  },
  
  hoverElement: (element) => set({ hoveredElement: element }),
  
  setLayers: (layers) => set({ layers }),
  
  setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  updateStyle: (property, value) => {
    const { selectedElement, modifiedStyles } = get();
    if (!selectedElement) return;
    
    // Apply to element immediately
    applyStyle(selectedElement, property, value);
    
    set({
      modifiedStyles: { ...modifiedStyles, [property]: value },
      isDirty: true,
    });
  },
  
  resetStyles: () => {
    const { selectedElement, originalStyles } = get();
    if (!selectedElement) return;
    
    // Reset to original styles
    // Remove all modified styles
    for (const prop of Object.keys(originalStyles)) {
      removeStyle(selectedElement, prop);
    }
    
    // Apply original styles
    applyStyles(selectedElement, originalStyles);
    
    set({
      modifiedStyles: { ...originalStyles },
      isDirty: false,
    });
  },
  
  applyStyles: () => {
    const { selectedElement, modifiedStyles } = get();
    if (!selectedElement) return;
    
    applyStyles(selectedElement, modifiedStyles);
    
    set({
      originalStyles: { ...modifiedStyles },
      isDirty: false,
    });
  },
  
  setMode: (mode) => set({ mode }),
  
  addAnnotation: (annotation) => {
    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    set(state => ({
      annotations: [...state.annotations, { ...annotation, id, timestamp: Date.now() }],
    }));
  },
  
  removeAnnotation: (id) => {
    set(state => ({
      annotations: state.annotations.filter(a => a.id !== id),
    }));
  },
  
  clearAnnotations: () => set({ annotations: [] }),
}));
