// =============================================================================
// Shared Styles and Constants
// =============================================================================

// 颜色常量
export const COLORS = {
  primary: '#6155F5',
  primaryLight: 'rgba(97, 85, 245, 0.2)',
  primaryDark: 'rgba(97, 85, 245, 0.1)',
  
  // 动画类型颜色
  cssAnimation: '#FF6B6B',
  cssTransition: '#4ECDC4',
  waapi: '#FFD93D',
  framerMotion: '#A855F7',
  gsap: '#22C55E',
  
  // UI 颜色
  background: 'rgba(0, 0, 0, 0.9)',
  backgroundLight: 'rgba(255, 255, 255, 0.03)',
  backgroundMedium: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.06)',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  
  text: '#fff',
  textMuted: 'rgba(255, 255, 255, 0.4)',
  textLight: 'rgba(255, 255, 255, 0.5)',
  
  error: '#ff6b6b',
  success: '#22C55E',
  warning: '#FFD93D',
} as const;

// 尺寸常量
export const SIZES = {
  panel: {
    minWidth: 280,
    minHeight: 400,
    defaultWidth: 320,
    defaultHeight: 600,
  },
  button: {
    toggleSize: 48,
    borderRadius: 12,
  },
  input: {
    height: 28,
    borderRadius: 4,
  },
} as const;

// 输入框样式
export const INPUT_STYLES = {
  default: {
    padding: '4px 8px',
    background: COLORS.backgroundMedium,
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: '4px',
    color: COLORS.text,
    fontSize: '12px',
    fontFamily: 'monospace',
    outline: 'none',
  },
  disabled: {
    padding: '4px 8px',
    background: COLORS.backgroundLight,
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '12px',
    fontFamily: 'monospace',
    outline: 'none',
  },
} as const;

// 按钮样式
export const BUTTON_STYLES = {
  primary: {
    padding: '4px 8px',
    background: COLORS.primaryLight,
    border: `1px solid ${COLORS.primary}`,
    borderRadius: '4px',
    color: COLORS.text,
    fontSize: '10px',
    cursor: 'pointer',
  },
  default: {
    padding: '4px 8px',
    background: COLORS.backgroundMedium,
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: '4px',
    color: COLORS.text,
    fontSize: '10px',
    cursor: 'pointer',
  },
  disabled: {
    padding: '4px 8px',
    background: COLORS.backgroundLight,
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: '4px',
    color: COLORS.textMuted,
    fontSize: '10px',
    cursor: 'not-allowed',
  },
} as const;

// 下拉框样式
export const SELECT_STYLES = {
  default: {
    padding: '4px 8px',
    background: COLORS.backgroundMedium,
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: '4px',
    color: COLORS.text,
    fontSize: '11px',
    outline: 'none',
  },
} as const;

// 动画类型配置
export const ANIMATION_TYPE_CONFIG = {
  'css-animation': {
    label: 'CSS Animation',
    color: COLORS.cssAnimation,
    description: '@keyframes 定义的 CSS 关键帧动画',
  },
  'css-transition': {
    label: 'CSS Transition',
    color: COLORS.cssTransition,
    description: 'CSS 属性变化时的过渡效果',
  },
  'waapi': {
    label: 'Web Animation',
    color: COLORS.waapi,
    description: 'JavaScript Web Animations API 动画',
  },
  'framer-motion': {
    label: 'Framer Motion',
    color: COLORS.framerMotion,
    description: 'Framer Motion React 动画库',
  },
  'gsap': {
    label: 'GSAP',
    color: COLORS.gsap,
    description: 'GSAP JavaScript 动画库',
  },
} as const;
