import React, { useEffect, useRef } from 'react';

const FoodParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Food emoji particles
    const foodEmojis = ['🍕', '🍔', '🍟', '🌮', '🍜', '🍱', '🍣', '🥗'];
    const particles: Array<{
      x: number;
      y: number;
      speed: number;
      emoji: string;
      rotation: number;
      rotationSpeed: number;
      size: number;
    }> = [];

    // Create particles
    const createParticles = () => {
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 1,
          emoji: foodEmojis[Math.floor(Math.random() * foodEmojis.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2,
          size: 15 + Math.random() * 15
        });
      }
    };

    createParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        // Move particle
        particle.y += particle.speed;
        particle.rotation += particle.rotationSpeed;

        // Reset position if out of bounds
        if (particle.y > canvas.height) {
          particle.y = -20;
          particle.x = Math.random() * canvas.width;
        }

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.font = `${particle.size}px Arial`;
        ctx.fillText(particle.emoji, -particle.size/2, -particle.size/2);
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-20"
      style={{ zIndex: -1 }}
    />
  );
};

export default FoodParticles;
