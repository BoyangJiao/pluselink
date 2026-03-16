// =============================================================================
// Style Editor - 完全独立实现
// =============================================================================

import type { ComputedStyles, StyleProperty } from '../types';

/**
 * CSS property categories
 */
const PROPERTY_CATEGORIES: Record<string, StyleProperty['category']> = {
  // Layout
  display: 'layout',
  position: 'layout',
  width: 'layout',
  height: 'layout',
  minWidth: 'layout',
  maxWidth: 'layout',
  minHeight: 'layout',
  maxHeight: 'layout',
  padding: 'layout',
  paddingTop: 'layout',
  paddingRight: 'layout',
  paddingBottom: 'layout',
  paddingLeft: 'layout',
  margin: 'layout',
  marginTop: 'layout',
  marginRight: 'layout',
  marginBottom: 'layout',
  marginLeft: 'layout',
  gap: 'layout',
  flex: 'layout',
  flexDirection: 'layout',
  justifyContent: 'layout',
  alignItems: 'layout',
  gridTemplateColumns: 'layout',
  gridTemplateRows: 'layout',

  // Appearance
  backgroundColor: 'appearance',
  color: 'appearance',
  border: 'appearance',
  borderTop: 'appearance',
  borderRight: 'appearance',
  borderBottom: 'appearance',
  borderLeft: 'appearance',
  borderRadius: 'appearance',
  borderTopLeftRadius: 'appearance',
  borderTopRightRadius: 'appearance',
  borderBottomLeftRadius: 'appearance',
  borderBottomRightRadius: 'appearance',
  boxShadow: 'appearance',
  opacity: 'appearance',
  background: 'appearance',
  backgroundImage: 'appearance',

  // Typography
  fontFamily: 'typography',
  fontSize: 'typography',
  fontWeight: 'typography',
  lineHeight: 'typography',
  letterSpacing: 'typography',
  textAlign: 'typography',
  textDecoration: 'typography',
  textTransform: 'typography',
  whiteSpace: 'typography',
  wordBreak: 'typography',

  // Effects
  transform: 'effects',
  transition: 'effects',
  animation: 'effects',
  filter: 'effects',
  backdropFilter: 'effects',
  overflow: 'effects',
  visibility: 'effects',
  cursor: 'effects',
};

/**
 * Properties to extract from computed styles
 */
const EXTRACT_PROPERTIES = [
  'display', 'position', 'width', 'height', 'padding', 'margin', 'gap',
  'backgroundColor', 'color', 'border', 'borderRadius', 'boxShadow', 'opacity',
  'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'textAlign',
  'transform', 'transition', 'overflow',
];

/**
 * Get computed styles for an element
 */
export function getComputedStyles(element: HTMLElement): ComputedStyles {
  const computed = window.getComputedStyle(element);
  const styles: ComputedStyles = {};

  for (const prop of EXTRACT_PROPERTIES) {
    const value = computed.getPropertyValue(prop.replace(/([A-Z])/g, '-$1').toLowerCase());
    if (value && value !== 'none' && value !== 'auto' && value !== 'normal') {
      styles[prop as keyof ComputedStyles] = value;
    }
  }

  return styles;
}

/**
 * Get editable style properties with categories
 */
export function getStyleProperties(element: HTMLElement): StyleProperty[] {
  const computed = window.getComputedStyle(element);
  const properties: StyleProperty[] = [];

  for (const [prop, category] of Object.entries(PROPERTY_CATEGORIES)) {
    const cssName = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
    const value = computed.getPropertyValue(cssName);
    
    if (value) {
      properties.push({
        name: prop,
        value,
        category,
        editable: true,
      });
    }
  }

  return properties;
}

/**
 * Apply inline style to element
 */
export function applyStyle(element: HTMLElement, property: string, value: string): void {
  element.style.setProperty(
    property.replace(/([A-Z])/g, '-$1').toLowerCase(),
    value
  );
}

/**
 * Apply multiple styles to element
 */
export function applyStyles(element: HTMLElement, styles: Record<string, string>): void {
  for (const [prop, value] of Object.entries(styles)) {
    applyStyle(element, prop, value);
  }
}

/**
 * Remove inline style from element
 */
export function removeStyle(element: HTMLElement, property: string): void {
  element.style.removeProperty(property.replace(/([A-Z])/g, '-$1').toLowerCase());
}

/**
 * Get inline styles as object
 */
export function getInlineStyles(element: HTMLElement): Record<string, string> {
  const styles: Record<string, string> = {};
  
  for (let i = 0; i < element.style.length; i++) {
    const prop = element.style[i];
    styles[prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = 
      element.style.getPropertyValue(prop);
  }

  return styles;
}

/**
 * Parse CSS value into parts (number + unit)
 */
export function parseCSSValue(value: string): { number: number; unit: string } | null {
  // Handle special values
  if (value === 'auto') {
    return { number: 0, unit: 'auto' };
  }
  
  const match = value.match(/^(-?[\d.]+)(px|rem|em|%|vh|vw|s|ms)?$/);
  if (!match) return null;
  
  return {
    number: parseFloat(match[1]),
    unit: match[2] || '',
  };
}

/**
 * Convert value to different unit
 */
export function convertUnit(value: string, targetUnit: string, element: HTMLElement): string {
  const parsed = parseCSSValue(value);
  if (!parsed) return value;

  // If same unit, return as-is
  if (parsed.unit === targetUnit) return value;

  // Convert to px first
  let pxValue = parsed.number;
  
  if (parsed.unit === 'rem') {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    pxValue = parsed.number * rootFontSize;
  } else if (parsed.unit === 'em') {
    const parentFontSize = parseFloat(getComputedStyle(element.parentElement || element).fontSize);
    pxValue = parsed.number * parentFontSize;
  } else if (parsed.unit === '%') {
    // For percentage, we'd need context - skip for now
    return value;
  }

  // Convert from px to target
  if (targetUnit === 'px') {
    return `${pxValue}px`;
  } else if (targetUnit === 'rem') {
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return `${pxValue / rootFontSize}rem`;
  } else if (targetUnit === 'em') {
    const parentFontSize = parseFloat(getComputedStyle(element.parentElement || element).fontSize);
    return `${pxValue / parentFontSize}em`;
  }

  return value;
}

/**
 * Generate CSS code from styles
 */
export function generateCSS(styles: Record<string, string>, selector: string): string {
  const lines = [`${selector} {`];
  
  for (const [prop, value] of Object.entries(styles)) {
    const cssName = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
    lines.push(`  ${cssName}: ${value};`);
  }
  
  lines.push('}');
  return lines.join('\n');
}

/**
 * Extract design tokens from styles
 */
export function extractDesignTokens(styles: ComputedStyles): Record<string, string> {
  const tokens: Record<string, string> = {};

  // Color tokens
  if (styles.backgroundColor) {
    tokens['--color-background'] = styles.backgroundColor;
  }
  if (styles.color) {
    tokens['--color-text'] = styles.color;
  }

  // Typography tokens
  if (styles.fontSize) {
    tokens['--font-size'] = styles.fontSize;
  }
  if (styles.fontFamily) {
    tokens['--font-family'] = styles.fontFamily;
  }
  if (styles.fontWeight) {
    tokens['--font-weight'] = styles.fontWeight;
  }

  // Spacing tokens
  if (styles.padding) {
    tokens['--spacing'] = styles.padding;
  }
  if (styles.gap) {
    tokens['--gap'] = styles.gap;
  }

  // Border tokens
  if (styles.borderRadius) {
    tokens['--radius'] = styles.borderRadius;
  }

  return tokens;
}
