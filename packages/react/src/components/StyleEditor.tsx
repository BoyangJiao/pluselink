// =============================================================================
// Style Editor Component - Figma Style
// =============================================================================

import { useState, useEffect, useCallback, Component, ReactNode } from 'react';
import { usePulselinkStore } from '../store';
import { parseCSSValue } from '../../../core/src/index';

// 错误边界组件
export class StyleEditorErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[StyleEditor] Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '16px', color: '#ff6b6b', fontSize: '12px' }}>
          <div style={{ marginBottom: '8px' }}>⚠️ Style Editor Error</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
            {this.state.error?.message || 'Unknown error'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: '8px',
              padding: '4px 8px',
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 布局模式类型
type LayoutMode = 'fixed' | 'fill-container' | 'hug-content';

// 属性配置类型
type PropertyConfigItem = {
  icon: string;
  group: string;
  special?: 'padding' | 'margin';
};

// 属性配置
const PROPERTY_CONFIG: Record<string, PropertyConfigItem> = {
  // Layout - Frame
  width: { icon: 'width', group: 'frame' },
  height: { icon: 'height', group: 'frame' },
  // Layout - Spacing
  padding: { icon: 'padding', group: 'spacing', special: 'padding' },
  margin: { icon: 'margin', group: 'spacing', special: 'margin' },
  gap: { icon: 'gap', group: 'spacing' },
  borderRadius: { icon: 'borderRadius', group: 'spacing' },
  // Appearance
  backgroundColor: { icon: 'background', group: 'fill' },
  color: { icon: 'color', group: 'fill' },
  opacity: { icon: 'opacity', group: 'fill' },
  // Typography
  fontSize: { icon: 'fontSize', group: 'text' },
  fontWeight: { icon: 'fontWeight', group: 'text' },
  lineHeight: { icon: 'lineHeight', group: 'text' },
};

// 分组配置
const GROUP_CONFIG = {
  frame: { label: 'Frame', order: 1 },
  spacing: { label: 'Spacing', order: 2 },
  fill: { label: 'Fill', order: 3 },
  text: { label: 'Text', order: 4 },
};

// 属性显示名称
const PROPERTY_LABELS: Record<string, string> = {
  width: 'W',
  height: 'H',
  padding: 'Padding',
  margin: 'Margin',
  gap: 'Gap',
  borderRadius: 'Radius',
  backgroundColor: 'Fill',
  color: 'Text',
  opacity: 'Opacity',
  fontSize: 'Size',
  fontWeight: 'Weight',
  lineHeight: 'Line H',
};

export function StyleEditor() {
  const { selectedElement, modifiedStyles, updateStyle, resetStyles, isDirty } = usePulselinkStore();
  const [localStyles, setLocalStyles] = useState<Record<string, string>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('fixed');

  // Get current styles from element
  useEffect(() => {
    if (!selectedElement) {
      setLocalStyles({});
      return;
    }

    try {
      const computed = window.getComputedStyle(selectedElement);
      const styles: Record<string, string> = {};
      
      Object.keys(PROPERTY_CONFIG).forEach(prop => {
        const cssName = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        const value = computed.getPropertyValue(cssName);
        if (value) {
          styles[prop] = value;
        }
      });

      // Override with modified styles
      Object.entries(modifiedStyles).forEach(([key, value]) => {
        styles[key] = value;
      });

      setLocalStyles(styles);
    } catch (err) {
      console.error('[StyleEditor] Error getting styles:', err);
      setLocalStyles({});
    }
  }, [selectedElement, modifiedStyles]);

  const handleChange = useCallback((property: string, value: string) => {
    try {
      setLocalStyles(prev => ({ ...prev, [property]: value }));
      
      if (selectedElement) {
        const cssName = property.replace(/([A-Z])/g, '-$1').toLowerCase();
        selectedElement.style.setProperty(cssName, value);
      }
      
      updateStyle(property, value);
    } catch (err) {
      console.error('[StyleEditor] Error in handleChange:', err);
    }
  }, [selectedElement, updateStyle]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  if (!selectedElement) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
        <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>⟨⟩</div>
        <p style={{ fontSize: '12px' }}>Select an element to edit</p>
      </div>
    );
  }

  // 处理布局模式变化
  const handleLayoutModeChange = useCallback((mode: LayoutMode) => {
    setLayoutMode(mode);
    
    if (!selectedElement) return;
    
    try {
      if (mode === 'fill-container') {
        handleChange('width', '100%');
        handleChange('height', '100%');
      } else if (mode === 'hug-content') {
        handleChange('width', 'auto');
        handleChange('height', 'auto');
      } else {
        // fixed - 使用当前计算值
        const computed = window.getComputedStyle(selectedElement);
        const width = computed.getPropertyValue('width');
        const height = computed.getPropertyValue('height');
        handleChange('width', width);
        handleChange('height', height);
      }
    } catch (err) {
      console.error('[StyleEditor] Error in handleLayoutModeChange:', err);
    }
  }, [selectedElement, handleChange]);

  // 按分组组织属性
  const groupedProperties = Object.entries(PROPERTY_CONFIG).reduce((acc, [prop, config]) => {
    const group = config.group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(prop);
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div style={{ 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '11px',
    }}>
      {Object.entries(GROUP_CONFIG)
        .sort((a, b) => a[1].order - b[1].order)
        .map(([groupKey, groupConfig]) => {
          const properties = groupedProperties[groupKey];
          if (!properties || properties.length === 0) return null;
          const isCollapsed = collapsedGroups.has(groupKey);
          
          return (
            <PropertyGroup
              key={groupKey}
              label={groupConfig.label}
              isCollapsed={isCollapsed}
              onToggle={() => toggleGroup(groupKey)}
            >
              {!isCollapsed && (
                groupKey === 'frame' ? (
                  <FrameSection
                    localStyles={localStyles}
                    layoutMode={layoutMode}
                    onLayoutModeChange={handleLayoutModeChange}
                    onChange={handleChange}
                  />
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {properties.map(prop => (
                      <PropertyInput
                        key={prop}
                        property={prop}
                        value={localStyles[prop] || ''}
                        onChange={handleChange}
                      />
                    ))}
                  </div>
                )
              )}
            </PropertyGroup>
          );
        })}

      {/* Reset button */}
      {isDirty && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={resetStyles}
            style={{
              width: '100%',
              padding: '6px 12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px',
              color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
            }}
          >
            Reset to original
          </button>
        </div>
      )}
    </div>
  );
}

