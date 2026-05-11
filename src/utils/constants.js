// src/utils/constants.js

// Define node positions and labels
export const NODES = [
  { id: 'data-source', label: 'Data Source', x: 200, y: 250, color: '#00F0FF' }, // Cyan
  { id: 'processing-engine', label: 'Processing Engine', x: 500, y: 150, color: '#FF00FF' }, // Magenta
  { id: 'customer-insight', label: 'Customer Insight', x: 800, y: 250, color: '#FFDD00' }, // Yellow
];

// Define SVG paths for connectors
// 'd' attribute defines the path. M = moveto, C = cubic bezier curve
export const PATHS = [
  {
    id: 'path-1',
    from: 'data-source',
    to: 'processing-engine',
    d: 'M 200 250 C 300 100, 400 100, 500 150', // Data Source to Processing Engine
    color: '#00F0FF', // Cyan
  },
  {
    id: 'path-2',
    from: 'processing-engine',
    to: 'customer-insight',
    d: 'M 500 150 C 600 200, 700 200, 800 250', // Processing Engine to Customer Insight
    color: '#FF00FF', // Magenta
  },
];

// Map node IDs to their indices for step-by-step mode
export const NODE_ID_TO_INDEX = NODES.reduce((acc, node, index) => {
  acc[node.id] = index;
  return acc;
}, {});

// Mapping for step-by-step mode: [current_step_index]: path_to_flow_id
export const STEP_MAP = {
  0: 'path-1', // From Data Source to Processing Engine
  1: 'path-2', // From Processing Engine to Customer Insight
};
