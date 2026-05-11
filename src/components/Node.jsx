// src/components/Node.jsx
import { motion } from 'framer-motion';

const Node = ({ id, label, x, y, color, onClick, isActive }) => {
  const nodeVariants = {
    initial: { scale: 1, boxShadow: `0 0 10px ${color}80` },
    hover: { scale: 1.1, boxShadow: `0 0 20px ${color}FF`, transition: { type: 'spring', stiffness: 300, damping: 10 } },
    tap: { scale: 0.95, boxShadow: `0 0 5px ${color}60`, transition: { type: 'spring', stiffness: 500, damping: 20 } },
    active: { scale: 1.15, boxShadow: `0 0 30px ${color}FF`, transition: { type: 'spring', stiffness: 300, damping: 8 } },
  };

  return (
    <motion.div
      id={id}
      className="node"
      variants={nodeVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      animate={isActive ? 'active' : 'initial'}
      onClick={() => onClick(id)}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        backgroundColor: `${color}30`, // Semi-transparent based on node color
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '1.1em',
        textAlign: 'center',
        textShadow: `0 0 5px ${color}`,
        color: color,
        zIndex: 10,
        border: `2px solid ${color}80`,
      }}
    >
      {label}
    </motion.div>
  );
};

export default Node;
