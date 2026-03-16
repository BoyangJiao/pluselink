// =============================================================================
// Animation Editor Component
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePulselinkStore } from '../store';
import type { AnimationInfo } from '../../../core/src/types';

// 预设缓动函数 - CSS/WAAPI 格式
const CSS_EASING_PRESETS = [
  { label: 'Linear', value: 'linear', points: [0, 0, 1, 1] },
  { label: 'Ease', value: 'ease', points: [0.25, 0.1, 0.25, 1] },
  { label: 'Ease In', value: 'ease-in', points: [0.42, 0, 1, 1] },
  { label: 'Ease Out', value: 'ease-out', points: [0, 0, 0.58, 1] },
  { label: 'Ease In Out', value: 'ease-in-out', points: [0.42, 0, 0.58, 1] },
  { label: 'Spring', value: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', points: [0.175, 0.885, 0.32, 1.275] },
  { label: 'Bounce', value: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', points: [0.68, -0.55, 0.265, 1.55] },
  { label: 'Smooth', value: 'cubic-bezier(0.4, 0, 0.2, 1)', points: [0.4, 0, 0.2, 1] },
];

// GSAP 缓动函数
const GSAP_EASING_PRESETS = [
  { label: 'Linear', value: 'none', points: [0, 0, 1, 1] },
  { label: 'Power1 Out', value: 'power1.out', points: [0.33, 0, 0.67, 1] },
  { label: 'Power1 In', value: 'power1.in', points: [0, 0.33, 1, 0.67] },
  { label: 'Power1 InOut', value: 'power1.inOut', points: [0.33, 0, 0.67, 1] },
  { label: 'Power2 Out', value: 'power2.out', points: [0.25, 0, 0.5, 1] },
  { label: 'Power2 In', value: 'power2.in', points: [0, 0.25, 1, 0.5] },
  { label: 'Power2 InOut', value: 'power2.inOut', points: [0.25, 0, 0.5, 1] },
  { label: 'Power3 Out', value: 'power3.out', points: [0.17, 0, 0.33, 1] },
  { label: 'Power3 In', value: 'power3.in', points: [0, 0.17, 1, 0.33] },
  { label: 'Power3 InOut', value: 'power3.inOut', points: [0.17, 0, 0.33, 1] },
  { label: 'Back Out', value: 'back.out', points: [0.34, 1.56, 0.64, 1] },
  { label: 'Back In', value: 'back.in', points: [0.6, -0.28, 0.74, 0.05] },
  { label: 'Elastic Out', value: 'elastic.out(1, 0.3)', points: [0.68, -0.55, 0.27, 1.55] },
  { label: 'Bounce Out', value: 'bounce.out', points: [0.34, 1.56, 0.64, 1] },
  { label: 'Expo Out', value: 'expo.out', points: [0.19, 1, 0.22, 1] },
  { label: 'Circ Out', value: 'circ.out', points: [0, 0.55, 0.45, 1] },
];

// 解析 cubic-bezier 值
function parseCubicBezier(easing: string): [number, number, number, number] {
  if (easing === 'linear') return [0, 0, 1, 1];
  if (easing === 'ease') return [0.25, 0.1, 0.25, 1];
  if (easing === 'ease-in') return [0.42, 0, 1, 1];
  if (easing === 'ease-out') return [0, 0, 0.58, 1];
  if (easing === 'ease-in-out') return [0.42, 0, 0.58, 1];
  
  const match = easing.match(/cubic-bezier\(([\d.\-]+),\s*([\d.\-]+),\s*([\d.\-]+),\s*([\d.\-]+)\)/);
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3]), parseFloat(match[4])];
  }
  
  // 查找预设
  const preset = CSS_EASING_PRESETS.find(p => p.value === easing);
  if (preset?.points) return preset.points as [number, number, number, number];
  
  const gsapPreset = GSAP_EASING_PRESETS.find(p => p.value === easing);
  if (gsapPreset?.points) return gsapPreset.points as [number, number, number, number];
  
  return [0, 0, 1, 1];
}

