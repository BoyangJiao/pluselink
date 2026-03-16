// =============================================================================
// Shared Number Field Component
// =============================================================================

import { useState, useEffect, useRef } from 'react';

interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  small?: boolean;
  unit?: string;
}

/**
 * 数字输入组件
 * - 允许删除"0"，空值显示"0"
 * - 新数字替换首位"0"
 * - 支持键盘 Enter 确认
 */
export function NumberField({
  value,
  onChange,
  placeholder = '0',
  min,
  max,
  disabled = false,
  small = false,
  unit,
}: NumberFieldProps) {
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
    inputRef.current?.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    if (displayValue === '' || displayValue === '-') {
      setDisplayValue('0');
      onChange(0);
    } else {
      let num = parseInt(displayValue, 10);
      
      if (isNaN(num)) {
        setDisplayValue(String(value));
        return;
      }
      
      // 应用范围限制
      if (min !== undefined) num = Math.max(min, num);
      if (max !== undefined) num = Math.min(max, num);
      
      setDisplayValue(String(num));
      onChange(num);
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
    
    // 上下箭头调整值
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newValue = value + 1;
      if (max === undefined || newValue <= max) {
        onChange(newValue);
        setDisplayValue(String(newValue));
      }
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newValue = value - 1;
      if (min === undefined || newValue >= min) {
        onChange(newValue);
        setDisplayValue(String(newValue));
      }
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        style={{
          width: small ? '50px' : '70px',
          padding: '4px 8px',
          background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '4px',
          color: disabled ? 'rgba(255,255,255,0.4)' : '#fff',
          fontSize: '12px',
          fontFamily: 'monospace',
          outline: 'none',
          textAlign: unit ? 'right' : 'left',
        }}
      />
      {unit && (
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
          {unit}
        </span>
      )}
    </div>
  );
}
