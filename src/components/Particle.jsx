// src/components/Particle.jsx
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

const Particle = ({ pathD, color, particleId, onComplete }) => {
  const pathRef = useRef(null);
  const progress = useMotionValue(0); // 0 to 1, representing completion along the path

  // Create a hidden SVG path element to measure its length and points
  // This is a common technique when animating along a path with useTransform
  useEffect(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position:absolute; visibility:hidden; width:0; height:0;');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathD);
    svg.appendChild(path);
    document.body.appendChild(svg); // Append to body to make it part of DOM for measurement
    pathRef.current = path;

    const totalLength = path.getTotalLength();

    const unsubscribeX = useTransform(progress, (p) => {
      const point = pathRef.current.getPointAtLength(p * totalLength);
      return point.x;
    }).onChange((v) => x.set(v));

    const unsubscribeY = useTransform(progress, (p) => {
      const point = pathRef.current.getPointAtLength(p * totalLength);
      return point.y;
    }).onChange((v) => y.set(v));

    const animation = animate(progress, 1, {
      duration: 2, // Particle travel duration
      ease: 'linear',
      onComplete: () => {
        onComplete(particleId); // Notify parent when animation is done
        progress.clearListeners(); // Clean up listeners
        unsubscribeX();
        unsubscribeY();
      },
    });

    return () => {
      animation.stop();
      progress.clearListeners();
      unsubscribeX();
      unsubscribeY();
      if (svg && svg.parentNode) {
        svg.parentNode.removeChild(svg); // Clean up the hidden SVG
      }
    };
  }, [pathD, particleId, onComplete]);

  // Framer Motion values for position
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // AnimatePresence exit animation
  const exitAnimation = {
    opacity: 0,
    scale: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  };

  return (
    <motion.div
      className="particle"
      style={{
        x,
        y,
        position: 'absolute',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
        zIndex: 20,
      }}
      exit={exitAnimation} // Apply exit animation for AnimatePresence
    />
  );
};

export default Particle;
