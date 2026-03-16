// =============================================================================
// Animation Detector - CSS, Framer Motion, GSAP 动画检测
// =============================================================================

import type { AnimationInfo } from '../types';

/**
 * 解析时间值 (ms, s)
 */
function parseTimeValue(value: string): number {
  if (!value) return 0;
  
  value = value.trim();
  
  if (value.endsWith('ms')) {
    return parseFloat(value);
  } else if (value.endsWith('s')) {
    return parseFloat(value) * 1000;
  }
  
  return parseFloat(value) || 0;
}

/**
 * 解析动画迭代次数
 */
function parseIterationCount(value: string): number | 'infinite' {
  if (!value || value === 'infinite') return 'infinite';
  return parseInt(value, 10) || 1;
}

/**
 * 获取元素的 CSS 动画信息
 */
export function getCSSAnimations(element: HTMLElement): AnimationInfo[] {
  const animations: AnimationInfo[] = [];
  const computed = window.getComputedStyle(element);
  
  // 获取动画名称列表
  const animationName = computed.getPropertyValue('animation-name');
  const animationDuration = computed.getPropertyValue('animation-duration');
  const animationDelay = computed.getPropertyValue('animation-delay');
  const animationTimingFunction = computed.getPropertyValue('animation-timing-function');
  const animationIterationCount = computed.getPropertyValue('animation-iteration-count');
  
  if (animationName && animationName !== 'none') {
    const names = animationName.split(',').map(n => n.trim());
    const durations = animationDuration.split(',').map(d => d.trim());
    const delays = animationDelay.split(',').map(d => d.trim());
    const easings = animationTimingFunction.split(',').map(e => e.trim());
    const iterations = animationIterationCount.split(',').map(i => i.trim());
    
    names.forEach((name, index) => {
      if (name && name !== 'none') {
        animations.push({
          type: 'css-animation',
          name: name,
          duration: parseTimeValue(durations[index] || durations[0] || '0s'),
          delay: parseTimeValue(delays[index] || delays[0] || '0s'),
          easing: easings[index] || easings[0] || 'ease',
          iterations: parseIterationCount(iterations[index] || iterations[0] || '1'),
        });
      }
    });
  }
  
  return animations;
}

/**
 * 获取元素的 CSS 过渡信息
 */
export function getCSSTransitions(element: HTMLElement): AnimationInfo[] {
  const transitions: AnimationInfo[] = [];
  const computed = window.getComputedStyle(element);
  
  const transitionProperty = computed.getPropertyValue('transition-property');
  const transitionDuration = computed.getPropertyValue('transition-duration');
  const transitionDelay = computed.getPropertyValue('transition-delay');
  const transitionTimingFunction = computed.getPropertyValue('transition-timing-function');
  
  // 如果 duration 为 0s，则不是真正的动画
  const durations = transitionDuration.split(',').map(d => d.trim());
  const hasRealDuration = durations.some(d => parseTimeValue(d) > 0);
  
  if (!hasRealDuration) {
    return transitions;
  }
  
  if (transitionProperty && transitionProperty !== 'all' && transitionProperty !== 'none') {
    const properties = transitionProperty.split(',').map(p => p.trim());
    const delays = transitionDelay.split(',').map(d => d.trim());
    const easings = transitionTimingFunction.split(',').map(e => e.trim());
    
    properties.forEach((prop, index) => {
      if (prop && prop !== 'none') {
        const duration = parseTimeValue(durations[index] || durations[0] || '0s');
        // 只添加有实际 duration 的 transition
        if (duration > 0) {
          transitions.push({
            type: 'css-transition',
            name: prop,
            duration: duration,
            delay: parseTimeValue(delays[index] || delays[0] || '0s'),
            easing: easings[index] || easings[0] || 'ease',
            iterations: 1,
          });
        }
      }
    });
  } else if (transitionProperty === 'all') {
    // 'all' transition
    const duration = parseTimeValue(transitionDuration || '0s');
    if (duration > 0) {
      transitions.push({
        type: 'css-transition',
        name: 'all',
        duration: duration,
        delay: parseTimeValue(transitionDelay || '0s'),
        easing: transitionTimingFunction || 'ease',
        iterations: 1,
      });
    }
  }
  
  return transitions;
}

