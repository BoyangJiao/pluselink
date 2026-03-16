// =============================================================================
// Pulselink Core Types
// =============================================================================

export interface ElementInfo {
  element: HTMLElement;
  tagName: string;
  id?: string;
  className?: string;
  path: string;
  name: string;
  rect: DOMRect;
  depth: number;
}

export interface LayerInfo extends ElementInfo {
  isVisible: boolean;
  zIndex: number;
}

export interface ComputedStyles {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: string;
  padding?: string;
  margin?: string;
  border?: string;
  borderRadius?: string;
  width?: string;
  height?: string;
  display?: string;
  position?: string;
  [key: string]: string | undefined;
}

export interface StyleProperty {
  name: string;
  value: string;
  category: 'layout' | 'appearance' | 'typography' | 'effects';
  editable: boolean;
}

export interface ComponentProp {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'object';
  value: unknown;
  defaultValue?: unknown;
  options?: string[];
  description?: string;
}

export interface AnimationInfo {
  type: 'css-animation' | 'css-transition' | 'waapi' | 'framer-motion' | 'gsap';
  name: string;
  duration: number;
  delay: number;
  easing: string;
  iterations: number | 'infinite';
  isPaused?: boolean;
}

export interface Annotation {
  id: string;
  elementPath: string;
  selector: string;
  comment: string;
  timestamp: number;
  x: number;
  y: number;
  visualEdits?: {
    originalStyles: Record<string, string>;
    modifiedStyles: Record<string, string>;
  };
}

export interface InspectorState {
  selectedElement: HTMLElement | null;
  hoveredElement: HTMLElement | null;
  layers: LayerInfo[];
  breadcrumbs: ElementInfo[];
  mode: 'inspect' | 'annotate';
}

export interface EditorState {
  activeTab: 'styles' | 'props' | 'animation';
  styles: ComputedStyles;
  props: ComponentProp[];
  animations: AnimationInfo[];
  isDirty: boolean;
}

export interface PanelState {
  isOpen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isPinned: boolean;
}
