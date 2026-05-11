// src/FlowCanvas.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { NODES, PATHS, STEP_MAP, NODE_ID_TO_INDEX } from './utils/constants';
import Node from './components/Node';
import Particle from './components/Particle';
import GlowingPath from './components/GlowingPath';
import { useAudio } from './hooks/useAudio'; // Import the audio hook

const FlowCanvas = () => {
  const [particles, setParticles] = useState([]);
  const [activeFlows, setActiveFlows] = useState({}); // { 'path-id': true }
  const [currentStep, setCurrentStep] = useState(-1); // -1: initial, 0: DS->PE, 1: PE->CI
  const [presenterMode, setPresenterMode] = useState(false); // UI hidden unless mouse moves
  const [showUI, setShowUI] = useState(true); // Internal state for UI visibility
  const mouseMoveTimeoutRef = useRef(null);
  const playSound = useAudio(); // Initialize the audio hook

  const PATH_MAP = PATHS.reduce((acc, path) => {
    acc[path.id] = path;
    return acc;
  }, {});

  // Handles clicking a node
  const handleNodeClick = useCallback(
    (nodeId) => {
      // Find the path that *starts* from this node
      const path = PATHS.find((p) => p.from === nodeId);
      if (path) {
        // Trigger particle flow
        const newParticle = {
          id: `particle-${Date.now()}-${Math.random()}`,
          pathD: path.d,
          color: path.color,
        };
        setParticles((prev) => [...prev, newParticle]);

        // Activate glowing path
        setActiveFlows((prev) => ({ ...prev, [path.id]: true }));
      }
    },
    [PATHS],
  );

  // Handles particle animation completion
  const handleParticleComplete = useCallback(
    (particleId) => {
      setParticles((prev) => prev.filter((p) => p.id !== particleId));

      // Determine which path this particle was associated with
      // This is a bit indirect, but we can guess based on the pathD of the particle
      const completedParticle = particles.find((p) => p.id === particleId);
      if (completedParticle) {
        const path = PATHS.find((p) => p.d === completedParticle.pathD);
        if (path) {
          // Play sound when particle reaches a node
          playSound();
          // Deactivate glow after a short delay (or keep it glowing for a bit)
          setTimeout(() => {
            setActiveFlows((prev) => {
              const newState = { ...prev };
              delete newState[path.id];
              return newState;
            });
          }, 500); // Glow remains for 0.5s after particle disappears
        }
      }
    },
    [particles, PATHS, playSound],
  );

  // Reset button functionality
  const handleReset = useCallback(() => {
    setParticles([]);
    setActiveFlows({});
    setCurrentStep(-1);
  }, []);

  // Keyboard controls for step-by-step mode
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent default scroll behavior
        if (!presenterMode) {
          // If not in presenter mode, toggle it off to show buttons, then proceed
          setPresenterMode(false);
          setShowUI(true);
        }

        const nextStep = currentStep + 1;
        if (STEP_MAP[nextStep]) {
          const pathIdToTrigger = STEP_MAP[nextStep];
          const path = PATH_MAP[pathIdToTrigger];
          if (path) {
            handleNodeClick(path.from); // Trigger flow from the source node of the path
          }
          setCurrentStep(nextStep);
        } else {
          // Reset if all steps completed
          handleReset();
        }
      }
      if (event.code === 'KeyP') {
        setPresenterMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, handleNodeClick, handleReset, PATH_MAP, presenterMode]);

  // Mouse move for Presenter Mode
  useEffect(() => {
    const handleMouseMove = () => {
      if (presenterMode) {
        setShowUI(true);
        clearTimeout(mouseMoveTimeoutRef.current);
        mouseMoveTimeoutRef.current = setTimeout(() => {
          setShowUI(false);
        }, 2000); // Hide UI after 2 seconds of inactivity
      } else {
        setShowUI(true); // Always show UI if not in presenter mode
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(mouseMoveTimeoutRef.current);
    };
  }, [presenterMode]);

  // Determine which node is "active" in step-by-step mode
  const getActiveNodeForStep = (step) => {
    if (step === -1) return null; // No active node initially
    if (step === 0) return NODES[NODE_ID_TO_INDEX['data-source']].id; // Data Source
    if (step === 1) return NODES[NODE_ID_TO_INDEX['processing-engine']].id; // Processing Engine
    if (step === 2) return NODES[NODE_ID_TO_INDEX['customer-insight']].id; // Customer Insight
    return null;
  };

  const activeNodeId = getActiveNodeForStep(currentStep);

  return (
    <div
      style={{
        position: 'relative',
        width: '1000px', // Canvas width
        height: '600px', // Canvas height
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden', // Contain any overflow from particles
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1000 600"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {PATHS.map((path) => (
          <GlowingPath
            key={path.id}
            id={path.id}
            d={path.d}
            color={path.color}
            isFlowing={!!activeFlows[path.id]}
          />
        ))}
      </svg>

      {NODES.map((node) => (
        <Node
          key={node.id}
          id={node.id}
          label={node.label}
          x={node.x}
          y={node.y}
          color={node.color}
          onClick={handleNodeClick}
          isActive={node.id === activeNodeId}
        />
      ))}

      <AnimatePresence>
        {particles.map((particle) => (
          <Particle
            key={particle.id}
            particleId={particle.id}
            pathD={particle.pathD}
            color={particle.color}
            onComplete={handleParticleComplete}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '15px',
              zIndex: 30,
            }}
          >
            <button onClick={handleReset}>Reset</button>
            <button onClick={() => setPresenterMode((prev) => !prev)}>
              {presenterMode ? 'Exit Presenter Mode (P)' : 'Enter Presenter Mode (P)'}
            </button>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '8px 15px',
                borderRadius: '5px',
                fontSize: '0.9em',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#e0e0e0',
                backdropFilter: 'blur(5px)',
                WebkitBackdropFilter: 'blur(5px)',
              }}
            >
              Press <kbd style={{ padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.3)' }}>Space</kbd> for Next Step
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlowCanvas;
