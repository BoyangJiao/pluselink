import { Pulselink } from 'pulselink';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

// GSAP 动画组件
function GSAPAnimation() {
  const boxRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // 动态加载 GSAP
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js';
    script.onload = () => {
      if (boxRef.current && (window as any).gsap) {
        (window as any).gsap.to(boxRef.current, {
          rotation: 360,
          duration: 3,
          repeat: -1,
          ease: 'power2.inOut',
        });
      }
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);
  
  return (
    <div
      ref={boxRef}
      style={{
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #22C55E, #16A34A)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '11px',
        fontWeight: 'bold',
      }}
    >
      GSAP
    </div>
  );
}

// CSS 动画样式
const cssAnimationStyles = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
  
  @keyframes slideIn {
    0% { transform: translateX(-20px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes colorShift {
    0% { background-color: #FF6B6B; }
    33% { background-color: #4ECDC4; }
    66% { background-color: #FFD93D; }
    100% { background-color: #FF6B6B; }
  }
  
  .css-pulse {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .css-slide {
    animation: slideIn 1.5s ease-out infinite;
  }
  
  .css-color {
    animation: colorShift 4s linear infinite;
  }
`;

function App() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Pulselink />
      
      <h1 style={{ color: '#333', marginBottom: '24px' }}>
        Pulselink Demo
      </h1>
      
      <p style={{ color: '#666', marginBottom: '32px' }}>
        Click the ⚡ button in the bottom-right corner to open Pulselink.
        Then click any element to inspect and edit it.
      </p>

      {/* Demo Components */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#333', marginBottom: '16px' }}>Buttons</h2>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button style={{
            padding: '10px 20px',
            background: '#6155F5',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
          }}>
            Primary Button
          </button>
          <button style={{
            padding: '10px 20px',
            background: '#fff',
            color: '#6155F5',
            border: '2px solid #6155F5',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
          }}>
            Secondary Button
          </button>
          <button style={{
            padding: '10px 20px',
            background: '#f0f0f0',
            color: '#333',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer',
          }}>
            Ghost Button
          </button>
        </div>
      </section>

      {/* Framer Motion Section */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#333', marginBottom: '16px' }}>Framer Motion Animations</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '12px 24px',
              background: '#FF6B6B',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Hover Scale
          </motion.button>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{
              width: '50px',
              height: '50px',
              background: '#4ECDC4',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '12px',
            }}
          >
            Spin
          </motion.div>
          
          <motion.div
            animate={{ 
              y: [0, -20, 0],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            style={{
              padding: '12px 24px',
              background: '#95E1D3',
              color: '#333',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            Bounce
          </motion.div>
          
          <motion.div
            whileHover={{ 
              scale: 1.1,
              rotate: 5,
              backgroundColor: '#A8E6CF'
            }}
            transition={{ type: 'spring', stiffness: 300 }}
            style={{
              padding: '12px 24px',
              background: '#FFD93D',
              color: '#333',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Spring Hover
          </motion.div>
        </div>
      </section>

      {/* CSS Animations Section */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#333', marginBottom: '16px' }}>CSS Animations</h2>
        <style>{cssAnimationStyles}</style>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div
            className="css-pulse"
            style={{
              padding: '12px 24px',
              background: '#FF6B6B',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            Pulse
          </div>
          
          <div
            className="css-slide"
            style={{
              padding: '12px 24px',
              background: '#4ECDC4',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            Slide In
          </div>
          
          <div
            className="css-color"
            style={{
              padding: '12px 24px',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          >
            Color Shift
          </div>
        </div>
      </section>

      {/* GSAP Animation Section */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#333', marginBottom: '16px' }}>GSAP Animation</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <GSAPAnimation />
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ color: '#333', marginBottom: '16px' }}>Cards</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}>
          <div style={{
            padding: '20px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ margin: '0 0 8px', color: '#333' }}>Card Title</h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              This is a card component that you can inspect and edit.
            </p>
          </div>
          <div style={{
            padding: '20px',
            background: 'linear-gradient(135deg, #6155F5, #8B5CF6)',
            borderRadius: '12px',
            color: '#fff',
          }}>
            <h3 style={{ margin: '0 0 8px' }}>Gradient Card</h3>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
              This card has a gradient background.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 style={{ color: '#333', marginBottom: '16px' }}>Form Elements</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px' }}>
          <input
            type="text"
            placeholder="Text input"
            style={{
              padding: '10px 14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
            }}
          />
          <select
            style={{
              padding: '10px 14px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              background: '#fff',
            }}
          >
            <option>Select an option</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </div>
      </section>
    </div>
  );
}

export default App;
