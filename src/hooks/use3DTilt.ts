import { useState, useRef, useCallback } from 'react';

interface TiltState {
  rotateX: number;
  rotateY: number;
  scale: number;
  glareX: number;
  glareY: number;
}

interface Use3DTiltOptions {
  maxTilt?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
}

export function use3DTilt(options: Use3DTiltOptions = {}) {
  const { 
    maxTilt = 15, 
    scale = 1.05, 
    speed = 400,
    glare = true 
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [tiltState, setTiltState] = useState<TiltState>({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    glareX: 50,
    glareY: 50,
  });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateX = (mouseY / (rect.height / 2)) * -maxTilt;
    const rotateY = (mouseX / (rect.width / 2)) * maxTilt;
    
    // Glare position (0-100)
    const glareX = ((e.clientX - rect.left) / rect.width) * 100;
    const glareY = ((e.clientY - rect.top) / rect.height) * 100;

    setTiltState({
      rotateX,
      rotateY,
      scale,
      glareX,
      glareY,
    });
  }, [maxTilt, scale]);

  const handleMouseLeave = useCallback(() => {
    setTiltState({
      rotateX: 0,
      rotateY: 0,
      scale: 1,
      glareX: 50,
      glareY: 50,
    });
  }, []);

  const tiltStyle: React.CSSProperties = {
    transform: `perspective(1000px) rotateX(${tiltState.rotateX}deg) rotateY(${tiltState.rotateY}deg) scale(${tiltState.scale})`,
    transition: `transform ${speed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
    transformStyle: 'preserve-3d',
  };

  const glareStyle: React.CSSProperties = glare ? {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 'inherit',
    background: `radial-gradient(circle at ${tiltState.glareX}% ${tiltState.glareY}%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
    opacity: tiltState.scale > 1 ? 1 : 0,
    transition: `opacity ${speed}ms ease`,
    pointerEvents: 'none',
    zIndex: 10,
  } : {};

  return {
    ref,
    tiltStyle,
    glareStyle,
    handlers: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
    },
  };
}
