// =============================================================================
// Pulselink Core - 完全独立的实现
// =============================================================================

// Types
export type {
  ElementInfo,
  LayerInfo,
  ComputedStyles,
  StyleProperty,
  ComponentProp,
  AnimationInfo,
  Annotation,
  InspectorState,
  EditorState,
  PanelState,
} from './types';

// Inspector
export {
  getElementsAtPoint,
  getElementPath,
  getElementName,
  buildElementInfo,
  getLayersAtPoint,
  getBreadcrumbs,
  findBestSelector,
} from './inspector/element-selector';

// Editor
export {
  getComputedStyles,
  getStyleProperties,
  applyStyle,
  applyStyles,
  removeStyle,
  getInlineStyles,
  parseCSSValue,
  convertUnit,
  generateCSS,
  extractDesignTokens,
} from './editor/style-editor';

export {
  isReactComponent,
  getComponentInfo,
  getEditableProps,
  detectComponentLibrary,
} from './editor/props-detector';

// Animation
export {
  getCSSAnimations,
  getCSSTransitions,
  getFramerMotionAnimations,
  getAnimations,
  hasAnimations,
  pauseAnimations,
  resumeAnimations,
  setAnimationDuration,
  setAnimationDelay,
  setAnimationTimingFunction,
  setTransition,
} from './editor/animation-detector';