// 生成 cubic-bezier 字符串
function toCubicBezierString(points: [number, number, number, number]): string {
  return `cubic-bezier(${points[0].toFixed(3)}, ${points[1].toFixed(3)}, ${points[2].toFixed(3)}, ${points[3].toFixed(3)})`;
}

// 扩展的动画信息类型，包含本地修改
interface LocalAnimationInfo extends AnimationInfo {
  isPaused: boolean;
}

// 数字输入组件 - 处理"0"的逻辑
function NumberField({ 
  value, 
  onChange, 
  disabled,
  min = 0,
}: { 
  value: number; 
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
}) {
  const [displayValue, setDisplayValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 同步外部值
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(String(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // 选中全部文本
    inputRef.current?.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // 失焦时，如果为空则显示0
    if (displayValue === '' || displayValue === '-') {
      setDisplayValue('0');
      onChange(0);
    } else {
      const num = parseInt(displayValue, 10);
      if (!isNaN(num)) {
        const clampedValue = Math.max(min, num);
        setDisplayValue(String(clampedValue));
        onChange(clampedValue);
      } else {
        setDisplayValue(String(value));
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // 允许空字符串、单个负号、或有效数字
    if (newValue === '' || newValue === '-' || /^-?\d*$/.test(newValue)) {
      // 如果当前显示"0"且用户输入数字，替换掉0
      if (displayValue === '0' && newValue.length === 1 && /\d/.test(newValue)) {
        setDisplayValue(newValue);
      } else {
        setDisplayValue(newValue);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      style={{
        width: '70px',
        padding: '4px 8px',
        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '4px',
        color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
        fontSize: '12px',
        fontFamily: 'monospace',
        outline: 'none',
      }}
    />
  );
}

export function AnimationEditor() {
  const { selectedElement, animations } = usePulselinkStore();
  const [localAnimations, setLocalAnimations] = useState<LocalAnimationInfo[]>([]);

  // 同步 store 中的动画数据到本地状态
  useEffect(() => {
    setLocalAnimations(animations.map(anim => ({
      ...anim,
      isPaused: anim.isPaused ?? false,
    })));
  }, [animations]);

  if (!selectedElement) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <p style={{ fontSize: '13px' }}>No element selected</p>
      </div>
    );
  }

  if (animations.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <p style={{ fontSize: '13px' }}>No animations detected</p>
        <p style={{ fontSize: '11px', marginTop: '8px' }}>
          Select an element with CSS animations, transitions, or Framer Motion
        </p>
      </div>
    );
  }

  // 获取 WAAPI 动画实例
  const getWAAPIAnimations = () => {
    if (!selectedElement) return [];
    return selectedElement.getAnimations();
  };

  // 获取 GSAP tween 实例
  const getGSAPTween = () => {
    const gsap = (window as any).gsap;
    if (!gsap || !selectedElement) return null;
    const tweens = gsap.getTweensOf(selectedElement);
    return tweens.length > 0 ? tweens[0] : null;
  };

  // 应用动画参数变更
  const applyAnimationChange = (index: number, property: 'duration' | 'delay' | 'easing', value: number | string) => {
    const anim = localAnimations[index];
    if (!anim || !selectedElement) return;

    // 根据动画类型应用不同的更新策略
    switch (anim.type) {
      case 'css-animation':
        applyCSSAnimationChange(anim, property, value);
        break;
      case 'css-transition':
        applyCSSTransitionChange(anim, property, value);
        break;
      case 'framer-motion':
      case 'waapi':
        applyWAAPIAnimationChange(anim, property, value);
        break;
      case 'gsap':
        applyGSAPAnimationChange(anim, property, value);
        break;
    }
  };

  // CSS Animation 更新
  const applyCSSAnimationChange = (anim: LocalAnimationInfo, property: string, value: number | string) => {
    const computed = window.getComputedStyle(selectedElement);
    const animName = computed.getPropertyValue('animation-name');
    
    if (property === 'duration') {
      selectedElement.style.animationDuration = `${value}ms`;
    } else if (property === 'delay') {
      selectedElement.style.animationDelay = `${value}ms`;
    } else if (property === 'easing') {
      selectedElement.style.animationTimingFunction = value as string;
    }
    
    // 重启动画以应用新的参数
    selectedElement.style.animationName = 'none';
    // 强制重绘
    void selectedElement.offsetWidth;
    selectedElement.style.animationName = animName;
  };

  // CSS Transition 更新
  const applyCSSTransitionChange = (anim: LocalAnimationInfo, property: string, value: number | string) => {
    const computed = window.getComputedStyle(selectedElement);
    const transitionProp = computed.getPropertyValue('transition-property');
    const duration = property === 'duration' ? value : anim.duration;
    const delay = property === 'delay' ? value : anim.delay;
    const easing = property === 'easing' ? value : anim.easing;
    
    // 应用新的 transition
    selectedElement.style.transition = `${transitionProp} ${duration}ms ${easing} ${delay}ms`;
    
    // 触发一次 transition 效果（通过临时修改样式）
    const originalTransform = selectedElement.style.transform;
    selectedElement.style.transform = 'scale(1.001)';
    requestAnimationFrame(() => {
      selectedElement.style.transform = originalTransform;
    });
  };

  // WAAPI / Framer Motion 更新
  const applyWAAPIAnimationChange = (anim: LocalAnimationInfo, property: string, value: number | string) => {
    const waapiAnims = getWAAPIAnimations();
    
    // 如果有 WAAPI 动画，直接更新
    if (waapiAnims.length > 0) {
      for (const waapiAnim of waapiAnims) {
        const effect = waapiAnim.effect as KeyframeEffect;
        if (effect && effect.target === selectedElement) {
          // 直接更新 timing
          if (property === 'duration') {
            effect.updateTiming({ duration: value as number });
          } else if (property === 'delay') {
            effect.updateTiming({ delay: value as number });
          } else if (property === 'easing') {
            effect.updateTiming({ easing: value as string });
          }
          
          // 重启动画
          waapiAnim.cancel();
          waapiAnim.play();
        }
      }
      return;
    }
    
    // Framer Motion 回退方案：通过重新创建动画来应用新参数
    // Framer Motion 使用内联样式，我们需要触发重新渲染
    if (anim.type === 'framer-motion') {
      if (property === 'duration' || property === 'easing') {
        // 通过 CSS transition 来模拟 Framer Motion 的 easing 效果
        const duration = property === 'duration' ? (value as number) : anim.duration;
        const easing = property === 'easing' ? (value as string) : anim.easing;
        
        // 应用 transition
        selectedElement.style.transition = `transform ${duration}ms ${easing}`;
        
        // 触发重绘以应用 transition
        const computed = window.getComputedStyle(selectedElement);
        const transform = computed.transform;
        
        // 强制重绘
        selectedElement.style.transform = 'translateZ(0)';
        requestAnimationFrame(() => {
          selectedElement.style.transform = transform === 'none' ? '' : transform;
        });
      }
    }
  };

  // GSAP 更新
  const applyGSAPAnimationChange = (anim: LocalAnimationInfo, property: string, value: number | string) => {
    const gsap = (window as any).gsap;
    if (!gsap) {
      console.warn('GSAP not found');
      return;
    }
    
    // 获取所有 tweens
    const tweens = gsap.getTweensOf(selectedElement);
    
    if (tweens.length === 0) {
      // 如果没有找到 tween，尝试重新创建动画
      console.warn('No GSAP tween found for element, creating new one');
      
      // 创建新的 tween
      const duration = property === 'duration' ? (value as number) / 1000 : anim.duration / 1000;
      const easing = property === 'easing' ? (value as string) : anim.easing;
      
      gsap.to(selectedElement, {
        rotation: '+=360',
        duration: duration,
        ease: easing,
        repeat: anim.iterations === 'infinite' ? -1 : (anim.iterations as number) - 1,
      });
      return;
    }
    
    // 更新现有的 tween
    const tween = tweens[0];
    
    if (property === 'duration') {
      tween.duration((value as number) / 1000);
    } else if (property === 'delay') {
      tween.delay((value as number) / 1000);
    } else if (property === 'easing') {
      // GSAP 需要解析 easing 字符串
      tween.ease(value as string);
    }
    
    // 重启动画以应用新的参数
    tween.restart();
  };

  const handlePause = (index: number) => {
    const anim = localAnimations[index];
    if (!selectedElement || !anim) return;

    if (anim.type === 'css-animation') {
      selectedElement.style.animationPlayState = 'paused';
    } else if (anim.type === 'framer-motion' || anim.type === 'waapi') {
      const waapiAnims = getWAAPIAnimations();
      waapiAnims.forEach(a => a.pause());
    } else if (anim.type === 'gsap') {
      const tween = getGSAPTween();
      if (tween) tween.pause();
    }

    setLocalAnimations(prev => prev.map((a, i) => 
      i === index ? { ...a, isPaused: true } : a
    ));
  };

  const handleResume = (index: number) => {
    const anim = localAnimations[index];
    if (!selectedElement || !anim) return;

    if (anim.type === 'css-animation') {
      selectedElement.style.animationPlayState = 'running';
    } else if (anim.type === 'framer-motion' || anim.type === 'waapi') {
      const waapiAnims = getWAAPIAnimations();
      waapiAnims.forEach(a => a.play());
    } else if (anim.type === 'gsap') {
      const tween = getGSAPTween();
      if (tween) tween.play();
    }

    setLocalAnimations(prev => prev.map((a, i) => 
      i === index ? { ...a, isPaused: false } : a
    ));
  };

  const handleDurationChange = (index: number, duration: number) => {
    setLocalAnimations(prev => prev.map((a, i) => 
      i === index ? { ...a, duration } : a
    ));
    applyAnimationChange(index, 'duration', duration);
  };

  const handleDelayChange = (index: number, delay: number) => {
    setLocalAnimations(prev => prev.map((a, i) => 
      i === index ? { ...a, delay } : a
    ));
    applyAnimationChange(index, 'delay', delay);
  };

  const handleEasingChange = (index: number, easing: string) => {
    setLocalAnimations(prev => prev.map((a, i) => 
      i === index ? { ...a, easing } : a
    ));
    applyAnimationChange(index, 'easing', easing);
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* Animation List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {localAnimations.map((animation, index) => (
          <AnimationCard
            key={index}
            animation={animation}
            onPause={() => handlePause(index)}
            onResume={() => handleResume(index)}
            onDurationChange={(d) => handleDurationChange(index, d)}
            onDelayChange={(d) => handleDelayChange(index, d)}
            onEasingChange={(e) => handleEasingChange(index, e)}
          />
        ))}
      </div>
    </div>
  );
}

// Animation Card Component
function AnimationCard({
  animation,
  onPause,
  onResume,
  onDurationChange,
  onDelayChange,
  onEasingChange,
}: {
  animation: LocalAnimationInfo;
  onPause: () => void;
  onResume: () => void;
  onDurationChange: (duration: number) => void;
  onDelayChange: (delay: number) => void;
  onEasingChange: (easing: string) => void;
}) {
  const typeLabel = {
    'css-animation': 'CSS Animation',
    'css-transition': 'CSS Transition',
    'waapi': 'Web Animation',
    'framer-motion': 'Framer Motion',
    'gsap': 'GSAP',
  };

  const typeColor = {
    'css-animation': '#FF6B6B',
    'css-transition': '#4ECDC4',
    'waapi': '#FFD93D',
    'framer-motion': '#A855F7',
    'gsap': '#22C55E',
  };

  // 动画类型描述
  const typeDescription = {
    'css-animation': '@keyframes 定义的 CSS 关键帧动画',
    'css-transition': 'CSS 属性变化时的过渡效果',
    'waapi': 'JavaScript Web Animations API 动画',
    'framer-motion': 'Framer Motion React 动画库',
    'gsap': 'GSAP JavaScript 动画库',
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '12px',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '2px 8px',
            background: typeColor[animation.type] + '20',
            borderRadius: '4px',
            fontSize: '10px',
            color: typeColor[animation.type],
            fontWeight: 500,
          }}>
            {typeLabel[animation.type]}
          </span>
          <span style={{ 
            fontSize: '13px', 
            fontWeight: 500,
            color: '#fff',
          }}>
            {animation.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {animation.iterations === 'infinite' && (
            <span style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
            }}>
              ∞ looping
            </span>
          )}
          {/* Play/Pause buttons - 所有动画都支持 */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={onPause}
              disabled={animation.isPaused}
              style={{
                padding: '4px 8px',
                background: animation.isPaused ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '4px',
                color: animation.isPaused ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: animation.isPaused ? 'not-allowed' : 'pointer',
                fontSize: '10px',
              }}
            >
              ⏸
            </button>
            <button
              onClick={onResume}
              disabled={!animation.isPaused}
              style={{
                padding: '4px 8px',
                background: !animation.isPaused ? 'rgba(97, 85, 245, 0.1)' : 'rgba(97, 85, 245, 0.2)',
                border: '1px solid rgba(97, 85, 245, 0.3)',
                borderRadius: '4px',
                color: !animation.isPaused ? 'rgba(255,255,255,0.3)' : '#fff',
                cursor: !animation.isPaused ? 'not-allowed' : 'pointer',
                fontSize: '10px',
              }}
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* Type Description */}
      <div style={{
        fontSize: '10px',
        color: 'rgba(255,255,255,0.35)',
        marginBottom: '10px',
        padding: '4px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {typeDescription[animation.type]}
      </div>

      {/* Properties */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Duration */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
        }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            Duration
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NumberField
              value={animation.duration}
              onChange={onDurationChange}
            />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>ms</span>
          </div>
        </div>

        {/* Delay */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
        }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            Delay
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NumberField
              value={animation.delay}
              onChange={onDelayChange}
            />
            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>ms</span>
          </div>
        </div>

        {/* Easing */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
        }}>
          <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
            Easing
          </label>
          <select
            value={animation.easing}
            onChange={(e) => onEasingChange(e.target.value)}
            style={{
              width: '140px',
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '11px',
            }}
          >
            {/* GSAP 使用不同的 easing 格式 */}
            {(animation.type === 'gsap' ? GSAP_EASING_PRESETS : CSS_EASING_PRESETS).map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Bezier Curve Preview */}
        <BezierCurvePreview 
          easing={animation.easing}
          onChange={onEasingChange}
          isGSAP={animation.type === 'gsap'}
        />
      </div>
    </div>
  );
}

// 贝塞尔曲线可视化预览组件
function BezierCurvePreview({ 
  easing, 
  onChange,
  isGSAP,
}: { 
  easing: string; 
  onChange: (easing: string) => void;
  isGSAP: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<[number, number, number, number]>([0, 0, 1, 1]);
  const [dragging, setDragging] = useState<'cp1' | 'cp2' | null>(null);
  const [previewProgress, setPreviewProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  
  const SIZE = 140;
  const PADDING = 10;
  const DRAW_SIZE = SIZE - PADDING * 2;
  
  // 解析 easing 为控制点
  useEffect(() => {
    const parsed = parseCubicBezier(easing);
    setPoints(parsed);
  }, [easing]);
  
  // 预览动画
  const startPreview = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    const startTime = performance.now();
    const duration = 1000;
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用贝塞尔曲线计算进度
      const t = bezierProgress(points, progress);
      setPreviewProgress(t);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 完成后重置
        setTimeout(() => setPreviewProgress(0), 500);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [points]);
  
  // 绘制曲线
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, SIZE, SIZE);
    
    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, SIZE, SIZE);
    
    // 网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    
    // 绘制网格
    for (let i = 0; i <= 4; i++) {
      const pos = PADDING + (DRAW_SIZE / 4) * i;
      ctx.beginPath();
      ctx.moveTo(PADDING, pos);
      ctx.lineTo(SIZE - PADDING, pos);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(pos, PADDING);
      ctx.lineTo(pos, SIZE - PADDING);
      ctx.stroke();
    }
    
    // 边框
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.strokeRect(PADDING, PADDING, DRAW_SIZE, DRAW_SIZE);
    
    // 坐标转换函数
    const toCanvasX = (x: number) => PADDING + x * DRAW_SIZE;
    const toCanvasY = (y: number) => PADDING + (1 - y) * DRAW_SIZE;
    
    // 控制点
    const [cp1x, cp1y, cp2x, cp2y] = points;
    
    // 绘制控制线
    ctx.strokeStyle = 'rgba(97, 85, 245, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(0));
    ctx.lineTo(toCanvasX(cp1x), toCanvasY(cp1y));
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(toCanvasX(1), toCanvasY(1));
    ctx.lineTo(toCanvasX(cp2x), toCanvasY(cp2y));
    ctx.stroke();
    
    // 绘制贝塞尔曲线
    ctx.strokeStyle = '#6155F5';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(0));
    ctx.bezierCurveTo(
      toCanvasX(cp1x), toCanvasY(cp1y),
      toCanvasX(cp2x), toCanvasY(cp2y),
      toCanvasX(1), toCanvasY(1)
    );
    ctx.stroke();
    
    // 绘制控制点
    const drawControlPoint = (x: number, y: number, isActive: boolean) => {
      const cx = toCanvasX(x);
      const cy = toCanvasY(y);
      
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#fff' : '#6155F5';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    
    drawControlPoint(cp1x, cp1y, dragging === 'cp1');
    drawControlPoint(cp2x, cp2y, dragging === 'cp2');
    
    // 绘制预览进度点
    if (previewProgress > 0) {
      const t = previewProgress;
      const x = bezierPoint(0, cp1x, cp2x, 1, t);
      const y = bezierPoint(0, cp1y, cp2y, 1, t);
      
      ctx.beginPath();
      ctx.arc(toCanvasX(x), toCanvasY(y), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD93D';
      ctx.fill();
    }
    
    // 起点和终点
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(0), 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(toCanvasX(1), toCanvasY(1), 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fill();
    
  }, [points, dragging, previewProgress, SIZE, PADDING, DRAW_SIZE]);
  
  // 鼠标事件处理
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isGSAP) return; // GSAP 不支持自定义
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - PADDING) / DRAW_SIZE;
    const y = 1 - (e.clientY - rect.top - PADDING) / DRAW_SIZE;
    
    const [cp1x, cp1y, cp2x, cp2y] = points;
    
    // 检查是否点击了控制点
    const dist1 = Math.sqrt((x - cp1x) ** 2 + (y - cp1y) ** 2);
    const dist2 = Math.sqrt((x - cp2x) ** 2 + (y - cp2y) ** 2);
    
    if (dist1 < 0.1) {
      setDragging('cp1');
    } else if (dist2 < 0.1) {
      setDragging('cp2');
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || isGSAP) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let x = (e.clientX - rect.left - PADDING) / DRAW_SIZE;
    let y = 1 - (e.clientY - rect.top - PADDING) / DRAW_SIZE;
    
    // 限制范围
    x = Math.max(-0.5, Math.min(1.5, x));
    y = Math.max(-0.5, Math.min(1.5, y));
    
    const [cp1x, cp1y, cp2x, cp2y] = points;
    let newPoints: [number, number, number, number];
    
    if (dragging === 'cp1') {
      newPoints = [x, y, cp2x, cp2y];
    } else {
      newPoints = [cp1x, cp1y, x, y];
    }
    
    setPoints(newPoints);
    onChange(toCubicBezierString(newPoints));
  };
  
  const handleMouseUp = () => {
    setDragging(null);
  };
  
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '6px',
      }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
          {isGSAP ? 'Curve Preview' : 'Drag to customize'}
        </span>
        <button
          onClick={startPreview}
          style={{
            padding: '2px 8px',
            background: 'rgba(97, 85, 245, 0.2)',
            border: '1px solid rgba(97, 85, 245, 0.3)',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '10px',
            cursor: 'pointer',
          }}
        >
          ▶ Preview
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          borderRadius: '4px',
          cursor: isGSAP ? 'default' : (dragging ? 'grabbing' : 'grab'),
        }}
      />
    </div>
  );
}

// 计算贝塞尔曲线上的点
function bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

// 计算贝塞尔曲线进度（近似）
function bezierProgress(points: [number, number, number, number], t: number): number {
  const [_cp1x, cp1y, _cp2x, cp2y] = points;
  // 简化：直接使用 y 值
  return bezierPoint(0, cp1y, cp2y, 1, t);
}
