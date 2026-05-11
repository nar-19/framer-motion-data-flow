import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css'; // For general styling

// Helper to generate a unique ID
let particleId = 0;

// Reusable sound context (to avoid creating multiple contexts)
let audioContext = null;
const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
};

// Node data structure
const nodes = [
    { id: 'data-source', name: 'Data Source', position: { x: 150, y: 300 } },
    { id: 'processing-engine', name: 'Processing Engine', position: { x: 500, y: 300 } },
    { id: 'customer-insight', name: 'Customer Insight', position: { x: 850, y: 300 } },
];

// Define paths for particles to follow.
// M: Move to, C: Cubic Bezier Curve (start, control1, control2, end)
const paths = {
    'data-source-to-processing-engine': {
        d: `M ${nodes[0].position.x + 50} ${nodes[0].position.y} C ${nodes[0].position.x + 150} ${nodes[0].position.y - 100}, ${nodes[1].position.x - 150} ${nodes[1].position.y - 100}, ${nodes[1].position.x - 50} ${nodes[1].position.y}`,
        source: 'data-source',
        target: 'processing-engine',
    },
    'processing-engine-to-customer-insight': {
        d: `M ${nodes[1].position.x + 50} ${nodes[1].position.y} C ${nodes[1].position.x + 150} ${nodes[1].position.y + 100}, ${nodes[2].position.x - 150} ${nodes[2].position.y + 100}, ${nodes[2].position.x - 50} ${nodes[2].position.y}`,
        source: 'processing-engine',
        target: 'customer-insight',
    },
};

// --- Sound Effect Function ---
const playPopSound = () => {
    try {
        const context = getAudioContext();
        if (!context) return; // AudioContext might not be available

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, context.currentTime); // Higher frequency for a pop

        gainNode.gain.setValueAtTime(0.5, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1); // Quick fade out

        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
    } catch (e) {
        console.warn("Web Audio API not supported or failed to play sound:", e);
    }
};

