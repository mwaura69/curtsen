import { motion } from "motion/react";
import { Network, Zap, Target, Layers } from "lucide-react";

const NODES = [
  { id: "cbd", x: 200, y: 250, label: "CBD (Hub)", type: "hub" },
  { id: "westlands", x: 100, y: 150, label: "Westlands", type: "stage" },
  { id: "ngong", x: 50, y: 350, label: "Ngong", type: "stage" },
  { id: "rongai", x: 120, y: 450, label: "Rongai", type: "stage" },
  { id: "airport", x: 350, y: 400, label: "JKIA", type: "hub" },
  { id: "kasarani", x: 300, y: 100, label: "Kasarani", type: "stage" },
  { id: "donny", x: 350, y: 280, label: "Donholm", type: "stage" },
  { id: "lavi", x: 80, y: 220, label: "Lavington", type: "stage" },
];

const EDGES = [
  { from: "cbd", to: "westlands", weight: 0.8 },
  { from: "cbd", to: "donny", weight: 0.5 },
  { from: "cbd", to: "rongai", weight: 0.3 },
  { from: "cbd", to: "kasarani", weight: 0.7 },
  { from: "westlands", to: "lavi", weight: 0.9 },
  { from: "ngong", to: "cbd", weight: 0.4 },
  { from: "cbd", to: "airport", weight: 0.6 },
];

export default function MobilityGraph() {
  return (
    <div className="hidden lg:flex flex-col h-full bg-brand-surface border-l border-white/5 w-96 overflow-hidden">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold text-lg tracking-tight">Mobility Graph</h3>
          <Network className="w-5 h-5 text-brand-purple" />
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-text font-mono">Real-time Node Traversal</p>
      </div>

      <div className="flex-1 relative bg-black/40 overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(#2563EB 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />
        </div>

        <svg className="w-full h-full" viewBox="0 0 400 500">
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orientation="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L9,3 z" fill="rgba(139, 92, 246, 0.3)" />
            </marker>
          </defs>

          {/* Edges */}
          {EDGES.map((edge, i) => {
            const fromNode = NODES.find(n => n.id === edge.from)!;
            const toNode = NODES.find(n => n.id === edge.to)!;
            return (
              <motion.line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={edge.weight > 0.6 ? "rgba(34, 197, 94, 0.2)" : "rgba(37, 99, 235, 0.2)"}
                strokeWidth={1}
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: i * 0.2 }}
              />
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => (
            <g key={node.id}>
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.type === "hub" ? 12 : 8}
                fill={node.type === "hub" ? "rgba(139, 92, 246, 0.2)" : "rgba(37, 99, 235, 0.2)"}
                stroke={node.type === "hub" ? "#8B5CF6" : "#2563EB"}
                strokeWidth={2}
                whileHover={{ scale: 1.2, r: 15 }}
                className="cursor-pointer"
              />
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={node.type === "hub" ? 20 : 15}
                stroke={node.type === "hub" ? "#8B5CF6" : "#2563EB"}
                strokeWidth={1}
                initial={{ opacity: 0.1, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                className="pointer-events-none"
              />
              <text
                x={node.x}
                y={node.y + 25}
                textAnchor="middle"
                className="text-[9px] fill-muted-text font-mono font-bold uppercase pointer-events-none"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>

        {/* Pulse Overlay */}
        <div className="absolute bottom-6 left-6 right-6 p-4 bg-brand-surface/80 border border-white/5 rounded-xl backdrop-blur-sm animate-pulse-slow">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-green/20 rounded-lg">
               <Zap className="w-4 h-4 text-brand-green" />
             </div>
             <div>
               <p className="text-[10px] text-white font-bold leading-none mb-1 uppercase tracking-tight">Active Pulse Detected</p>
               <p className="text-[9px] text-muted-text font-mono">Inference accuracy: 0.942 on Outer Ring corridor</p>
             </div>
           </div>
        </div>
      </div>

      <div className="p-6 bg-black/20 space-y-4">
        <div className="flex items-center justify-between">
           <span className="text-[10px] font-mono text-muted-text uppercase">Legend</span>
           <Layers className="w-3 h-3 text-muted-text" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-purple" />
            <span className="text-[9px] text-muted-text uppercase font-mono tracking-tighter">Transit Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-blue" />
            <span className="text-[9px] text-muted-text uppercase font-mono tracking-tighter">Route Node</span>
          </div>
          <div className="flex items-center gap-2">
             <Target className="w-3 h-3 text-brand-green opacity-50" />
            <span className="text-[9px] text-muted-text uppercase font-mono tracking-tighter">Sync Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
