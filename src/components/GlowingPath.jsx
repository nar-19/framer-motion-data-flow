// src/components/GlowingPath.jsx
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const GlowingPath = ({ id, d, color, isFlowing }) => {
  const [pathLength, setPathLength] = useState(0);
  const pathRef = useRef(null);

  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [d]);

  const pathVariants = {
    inactive: {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
      stroke: `${color}50`, // Subtle color when inactive
      filter: 'drop-shadow(0 0 0px transparent)',
    },
    active: {
      strokeDashoffset: 0, // Animates the dash from start
      stroke: color, // Full color when active
      filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 15px ${color}80)`,
      transition: {
        duration: 1.5, // How long the glow flows
        ease: 'linear',
        repeat: Infinity, // Keep glowing while active
        repeatType: 'reverse', // Pulsate the glow
        repeatDelay: 0.5,
      },
    },
  };

  return (
    <motion.path
      ref={pathRef}
      id={id}
      d={d}
      fill="none"
      strokeWidth="3"
      variants={pathVariants}
      initial="inactive"
      animate={isFlowing ? 'active' : 'inactive'}
      style={{
        // Ensure pathLength is available before animating strokeDashoffset
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      }}
    />
  );
};

export default GlowingPath;
