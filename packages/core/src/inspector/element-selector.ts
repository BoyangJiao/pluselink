// =============================================================================
// Element Selector - 完全独立实现
// =============================================================================

import type { ElementInfo, LayerInfo } from '../types';

/**
 * Get all elements at a point, from top to bottom
 * Completely rewritten, different from original implementation
 */
export function getElementsAtPoint(x: number, y: number): HTMLElement[] {
  const elements = document.elementsFromPoint(x, y) as HTMLElement[];
  return elements.filter(el => !isPulselinkElement(el));
}

/**
 * Check if element belongs to Pulselink UI
 */
function isPulselinkElement(element: Element): boolean {
  // Check if element is inside Pulselink UI
  const pulselinkRoot = document.querySelector('[data-pulselink]');
  if (pulselinkRoot && pulselinkRoot.contains(element)) {
    return true;
  }
  
  // Check data attributes
  const el = element as HTMLElement;
  if (el.dataset && (el.dataset.pulselink || el.dataset.pulselinkPanel || el.dataset.pulselinkOverlay)) {
    return true;
  }
  
  return false;
}

/**
 * Get element path as array of selectors
 * Different approach from original: returns structured path
 */
export function getElementPath(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;
  const maxDepth = 6;

  while (current && depth < maxDepth) {
    const tag = current.tagName.toLowerCase();
    
    if (tag === 'html' || tag === 'body') {
      parts.unshift(tag);
      break;
    }

    let selector = tag;
    
    if (current.id) {
      selector = `#${current.id}`;
    } else if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .split(/\s+/)
        .filter(c => c.length > 2 && !c.match(/^[a-z0-9]{5,}$/)) // Filter hash classes
        .slice(0, 2);
      if (classes.length > 0) {
        selector = `${tag}.${classes.join('.')}`;
      }
    }

    // Add nth-child for siblings
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
    depth++;
  }

  return parts.join(' > ');
}

/**
 * Get human-readable element name
 */
export function getElementName(element: HTMLElement): string {
  // Check for data attribute
  if (element.dataset.name) {
    return element.dataset.name;
  }

  const tag = element.tagName.toLowerCase();

  // Interactive elements
  if (tag === 'button') {
    const text = element.textContent?.trim().slice(0, 20);
    return text ? `button "${text}"` : 'button';
  }
  
  if (tag === 'a') {
    const text = element.textContent?.trim().slice(0, 20);
    return text ? `link "${text}"` : 'link';
  }
  
  if (tag === 'input') {
    const type = element.getAttribute('type') || 'text';
    const placeholder = element.getAttribute('placeholder');
    return placeholder ? `${type} input "${placeholder}"` : `${type} input`;
  }

  // Headings
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    const text = element.textContent?.trim().slice(0, 30);
    return text ? `${tag} "${text}"` : tag;
  }

  // Text elements
  if (tag === 'p') {
    const text = element.textContent?.trim().slice(0, 40);
    return text ? `paragraph "${text}${text.length >= 40 ? '...' : ''}"` : 'paragraph';
  }

  // Images
  if (tag === 'img') {
    const alt = element.getAttribute('alt');
    return alt ? `image "${alt}"` : 'image';
  }

  // Containers with meaningful class
  if (element.className && typeof element.className === 'string') {
    const meaningful = element.className
      .split(/\s+/)
      .find(c => c.length > 3 && !c.match(/^[a-z0-9]{5,}$/));
    if (meaningful) {
      return `${tag} .${meaningful}`;
    }
  }

  return tag;
}

/**
 * Build ElementInfo from HTMLElement
 */
export function buildElementInfo(element: HTMLElement, depth = 0): ElementInfo {
  return {
    element,
    tagName: element.tagName.toLowerCase(),
    id: element.id || undefined,
    className: typeof element.className === 'string' ? element.className : undefined,
    path: getElementPath(element),
    name: getElementName(element),
    rect: element.getBoundingClientRect(),
    depth,
  };
}

/**
 * Get layer information for all elements at point
 */
export function getLayersAtPoint(x: number, y: number): LayerInfo[] {
  const elements = getElementsAtPoint(x, y);
  
  return elements.map((el, index) => {
    const style = window.getComputedStyle(el);
    const zIndex = parseInt(style.zIndex) || 0;
    
    return {
      ...buildElementInfo(el, index),
      isVisible: style.display !== 'none' && style.visibility !== 'hidden',
      zIndex,
    };
  });
}

/**
 * Get breadcrumb path from element to root
 */
export function getBreadcrumbs(element: HTMLElement): ElementInfo[] {
  const breadcrumbs: ElementInfo[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;

  while (current && current.tagName.toLowerCase() !== 'html') {
    breadcrumbs.unshift(buildElementInfo(current, depth));
    current = current.parentElement;
    depth++;
  }

  return breadcrumbs;
}

/**
 * Find best selector for element
 * Uses multiple strategies for robust selection
 */
export function findBestSelector(element: HTMLElement): string {
  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }

  // Try data attributes
  if (element.dataset.testid) {
    return `[data-testid="${element.dataset.testid}"]`;
  }
  if (element.dataset.id) {
    return `[data-id="${element.dataset.id}"]`;
  }

  // Try unique class combination
  if (element.className && typeof element.className === 'string') {
    const classes = element.className
      .split(/\s+/)
      .filter(c => c.length > 2 && !c.match(/^[a-z0-9]{5,}$/));
    
    if (classes.length > 0) {
      const selector = `.${classes.join('.')}`;
      // Check if unique
      if (document.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }
  }

  // Fall back to path-based selector
  const path = getElementPath(element);
  const parts = path.split(' > ');
  
  // Use last 2-3 parts for more specific selector
  const specificParts = parts.slice(-3);
  return specificParts.join(' > ');
}