// 分组组件
function PropertyGroup({ 
  label, 
  isCollapsed, 
  onToggle, 
  children 
}: { 
  label: string; 
  isCollapsed: boolean; 
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          cursor: 'pointer',
          fontSize: '10px',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <span>{label}</span>
        <span style={{ 
          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s ease',
          fontSize: '8px',
        }}>▼</span>
      </button>
      <div style={{ padding: isCollapsed ? 0 : '8px 12px 12px' }}>
        {children}
      </div>
    </div>
  );
}

// 属性输入组件
function PropertyInput({
  property,
  value,
  onChange,
}: {
  property: string;
  value: string;
  onChange: (property: string, value: string) => void;
}) {
  const label = PROPERTY_LABELS[property] || property;
  const config = PROPERTY_CONFIG[property as keyof typeof PROPERTY_CONFIG];
  
  // 判断属性类型
  const isColor = property.toLowerCase().includes('color');
  const isOpacity = property === 'opacity';
  const isPadding = config?.special === 'padding';
  const isMargin = config?.special === 'margin';
  
  if (isPadding) {
    return (
      <PaddingInput
        property={property}
        label={label}
        value={value}
        onChange={onChange}
      />
    );
  }
  
  if (isMargin) {
    return (
      <MarginInput
        property={property}
        label={label}
        value={value}
        onChange={onChange}
      />
    );
  }
  
  if (isColor) {
    return (
      <ColorInput
        property={property}
        label={label}
        value={value}
        onChange={onChange}
      />
    );
  }
  
  if (isOpacity) {
    return (
      <OpacityInput
        property={property}
        label={label}
        value={value}
        onChange={onChange}
      />
    );
  }
  
  return (
    <SizeInput
      property={property}
      label={label}
      value={value}
      onChange={onChange}
    />
  );
}