/**
 * 检测 Framer Motion 动画
 * Framer Motion 使用多种方式实现动画:
 * 1. animate prop - 使用 WAAPI 或直接样式操作
 * 2. whileHover/whileTap - 交互式动画
 * 3. transition prop - 动画配置
 */
export function getFramerMotionAnimations(element: HTMLElement): AnimationInfo[] {
  const animations: AnimationInfo[] = [];
  
  // 方法1: 通过 React Fiber 检测 Framer Motion props
  const fiberProps = getReactFiberProps(element);
  
  if (fiberProps) {
    // 检查是否有 Framer Motion 相关的 props
    const motionKeys = ['animate', 'whileHover', 'whileTap', 'whileFocus', 'whileDrag', 'initial', 'exit', 'variants'];
    
    for (const key of motionKeys) {
      if (fiberProps[key]) {
        const value = fiberProps[key];
        const transition = fiberProps.transition || {};
        
        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([propKey, propValue]) => {
            animations.push({
              type: 'framer-motion',
              name: `${key}:${propKey}`,
              duration: transition.duration 
                ? (transition.duration * 1000) 
                : getDefaultDuration(key),
              delay: (transition.delay || 0) * 1000,
              easing: getEasingFromFramerMotion(transition),
              iterations: transition.repeat === Infinity ? 'infinite' : 
                         (transition.repeat || 0) + 1,
              isPaused: key.startsWith('while'),
            });
          });
        }
      }
    }
  }
  
  // 方法2: 检查 WAAPI 动画 (Framer Motion 使用 WAAPI 执行动画)
  const waapiAnimations = element.getAnimations();
  for (const anim of waapiAnimations) {
    const effect = anim.effect as KeyframeEffect;
    if (effect) {
      const target = effect.target;
      if (target === element) {
        const timing = effect.getComputedTiming();
        // 如果已经有 Framer Motion 检测结果，跳过
        if (animations.length === 0) {
          animations.push({
            type: 'waapi',
            name: 'keyframe-animation',
            duration: timing.duration as number,
            delay: timing.delay as number,
            easing: typeof timing.easing === 'string' ? timing.easing : 'ease',
            iterations: timing.iterations === Infinity ? 'infinite' : timing.iterations as number,
            isPaused: anim.playState === 'paused',
          });
        }
      }
    }
  }
  
  return animations;
}

/**
 * 从 React Fiber 获取 props
 * 遍历 fiber 树查找 Framer Motion 相关的 props
 */
function getReactFiberProps(element: HTMLElement): Record<string, any> | null {
  // 尝试多种 fiber key
  const fiberKeys = Object.keys(element).filter(key => 
    key.startsWith('__reactFiber$') || 
    key.startsWith('__reactInternalInstance$') ||
    key.startsWith('__reactInternalInstance') ||
    key.startsWith('_reactInternalFiber')
  );
  
  for (const fiberKey of fiberKeys) {
    let fiber = (element as any)[fiberKey];
    
    // 遍历 fiber 树查找 motion props
    let depth = 0;
    while (fiber && depth < 10) {
      depth++;
      
      // 检查 memoizedProps
      if (fiber.memoizedProps) {
        const props = fiber.memoizedProps;
        // 检查是否有 Framer Motion 特征属性
        if (props.animate || props.whileHover || props.whileTap || 
            props.whileFocus || props.whileDrag || props.initial ||
            props.variants || props.transition) {
          return props;
        }
      }
      
      // 检查 pendingProps
      if (fiber.pendingProps) {
        const props = fiber.pendingProps;
        if (props.animate || props.whileHover || props.whileTap || 
            props.whileFocus || props.whileDrag || props.initial ||
            props.variants || props.transition) {
          return props;
        }
      }
      
      // 向上遍历
      fiber = fiber.return;
    }
  }
  
  // 尝试直接获取 __reactProps$
  const propsKey = Object.keys(element).find(key => key.startsWith('__reactProps$'));
  if (propsKey) {
    const props = (element as any)[propsKey];
    if (props && (props.animate || props.whileHover || props.whileTap)) {
      return props;
    }
  }
  
  return null;
}

