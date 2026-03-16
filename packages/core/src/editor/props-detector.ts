// =============================================================================
// Props Detector - React Component Props Detection
// =============================================================================

import type { ComponentProp } from '../types';

/**
 * Find React fiber for an element
 */
function findReactFiber(element: HTMLElement): unknown | null {
  const keys = Object.keys(element);
  
  for (const key of keys) {
    if (key.startsWith('__reactFiber$') || 
        key.startsWith('__reactInternalInstance$') ||
        key.startsWith('_reactInternals')) {
      return (element as Record<string, unknown>)[key];
    }
  }
  
  return null;
}

/**
 * Get component name from fiber
 */
function getComponentName(fiber: any): string | null {
  if (!fiber) return null;
  
  // Try various sources for component name
  const type = fiber.type;
  
  if (typeof type === 'function') {
    return type.displayName || type.name || null;
  }
  
  if (typeof type === 'object' && type !== null) {
    return (type as any).displayName || (type as any).name || null;
  }
  
  return null;
}

/**
 * Get props from fiber
 */
function getPropsFromFiber(fiber: any): Record<string, unknown> | null {
  if (!fiber) return null;
  
  // memoizedProps contains the current props
  if (fiber.memoizedProps) {
    return fiber.memoizedProps;
  }
  
  // pendingProps for updates
  if (fiber.pendingProps) {
    return fiber.pendingProps;
  }
  
  return null;
}

/**
 * Detect if element is a React component
 */
export function isReactComponent(element: HTMLElement): boolean {
  return findReactFiber(element) !== null;
}

/**
 * Get React component info for element
 */
export function getComponentInfo(element: HTMLElement): {
  name: string | null;
  props: Record<string, unknown> | null;
} {
  const fiber = findReactFiber(element);
  
  if (!fiber) {
    return { name: null, props: null };
  }
  
  // Walk up to find the component fiber
  let currentFiber: any = fiber;
  let componentName: string | null = null;
  let componentProps: Record<string, unknown> | null = null;
  
  while (currentFiber) {
    const name = getComponentName(currentFiber);
    
    // Skip host components (div, span, etc.)
    if (name && typeof currentFiber.type === 'function') {
      componentName = name;
      componentProps = getPropsFromFiber(currentFiber);
      break;
    }
    
    currentFiber = currentFiber.return;
  }
  
  return {
    name: componentName,
    props: componentProps,
  };
}

/**
 * Convert props to ComponentProp array
 */
export function propsToComponentProps(props: Record<string, unknown>): ComponentProp[] {
  const result: ComponentProp[] = [];
  
  // Common UI component props patterns
  const enumProps: Record<string, string[]> = {
    size: ['sm', 'md', 'lg', 'xl'],
    variant: ['primary', 'secondary', 'ghost', 'outline', 'link'],
    color: ['default', 'primary', 'success', 'warning', 'danger'],
    radius: ['none', 'sm', 'md', 'lg', 'full'],
    shadow: ['none', 'sm', 'md', 'lg', 'xl'],
  };
  
  for (const [name, value] of Object.entries(props)) {
    // Skip internal React props
    if (name === 'children' || name === 'key' || name === 'ref') continue;
    
    // Skip event handlers
    if (name.startsWith('on')) continue;
    
    // Skip functions
    if (typeof value === 'function') continue;
    
    // Determine type
    let type: ComponentProp['type'] = 'string';
    let options: string[] | undefined;
    
    if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (typeof value === 'number') {
      type = 'number';
    } else if (typeof value === 'object' && value !== null) {
      type = 'object';
    } else if (enumProps[name]) {
      type = 'enum';
      options = enumProps[name];
    }
    
    result.push({
      name,
      type,
      value,
      options,
    });
  }
  
  return result;
}

/**
 * Get all component props for editing
 */
export function getEditableProps(element: HTMLElement): ComponentProp[] {
  const { props } = getComponentInfo(element);
  
  if (!props) {
    return [];
  }
  
  return propsToComponentProps(props);
}

/**
 * Update component prop (requires re-render)
 * Note: This is a best-effort approach; actual prop updates
 * require the component to support external prop changes
 */
export function updateComponentProp(
  element: HTMLElement,
  propName: string,
  value: unknown
): boolean {
  // In React, we can't directly update props
  // But we can try to trigger a re-render with new props
  // This requires the component to have a way to receive external updates
  
  // For now, we just return false as this requires framework-specific implementation
  // The React package will handle this with proper hooks
  return false;
}

/**
 * Detect common component libraries
 */
export function detectComponentLibrary(element: HTMLElement): string | null {
  const { name } = getComponentInfo(element);
  
  if (!name) return null;
  
  // Check for common patterns
  if (name.includes('MUI') || name.includes('Mui')) return '@mui/material';
  if (name.includes('Ant') || name.includes('antd')) return 'antd';
  if (name.includes('Chakra')) return '@chakra-ui/react';
  if (name.includes('Radix')) return '@radix-ui/react';
  if (name.startsWith('Headless')) return '@headlessui/react';
  
  return null;
}