// Frame Section 组件 - 包含布局模式选择器和尺寸输入
function FrameSection({
  localStyles,
  layoutMode,
  onLayoutModeChange,
  onChange,
}: {
  localStyles: Record<string, string>;
  layoutMode: LayoutMode;
  onLayoutModeChange: (mode: LayoutMode) => void;
  onChange: (property: string, value: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {/* 布局模式选择器 */}
      <LayoutModeSelector value={layoutMode} onChange={onLayoutModeChange} />
      
      {/* 尺寸输入 */}
      <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
        <SizeInput
          property="width"
          label="W"
          value={localStyles['width'] || ''}
          onChange={onChange}
          disabled={layoutMode !== 'fixed'}
        />
        <SizeInput
          property="height"
          label="H"
          value={localStyles['height'] || ''}
          onChange={onChange}
          disabled={layoutMode !== 'fixed'}
        />
      </div>
    </div>
  );
}

// 布局模式选择器
function LayoutModeSelector({
  value,
  onChange,
}: {
  value: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}) {
  const modes: { id: LayoutMode; label: string; icon: string }[] = [
    { id: 'fixed', label: 'Fixed', icon: '⬚' },
    { id: 'fill-container', label: 'Fill', icon: '▢' },
    { id: 'hug-content', label: 'Hug', icon: '⊏⊐' },
  ];
  
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(255,255,255,0.04)',
      borderRadius: '4px',
      padding: '2px',
      width: '100%',
    }}>
      {modes.map(mode => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          title={mode.label}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            padding: '6px 8px',
            background: value === mode.id ? 'rgba(97, 85, 245, 0.3)' : 'transparent',
            border: 'none',
            borderRadius: '3px',
            color: value === mode.id ? '#fff' : 'rgba(255,255,255,0.5)',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{ fontSize: '12px' }}>{mode.icon}</span>
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

// 智能数字输入组件 - 处理0的删除和替换逻辑
function SmartNumberInput({
  value,
  onChange,
  disabled,
  style,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  // 确保 value 是有效数字
  const safeValue = Number.isFinite(value) ? value : 0;
  const [displayValue, setDisplayValue] = useState<string>(String(safeValue));
  const [isFocused, setIsFocused] = useState(false);

  // 当外部value变化时更新displayValue
  useEffect(() => {
    if (!isFocused) {
      const newSafeValue = Number.isFinite(value) ? value : 0;
      setDisplayValue(String(newSafeValue));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // 允许空值（用户正在删除）
    if (inputValue === '' || inputValue === '-') {
      setDisplayValue(inputValue);
      return;
    }

    // 允许输入数字、小数点和负号
    if (/^-?\d*\.?\d*$/.test(inputValue)) {
      // 如果当前显示的是"0"且用户输入新数字，替换掉0
      if (displayValue === '0' && /^[1-9]$/.test(inputValue)) {
        setDisplayValue(inputValue);
        onChange(parseFloat(inputValue));
      } else {
        setDisplayValue(inputValue);
        // 只有当值有效时才触发onChange
        if (inputValue !== '-' && inputValue !== '.') {
          onChange(parseFloat(inputValue) || 0);
        }
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // 失去焦点时，如果为空则显示0
    if (displayValue === '' || displayValue === '-') {
      setDisplayValue('0');
      onChange(0);
    } else {
      // 格式化数字
      const num = parseFloat(displayValue);
      setDisplayValue(String(Math.round(num * 100) / 100));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // 如果当前值是0，选中全部内容方便输入
    if (displayValue === '0') {
      // 使用setTimeout确保在React渲染后执行
      setTimeout(() => {
        const input = document.activeElement as HTMLInputElement;
        if (input) {
          input.select();
        }
      }, 0);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '2px 4px',
        background: 'transparent',
        border: 'none',
        color: disabled ? 'rgba(255,255,255,0.3)' : '#fff',
        fontSize: '11px',
        fontFamily: 'inherit',
        textAlign: 'right',
        outline: 'none',
        cursor: disabled ? 'not-allowed' : 'text',
        ...style,
      }}
    />
  );
}

// 尺寸输入组件
function SizeInput({
  property,
  label,
  value,
  onChange,
  disabled,
}: {
  property: string;
  label: string;
  value: string;
  onChange: (property: string, value: string) => void;
  disabled?: boolean;
}) {
  const parsed = parseCSSValue(value);
  // 确保 numValue 是有效数字
  const numValue = Number.isFinite(parsed?.number) ? parsed!.number : 0;
  const unit = parsed?.unit || 'px';
  
  // Frame 属性使用更紧凑的布局
  const isFrame = property === 'width' || property === 'height';
  
  // 计算安全的显示值
  const displayValue = Math.round(numValue * 100) / 100;
  
  if (isFrame) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '4px',
        padding: '4px 6px',
        flex: 1,
        opacity: disabled ? 0.5 : 1,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', width: '12px' }}>
          {label}
        </span>
        <SmartNumberInput
          value={displayValue}
          onChange={(newVal) => onChange(property, `${newVal}${unit}`)}
          disabled={disabled}
        />
        <select
          value={unit}
          onChange={(e) => onChange(property, `${numValue}${e.target.value}`)}
          disabled={disabled}
          style={{
            width: '32px',
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'rgba(255,255,255,0.5)',
            fontSize: '10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            outline: 'none',
          }}
        >
          <option value="px">px</option>
          <option value="%">%</option>
          <option value="rem">rem</option>
          <option value="vw">vw</option>
          <option value="vh">vh</option>
          <option value="auto">auto</option>
        </select>
      </div>
    );
  }
  
  // 其他尺寸属性
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: '80px',
      flex: '1 1 calc(50% - 3px)',
    }}>
      <label style={{ 
        fontSize: '9px', 
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
      }}>
        {label}
      </label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        <input
          type="number"
          value={displayValue}
          onChange={(e) => onChange(property, `${e.target.value}${unit}`)}
          style={{
            flex: 1,
            padding: '4px 6px',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '11px',
            fontFamily: 'inherit',
            outline: 'none',
            minWidth: 0,
          }}
        />
        <select
          value={unit}
          onChange={(e) => onChange(property, `${numValue}${e.target.value}`)}
          style={{
            padding: '4px 2px',
            background: 'rgba(255,255,255,0.02)',
            border: 'none',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '9px',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="px">px</option>
          <option value="%">%</option>
          <option value="rem">rem</option>
        </select>
      </div>
    </div>
  );
}

// 颜色输入组件
function ColorInput({
  property,
  label,
  value,
  onChange,
}: {
  property: string;
  label: string;
  value: string;
  onChange: (property: string, value: string) => void;
}) {
  const hexValue = value.startsWith('#') ? value : rgbToHex(value) || '#000000';
  const [isEditing, setIsEditing] = useState(false);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      width: '100%',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px',
      }}>
        <span style={{ 
          fontSize: '9px', 
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '4px',
        padding: '4px 6px',
      }}>
        <div 
          style={{ 
            width: '20px', 
            height: '20px', 
            borderRadius: '3px',
            background: hexValue,
            border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'color';
            input.value = hexValue;
            input.click();
            input.onchange = (e) => {
              onChange(property, (e.target as HTMLInputElement).value);
            };
          }}
        >
          <input
            type="color"
            value={hexValue}
            onChange={(e) => onChange(property, e.target.value)}
            style={{
              position: 'absolute',
              inset: '-10px',
              width: '40px',
              height: '40px',
              opacity: 0,
              cursor: 'pointer',
            }}
          />
        </div>
        <input
          type="text"
          value={isEditing ? value : hexValue.toUpperCase()}
          onChange={(e) => onChange(property, e.target.value)}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          placeholder="#000000"
          style={{
            flex: 1,
            padding: '2px 4px',
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '11px',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

// 透明度输入组件
function OpacityInput({
  property,
  label,
  value,
  onChange,
}: {
  property: string;
  label: string;
  value: string;
  onChange: (property: string, value: string) => void;
}) {
  const numValue = parseFloat(value) || 1;
  const percentage = Math.round(numValue * 100);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      minWidth: '100%',
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
      }}>
        <span style={{ 
          fontSize: '9px', 
          color: 'rgba(255,255,255,0.4)',
          textTransform: 'uppercase',
          letterSpacing: '0.3px',
        }}>
          {label}
        </span>
        <span style={{ 
          fontSize: '10px', 
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'monospace',
        }}>
          {percentage}%
        </span>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <input
          type="range"
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => onChange(property, (parseInt(e.target.value) / 100).toString())}
          style={{
            flex: 1,
            height: '4px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '2px',
            cursor: 'pointer',
            accentColor: '#6155F5',
          }}
        />
        <input
          type="number"
          min="0"
          max="100"
          value={percentage}
          onChange={(e) => onChange(property, (parseInt(e.target.value) / 100).toString())}
          style={{
            width: '36px',
            padding: '2px 4px',
            background: 'rgba(255,255,255,0.04)',
            border: 'none',
            borderRadius: '3px',
            color: '#fff',
            fontSize: '10px',
            fontFamily: 'monospace',
            textAlign: 'right',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

// Helper: Convert RGB to Hex
function rgbToHex(rgb: string): string | null {
  if (!rgb) return null;
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return rgb.startsWith('#') ? rgb : null;
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

// Helper: Parse CSS shorthand value
function parseShorthandValue(value: string): { top: number; right: number; bottom: number; left: number; unit: string } {
  const defaultResult = { top: 0, right: 0, bottom: 0, left: 0, unit: 'px' };
  if (!value || value === 'auto' || value === '0') return defaultResult;
  
  const parts = value.trim().split(/\s+/);
  const unitMatch = parts[0]?.match(/(px|rem|em|%|vh|vw)?$/);
  const unit = unitMatch?.[1] || 'px';
  const nums = parts.map(p => { const n = parseFloat(p); return Number.isFinite(n) ? n : 0; });
  
  if (nums.length === 1) return { top: nums[0], right: nums[0], bottom: nums[0], left: nums[0], unit };
  if (nums.length === 2) return { top: nums[0], right: nums[1], bottom: nums[0], left: nums[1], unit };
  if (nums.length === 3) return { top: nums[0], right: nums[1], bottom: nums[2], left: nums[1], unit };
  if (nums.length >= 4) return { top: nums[0], right: nums[1], bottom: nums[2], left: nums[3], unit };
  return defaultResult;
}

// Number Field Component
function NumberField({ value, onChange, placeholder, small }: {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  small?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  
  useEffect(() => {
    if (!isFocused) setDisplayValue(String(value));
  }, [value, isFocused]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v === '' || v === '-') { setDisplayValue(v); return; }
    if (/^-?\d*\.?\d*$/.test(v)) {
      if (displayValue === '0' && /^[1-9]$/.test(v)) {
        setDisplayValue(v); onChange(parseFloat(v));
      } else {
        setDisplayValue(v);
        if (v !== '-' && v !== '.' && !v.endsWith('.')) {
          const n = parseFloat(v);
          if (Number.isFinite(n)) onChange(n);
        }
      }
    }
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    if (displayValue === '' || displayValue === '-') { setDisplayValue('0'); onChange(0); }
    else { const n = parseFloat(displayValue); setDisplayValue(String(Number.isFinite(n) ? Math.round(n * 100) / 100 : 0)); }
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    if (displayValue === '0') setTimeout(() => { (document.activeElement as HTMLInputElement)?.select(); }, 0);
  };
  
  const size = small ? { width: '40px', padding: '3px 4px', fontSize: '10px' } : { width: '50px', padding: '4px 6px', fontSize: '11px' };
  return <input type="text" inputMode="decimal" value={displayValue} onChange={handleChange} onFocus={handleFocus} onBlur={handleBlur} placeholder={placeholder} style={{ ...size, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', color: '#fff', textAlign: 'center', outline: 'none' }} />;
}

// Padding Input Component
function PaddingInput({ property, label, value, onChange }: { property: string; label: string; value: string; onChange: (property: string, value: string) => void }) {
  const parsed = parseShorthandValue(value);
  const [isLinked, setIsLinked] = useState(true);
  const [values, setValues] = useState(parsed);
  
  useEffect(() => { setValues(parseShorthandValue(value)); }, [value]);
  
  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', newValue: number) => {
    let newValues = { ...values, [side]: newValue };
    if (isLinked) { newValues = { ...newValues, top: newValue, right: newValue, bottom: newValue, left: newValue }; }
    setValues(newValues);
    const cssValue = `${newValues.top}${values.unit} ${newValues.right}${values.unit} ${newValues.bottom}${values.unit} ${newValues.left}${values.unit}`;
    onChange(property, cssValue);
  };
  
  const handleUnitChange = (newUnit: string) => {
    setValues(v => ({ ...v, unit: newUnit }));
    onChange(property, `${values.top}${newUnit} ${values.right}${newUnit} ${values.bottom}${newUnit} ${values.left}${newUnit}`);
  };
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>
        <button onClick={() => setIsLinked(!isLinked)} style={{ padding: '2px 4px', background: isLinked ? 'rgba(97, 85, 245, 0.3)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', color: isLinked ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '10px' }}>{isLinked ? '🔗' : '⛓️‍💥'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gridTemplateRows: 'auto auto auto', gap: '4px', alignItems: 'center', justifyItems: 'center' }}>
        <div style={{ gridColumn: '2', gridRow: '1' }}><NumberField value={values.top} onChange={(v) => handleChange('top', v)} placeholder="T" small /></div>
        <div style={{ gridColumn: '1', gridRow: '2' }}><NumberField value={values.left} onChange={(v) => handleChange('left', v)} placeholder="L" small /></div>
        <div style={{ gridColumn: '2', gridRow: '2', width: '24px', height: '24px', background: 'rgba(97, 85, 245, 0.2)', borderRadius: '4px', border: '1px solid rgba(97, 85, 245, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>P</span></div>
        <div style={{ gridColumn: '3', gridRow: '2' }}><NumberField value={values.right} onChange={(v) => handleChange('right', v)} placeholder="R" small /></div>
        <div style={{ gridColumn: '2', gridRow: '3' }}><NumberField value={values.bottom} onChange={(v) => handleChange('bottom', v)} placeholder="B" small /></div>
      </div>
      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
        <select value={values.unit} onChange={(e) => handleUnitChange(e.target.value)} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', color: 'rgba(255,255,255,0.5)', fontSize: '9px', cursor: 'pointer', outline: 'none' }}>
          <option value="px">px</option>
          <option value="rem">rem</option>
          <option value="%">%</option>
        </select>
      </div>
    </div>
  );
}

// Margin Input Component
function MarginInput({ property, label, value, onChange }: { property: string; label: string; value: string; onChange: (property: string, value: string) => void }) {
  const parsed = parseShorthandValue(value);
  const [isLinked, setIsLinked] = useState(true);
  const [values, setValues] = useState(parsed);
  
  useEffect(() => { setValues(parseShorthandValue(value)); }, [value]);
  
  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', newValue: number) => {
    let newValues = { ...values, [side]: newValue };
    if (isLinked) { newValues = { ...newValues, top: newValue, right: newValue, bottom: newValue, left: newValue }; }
    setValues(newValues);
    const cssValue = `${newValues.top}${values.unit} ${newValues.right}${values.unit} ${newValues.bottom}${values.unit} ${newValues.left}${values.unit}`;
    onChange(property, cssValue);
  };
  
  const handleUnitChange = (newUnit: string) => {
    setValues(v => ({ ...v, unit: newUnit }));
    onChange(property, `${values.top}${newUnit} ${values.right}${newUnit} ${values.bottom}${newUnit} ${values.left}${newUnit}`);
  };
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>
        <button onClick={() => setIsLinked(!isLinked)} style={{ padding: '2px 4px', background: isLinked ? 'rgba(97, 85, 245, 0.3)' : 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '3px', color: isLinked ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '10px' }}>{isLinked ? '🔗' : '⛓️‍💥'}</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gridTemplateRows: 'auto auto auto', gap: '4px', alignItems: 'center', justifyItems: 'center' }}>
        <div style={{ gridColumn: '2', gridRow: '1' }}><NumberField value={values.top} onChange={(v) => handleChange('top', v)} placeholder="T" small /></div>
        <div style={{ gridColumn: '1', gridRow: '2' }}><NumberField value={values.left} onChange={(v) => handleChange('left', v)} placeholder="L" small /></div>
        <div style={{ gridColumn: '2', gridRow: '2', width: '24px', height: '24px', background: 'rgba(255, 165, 0, 0.2)', borderRadius: '4px', border: '1px solid rgba(255, 165, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)' }}>M</span></div>
        <div style={{ gridColumn: '3', gridRow: '2' }}><NumberField value={values.right} onChange={(v) => handleChange('right', v)} placeholder="R" small /></div>
        <div style={{ gridColumn: '2', gridRow: '3' }}><NumberField value={values.bottom} onChange={(v) => handleChange('bottom', v)} placeholder="B" small /></div>
      </div>
      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
        <select value={values.unit} onChange={(e) => handleUnitChange(e.target.value)} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '3px', color: 'rgba(255,255,255,0.5)', fontSize: '9px', cursor: 'pointer', outline: 'none' }}>
          <option value="px">px</option>
          <option value="rem">rem</option>
          <option value="%">%</option>
          <option value="auto">auto</option>
        </select>
      </div>
    </div>
  );
}