/**
 * 从 Framer Motion transition 获取 easing
 */
function getEasingFromFramerMotion(transition: any): string {
  if (!transition) return 'ease';
  
  if (transition.type === 'spring') {
    return `spring(${transition.stiffness || 100}, ${transition.damping || 10})`;
  }
  
  if (transition.type === 'tween' || transition.ease) {
    return transition.ease || 'ease';
  }
  
  return 'ease';
}

/**
 * 获取默认动画持续时间
 */
function getDefaultDuration(type: string): number {
  switch (type) {
    case 'whileTap':
      return 100;
    case 'whileHover':
      return 200;
    case 'whileFocus':
      return 200;
    case 'whileDrag':
      return 250;
    default:
      return 300;
  }
}

/**
 * 检测 GSAP 动画
 */
export function getGSAPAnimations(element: HTMLElement): AnimationInfo[] {
  const animations: AnimationInfo[] = [];
  
  // 检查 GSAP 全局对象
  const gsap = (window as any).gsap;
  if (!gsap) return animations;
  
  // 获取元素上的 GSAP 动画
  const tweens = gsap.getTweensOf(element);
  
  for (const tween of tweens) {
    const targets = tween.targets();
    if (targets.includes(element)) {
      // 获取 easing 字符串
      let easingStr = 'power1.out';
      const easeVar = tween.vars?.ease;
      if (typeof easeVar === 'string') {
        easingStr = easeVar;
      } else if (easeVar && typeof easeVar === 'object' && easeVar.getData) {
        // GSAP Ease 类
        easingStr = easeVar.name || 'power1.out';
      }
      
      animations.push({
        type: 'gsap',
        name: tween.vars?.name || 'gsap-animation',
        duration: tween.duration() * 1000,
        delay: tween.delay() * 1000,
        easing: easingStr,
        iterations: tween.vars?.repeat === -1 ? 'infinite' : (tween.vars?.repeat || 0) + 1,
        isPaused: tween.paused(),
      });
    }
  }
  
  return animations;
}

/**
 * 获取元素的所有动画信息
 */
export function getAnimations(element: HTMLElement): AnimationInfo[] {
  return [
    ...getCSSAnimations(element),
    ...getCSSTransitions(element),
    ...getFramerMotionAnimations(element),
    ...getGSAPAnimations(element),
  ];
}

/**
 * 检查元素是否有动画
 */
export function hasAnimations(element: HTMLElement): boolean {
  return getAnimations(element).length > 0;
}

/**
 * 暂停元素的所有动画
 */
export function pauseAnimations(element: HTMLElement): void {
  element.style.animationPlayState = 'paused';
}

/**
 * 恢复元素的所有动画
 */
export function resumeAnimations(element: HTMLElement): void {
  element.style.animationPlayState = 'running';
}

/**
 * 设置动画持续时间
 */
export function setAnimationDuration(element: HTMLElement, duration: number): void {
  element.style.animationDuration = `${duration}ms`;
}

/**
 * 设置动画延迟
 */
export function setAnimationDelay(element: HTMLElement, delay: number): void {
  element.style.animationDelay = `${delay}ms`;
}

/**
 * 设置动画缓动函数
 */
export function setAnimationTimingFunction(element: HTMLElement, easing: string): void {
  element.style.animationTimingFunction = easing;
}

/**
 * 设置过渡属性
 */
export function setTransition(
  element: HTMLElement, 
  property: string, 
  duration: number, 
  easing: string = 'ease',
  delay: number = 0
): void {
  element.style.transition = `${property} ${duration}ms ${easing} ${delay}ms`;
}
