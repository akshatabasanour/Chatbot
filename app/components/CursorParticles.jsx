"use client";
import { useEffect } from 'react';
import './particles.css';

export default function CursorParticles() {
  useEffect(() => {
    let lastTime = 0;
    
    const handleMouseMove = (e) => {
      const now = Date.now();
      // Throttle to avoid creating too many divs (approx 1 per 25ms)
      if (now - lastTime < 25) return;
      lastTime = now;

      const particle = document.createElement('div');
      particle.className = 'diamond-particle';
      
      // Slightly randomize the size of diamonds for a sparkling effect
      const size = Math.random() * 8 + 4; 
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Align precisely with the mouse tip
      particle.style.left = `${e.clientX - size / 2}px`;
      particle.style.top = `${e.clientY - size / 2}px`;

      document.body.appendChild(particle);

      // Remove after CSS animation duration
      setTimeout(() => {
        if (document.body.contains(particle)) {
          particle.remove();
        }
      }, 700);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return null;
}
