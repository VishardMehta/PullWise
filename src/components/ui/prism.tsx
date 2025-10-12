import { useEffect, useRef } from 'react';

interface PrismProps {
  animationType?: 'rotate' | 'wave' | 'pulse';
  timeScale?: number;
  height?: number;
  baseWidth?: number;
  scale?: number;
  hueShift?: number;
  colorFrequency?: number;
  noise?: number;
  glow?: number;
}

export default function Prism({
  animationType = 'rotate',
  timeScale = 0.5,
  height = 3.5,
  baseWidth = 5.5,
  scale = 3.6,
  hueShift = 0,
  colorFrequency = 1,
  noise = 0.5,
  glow = 1,
}: PrismProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    let time = 0;

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, w, h);

      time += 0.01 * timeScale;

      const centerX = w / 2;
      const centerY = h / 2;

      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const radius = 100 + Math.sin(time + i * 0.2) * 50;

        let x = centerX + Math.cos(angle + time * 0.5) * radius;
        let y = centerY + Math.sin(angle + time * 0.5) * radius;

        if (animationType === 'wave') {
          y += Math.sin(time * 2 + i * 0.5) * 30;
        } else if (animationType === 'pulse') {
          const pulse = Math.sin(time * 3) * 0.5 + 0.5;
          x = centerX + Math.cos(angle) * (radius * pulse);
          y = centerY + Math.sin(angle) * (radius * pulse);
        }

        const hue = (i * (360 / 50) * colorFrequency + time * 50 + hueShift) % 360;
        const saturation = 70 + Math.sin(time + i) * 30;
        const lightness = 50 + Math.sin(time * 0.5 + i) * 20;

        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
        ctx.shadowBlur = 20 * glow;
        ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;

        const size = 5 + Math.sin(time * 2 + i) * 3;
        ctx.beginPath();
        ctx.arc(x, y, size * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animationType, timeScale, height, baseWidth, scale, hueShift, colorFrequency, noise, glow]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: '#000000',
      }}
    />
  );
}