const Canvas = () => {
    const [particles, setParticles] = useState([]);
    const [lineGlowStates, setLineGlowStates] = useState({}); // { 'path-id': boolean }
    const [isStepByStepMode, setIsStepByStepMode] = useState(false);
    const [currentStep, setCurrentStep] = useState(0); // 0: Data Source, 1: Processing, 2: Customer Insight
    const [isPresenterModeUIVisible, setIsPresenterModeUIVisible] = useState(true);
    const pathRefs = useRef({}); // To store references to SVG path elements

    const generateParticles = useCallback((sourceNodeId, targetNodeId, pathKey) => {
        const numParticles = 10;
        const newParticles = Array.from({ length: numParticles }).map(() => ({
            id: particleId++,
            sourceNodeId,
            targetNodeId,
            pathKey,
            delay: Math.random() * 0.5, // Stagger particle appearance
        }));

        setParticles(prev => [...prev, ...newParticles]);

        // Activate line glow
        setLineGlowStates(prev => ({ ...prev, [pathKey]: true }));

        // Deactivate line glow after animation finishes
        setTimeout(() => {
            setLineGlowStates(prev => ({ ...prev, [pathKey]: false }));
        }, 2000); // Match particle animation duration
    }, []);

    const handleClickNode = useCallback((nodeId) => {
        if (isStepByStepMode) return; // Don't allow click in step-by-step mode

        let pathKeyToAnimate = null;
        switch (nodeId) {
            case 'data-source':
                pathKeyToAnimate = 'data-source-to-processing-engine';
                break;
            case 'processing-engine':
                pathKeyToAnimate = 'processing-engine-to-customer-insight';
                break;
            default:
                break;
        }

        if (pathKeyToAnimate) {
            generateParticles(nodes.find(n => n.id === paths[pathKeyToAnimate].source).id,
                              nodes.find(n => n.id === paths[pathKeyToAnimate].target).id,
                              pathKeyToAnimate);
        }
    }, [generateParticles, isStepByStepMode]);

    // --- Step-by-Step Mode Logic ---
    useEffect(() => {
        const handleSpacebar = (event) => {
            if (event.code === 'Space' && isStepByStepMode) {
                event.preventDefault(); // Prevent scrolling
                const nextStep = (currentStep + 1) % nodes.length;
                setCurrentStep(nextStep);

                let pathKeyToAnimate = null;
                if (nextStep === 1) { // From Data Source to Processing Engine
                    pathKeyToAnimate = 'data-source-to-processing-engine';
                } else if (nextStep === 2) { // From Processing Engine to Customer Insight
                    pathKeyToAnimate = 'processing-engine-to-customer-insight';
                } else { // Reset or back to first node if it loops
                    // In a linear flow, we might reset, or just stop at the last node.
                    // For this example, let's just trigger the animation for the *previous* node
                    // which just became active after the step increment.
                    // For example: if currentStep was 0, nextStep is 1. We want to animate FROM node[0] TO node[1]
                    // If currentStep was 1, nextStep is 2. Animate FROM node[1] TO node[2]
                    // If currentStep was 2, nextStep is 0. This implies reset or restart.
                    // Let's adjust the logic slightly:
                    // If we're at step 0 (Data Source), pressing spacebar moves us to step 1 (Processing Engine)
                    // and triggers flow from Data Source to Processing Engine.
                    // If we're at step 1 (Processing Engine), pressing spacebar moves us to step 2 (Customer Insight)
                    // and triggers flow from Processing Engine to Customer Insight.
                    // If we're at step 2 (Customer Insight), pressing spacebar cycles back to step 0, but doesn't trigger flow.
                    // The 'focus' will be on Data Source.

                    if (currentStep === 0) { // Moving to Processing Engine
                        pathKeyToAnimate = 'data-source-to-processing-engine';
                    } else if (currentStep === 1) { // Moving to Customer Insight
                        pathKeyToAnimate = 'processing-engine-to-customer-insight';
                    }
                }

                if (pathKeyToAnimate) {
                    generateParticles(paths[pathKeyToAnimate].source, paths[pathKeyToAnimate].target, pathKeyToAnimate);
                }
            }
        };

        window.addEventListener('keydown', handleSpacebar);
        return () => window.removeEventListener('keydown', handleSpacebar);
    }, [isStepByStepMode, currentStep, generateParticles]);

    const toggleStepByStepMode = () => {
        setIsStepByStepMode(prev => {
            if (prev) { // If turning off, reset current step and clear particles
                setCurrentStep(0);
                setParticles([]);
                setLineGlowStates({});
            }
            return !prev;
        });
    };

    const resetCanvas = useCallback(() => {
        setParticles([]);
        setLineGlowStates({});
        setCurrentStep(0);
    }, []);

    // --- Presenter Mode UI Visibility ---
    useEffect(() => {
        let mouseMoveTimeout;
        const handleMouseMove = () => {
            setIsPresenterModeUIVisible(true);
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(() => {
                setIsPresenterModeUIVisible(false);
            }, 3000); // Hide after 3 seconds of inactivity
        };

        window.addEventListener('mousemove', handleMouseMove);
        // Initial hide after some time if no movement
        mouseMoveTimeout = setTimeout(() => setIsPresenterModeUIVisible(false), 3000);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(mouseMoveTimeout);
        };
    }, []);

    return (
        <div className="canvas-container">
            {/* Grid Background */}
            <div className="grid-background" />

            {/* SVG paths for connectors */}
            <svg className="connector-svg">
                <defs>
                    <filter id="neon-glow">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                        <feFlood floodColor="currentColor" floodOpacity="1" result="color" />
                        <feComposite in="color" in2="blur" operator="in" result="glow" />
                        <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {Object.entries(paths).map(([key, pathData]) => (
                    <motion.path
                        key={key}
                        d={pathData.d}
                        ref={(el) => (pathRefs.current[key] = el)}
                        className={`connector-path ${lineGlowStates[key] ? 'glowing' : ''}`}
                        initial={{ pathLength: 0 }} // Framer Motion SVG path animation example, though we don't animate pathLength here for the path itself.
                        // The glow is managed by CSS classes.
                    />
                ))}
            </svg>

            {/* Nodes */}
            {nodes.map((node, index) => (
                <motion.div
                    key={node.id}
                    className={`node ${isStepByStepMode && currentStep === index ? 'active-node' : ''}`}
                    style={{ left: node.position.x, top: node.position.y }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleClickNode(node.id)}
                    transition={{ type: "spring", stiffness: 300, damping: 10, mass: 0.5 }}
                >
                    {node.name}
                </motion.div>
            ))}

            {/* Particles */}
            <AnimatePresence>
                {particles.map(particle => {
                    const pathEl = pathRefs.current[particle.pathKey];
                    if (!pathEl) return null; // Path might not be rendered yet

                    const pathLength = pathEl.getTotalLength();

                    return (
                        <motion.div
                            key={particle.id}
                            className="particle"
                            initial={{ x: nodes.find(n => n.id === particle.sourceNodeId).position.x, y: nodes.find(n => n.id === particle.sourceNodeId).position.y, opacity: 0, scale: 0 }}
                            animate={i => ({
                                pathOffset: 0, // Not directly using pathOffset here, but animating progress
                                x: [nodes.find(n => n.id === particle.sourceNodeId).position.x, pathEl.getPointAtLength(pathLength).x],
                                y: [nodes.find(n => n.id === particle.sourceNodeId).position.y, pathEl.getPointAtLength(pathLength).y],
                                opacity: [0, 1, 1, 0],
                                scale: [0, 1, 1, 0],
                                transition: {
                                    duration: 1.5,
                                    delay: particle.delay + i * 0.05, // Stagger particles
                                    ease: "easeOut",
                                    onUpdate: latest => {
                                        // Custom onUpdate to follow the path
                                        const progress = latest.pathOffset !== undefined ? latest.pathOffset : (latest.x / pathEl.getPointAtLength(pathLength).x); // Fallback if pathOffset not directly passed

                                        const currentPoint = pathEl.getPointAtLength(pathLength * progress);
                                        return { x: currentPoint.x, y: currentPoint.y };
                                    },
                                    onComplete: () => {
                                        // Play sound when particle reaches target node
                                        playPopSound();
                                        setParticles(prev => prev.filter(p => p.id !== particle.id)); // Remove particle after animation
                                    }
                                }
                            })}
                            exit={{ opacity: 0, scale: 0, transition: { duration: 0.3 } }}
                            // The actual path following will be done by animating a `progress` value
                            // and using getPointAtLength() in `onUpdate`
                            variants={{
                                move: (i) => ({
                                    x: pathLength, // Animate `x` as a proxy for path progress
                                    opacity: [0, 1, 1, 0],
                                    scale: [0.5, 1, 1, 0.5],
                                    transition: {
                                        duration: 1.5,
                                        delay: particle.delay + i * 0.05,
                                        ease: "easeOut",
                                        onUpdate: (latest) => {
                                            if (pathEl) {
                                                const progress = latest.x / pathLength; // Normalize x back to 0-1 progress
                                                const point = pathEl.getPointAtLength(progress * pathLength);
                                                // We need to return actual x,y, not just progress
                                                return { x: point.x, y: point.y };
                                            }
                                        },
                                        onComplete: () => {
                                            playPopSound();
                                            setParticles(prev => prev.filter(p => p.id !== particle.id));
                                        }
                                    }
                                })
                            }}
                            animate="move"
                            custom={particle.id} // Custom prop for staggered delay, adjust if needed.
                        >
                            <motion.div
                                className="particle-core"
                                animate={{
                                    boxShadow: ["0 0 5px #ff00ff", "0 0 10px #00ffff", "0 0 5px #ff00ff"],
                                }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "easeInOut",
                                }}
                            />
                        </motion.div>
                    );
                })}
            </AnimatePresence>


            {/* Presenter Mode UI */}
            <AnimatePresence>
                {isPresenterModeUIVisible && (
                    <motion.div
                        className="ui-controls"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <button onClick={toggleStepByStepMode} className={isStepByStepMode ? 'active' : ''}>
                            {isStepByStepMode ? 'Exit Step-by-Step' : 'Enter Step-by-Step'}
                        </button>
                        <button onClick={resetCanvas}>Reset All</button>
                        {isStepByStepMode && (
                            <div className="step-indicator">
                                Press <span className="key-hint">Spacebar</span> for next step ({nodes[currentStep].name} focused)
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Canvas;
