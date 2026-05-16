import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Network, Zap, Target, Layers, Activity, Eye, Cpu } from "lucide-react";
import { cn } from "../lib/utils";

const NODES = [
  { id: "cbd", x: 200, y: 250, label: "CBD (Hub)", type: "hub", density: 0.9 },
  { id: "westlands", x: 100, y: 150, label: "Westlands", type: "stage", density: 0.7 },
  { id: "ngong", x: 50, y: 350, label: "Ngong", type: "stage", density: 0.4 },
  { id: "rongai", x: 120, y: 450, label: "Rongai", type: "stage", density: 0.6 },
  { id: "airport", x: 350, y: 400, label: "JKIA", type: "hub", density: 0.5 },
  { id: "kasarani", x: 300, y: 100, label: "Kasarani", type: "stage", density: 0.8 },
  { id: "donny", x: 350, y: 280, label: "Donholm", type: "stage", density: 0.75 },
  { id: "lavi", x: 80, y: 220, label: "Lavington", type: "stage", density: 0.3 },
  { id: "pangani", x: 280, y: 180, label: "Pangani", type: "stage", density: 0.85 },
  { id: "ruai", x: 380, y: 150, label: "Ruai", type: "stage", density: 0.45 },
];

const EDGES = [
  { from: "cbd", to: "westlands", weight: 0.8, status: "stable" },
  { from: "cbd", to: "donny", weight: 0.5, status: "congested" },
  { from: "cbd", to: "rongai", weight: 0.3, status: "critical" },
  { from: "cbd", to: "kasarani", weight: 0.7, status: "stable" },
  { from: "westlands", to: "lavi", weight: 0.9, status: "stable" },
  { from: "ngong", to: "cbd", weight: 0.4, status: "moderate" },
  { from: "cbd", to: "airport", weight: 0.6, status: "stable" },
  { from: "pangani", to: "kasarani", weight: 0.8, status: "congested" },
  { from: "donny", to: "ruai", weight: 0.5, status: "stable" },
];

export default function MobilityGraph() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<"density" | "traffic" | "sync">("traffic");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable": return "rgba(34, 197, 94, 0.4)";
      case "moderate": return "rgba(245, 158, 11, 0.4)";
      case "congested": return "rgba(239, 68, 68, 0.4)";
      case "critical": return "rgba(239, 68, 68, 0.8)";
      default: return "rgba(37, 99, 235, 0.4)";
    }
  };

  return (
    <div className="hidden xl:flex flex-col h-full bg-brand-surface border-l border-white/5 w-[420px] overflow-hidden shadow-2xl relative">
      {/* Background Grid Hud */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
             <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="p-8 border-b border-white/5 z-10 bg-brand-surface/40 backdrop-blur-md relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-xl tracking-tight text-white glow-text-blue">Mobility Graph</h3>
            <p className="text-[10px] uppercase tracking-widest text-brand-blue font-mono font-bold">Nairobi Core Node v9.2</p>
          </div>
          <div className="p-2.5 bg-brand-blue/10 border border-brand-blue/30 rounded-xl">
             <Network className="w-5 h-5 text-brand-blue" />
          </div>
        </div>

        <div className="flex gap-2">
           {["traffic", "density", "sync"].map((layer) => (
             <button
               key={layer}
               onClick={() => setActiveLayer(layer as any)}
               className={cn(
                 "flex-1 py-1.5 px-2 rounded-md text-[9px] font-mono font-bold uppercase transition-all border",
                 activeLayer === layer 
                   ? "bg-brand-blue/20 border-brand-blue text-brand-blue shadow-[0_0_10px_rgba(37,99,235,0.2)]" 
                   : "bg-white/5 border-transparent text-muted-text hover:bg-white/10"
               )}
             >
               {layer}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-black/40 z-10 group">
        <svg className="w-full h-full cursor-crosshair" viewBox="0 0 400 500">
          <defs>
            <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Edges */}
          {EDGES.map((edge, i) => {
            const fromNode = NODES.find(n => n.id === edge.from)!;
            const toNode = NODES.find(n => n.id === edge.to)!;
            const isHighlighted = selectedNode === edge.from || selectedNode === edge.to;
            
            return (
              <g key={i}>
                <motion.line
                  x1={fromNode.x} y1={fromNode.y}
                  x2={toNode.x} y2={toNode.y}
                  stroke={getStatusColor(edge.status)}
                  strokeWidth={isHighlighted ? 3 : 1.5}
                  strokeDasharray={edge.status === "critical" ? "4 4" : "none"}
                  className={cn(
                    "transition-all duration-500",
                    edge.status === "critical" && "animate-dash"
                  )}
                />
                {isHighlighted && (
                  <motion.circle r="3" fill="#2563EB">
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={`M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`}
                    />
                  </motion.circle>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {NODES.map((node) => (
            <motion.g 
              key={node.id}
              onClick={() => setSelectedNode(node.id)}
              className="cursor-pointer"
              whileHover={{ scale: 1.1 }}
            >
              <circle
                cx={node.x} cy={node.y}
                r={25}
                fill="currentColor"
                className="text-brand-blue/5"
              />
              
              {activeLayer === "density" && (
                <motion.circle
                  cx={node.x} cy={node.y}
                  r={15 + (node.density * 20)}
                  fill={node.density > 0.8 ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)"}
                  className="pointer-events-none"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              <motion.circle
                cx={node.x} cy={node.y}
                r={node.type === "hub" ? 10 : 6}
                fill={node.type === "hub" ? "#8B5CF6" : "#2563EB"}
                stroke="white"
                strokeWidth={selectedNode === node.id ? 2 : 0}
                className={cn(
                  "transition-all",
                  selectedNode === node.id && "shadow-[0_0_20px_rgba(37,99,235,1)]"
                )}
              />

              <text
                x={node.x} y={node.y + 24}
                textAnchor="middle"
                className={cn(
                  "text-[9px] font-mono font-bold uppercase transition-all tracking-wider fill-muted-text",
                  selectedNode === node.id && "fill-white text-[10px]"
                )}
              >
                {node.label}
              </text>
            </motion.g>
          ))}
        </svg>

        {/* Floating Metrics HUD */}
        <div className="absolute top-6 right-6 space-y-2 pointer-events-none">
           <div className="bg-brand-surface/80 border border-white/5 p-3 rounded-xl backdrop-blur-xl flex items-center gap-3 shadow-2xl">
              <Activity className="w-4 h-4 text-brand-green animate-pulse" />
              <div>
                <p className="text-[9px] font-mono text-muted-text uppercase leading-none mb-1">Flow Velocity</p>
                <p className="text-xs font-bold text-white font-mono tracking-tighter">0.84 ops/sec</p>
              </div>
           </div>
           <div className="bg-brand-surface/80 border border-white/5 p-3 rounded-xl backdrop-blur-xl flex items-center gap-3 shadow-2xl">
              <Eye className="w-4 h-4 text-brand-blue" />
              <div>
                <p className="text-[9px] font-mono text-muted-text uppercase leading-none mb-1">Coverage</p>
                <p className="text-xs font-bold text-white font-mono tracking-tighter">98.2% Active</p>
              </div>
           </div>
        </div>

        {/* Selected Node Details Overlay */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-6 right-6 p-6 bg-brand-surface border border-brand-blue/30 rounded-2xl shadow-2xl backdrop-blur-2xl z-20"
            >
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-blue/10 rounded-lg">
                      <Target className="w-5 h-5 text-brand-blue" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                        {NODES.find(n => n.id === selectedNode)?.label}
                      </h4>
                      <p className="text-[9px] font-mono text-muted-text uppercase">Node Metadata Detected</p>
                    </div>
                 </div>
                 <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedNode(null); }}
                  className="text-muted-text hover:text-white"
                 >
                   <AnimatePresence>
                     <Zap className="w-4 h-4" />
                   </AnimatePresence>
                 </button>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                 <div>
                   <p className="text-[8px] font-mono uppercase text-muted-text mb-1">Density Index</p>
                   <p className="text-xs font-bold text-brand-blue">{(NODES.find(n => n.id === selectedNode)?.density || 0) * 100}%</p>
                 </div>
                 <div>
                   <p className="text-[8px] font-mono uppercase text-muted-text mb-1">Active Routes</p>
                   <p className="text-xs font-bold text-brand-purple">12 SACCOs</p>
                 </div>
                 <div>
                   <p className="text-[8px] font-mono uppercase text-muted-text mb-1">Reliability</p>
                   <p className="text-xs font-bold text-brand-green">High</p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-8 bg-black/40 border-t border-white/5 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-brand-blue" />
            <span className="text-[10px] font-mono text-white font-bold uppercase tracking-widest">Inference Core</span>
          </div>
          <div className="px-2 py-0.5 bg-brand-green/20 rounded-md">
            <span className="text-[8px] font-mono font-bold text-brand-green uppercase">Sync Stable</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-text font-mono leading-relaxed uppercase tracking-tighter mb-4">
          Analyzing 14,204 historical path confirmations across 8 corridors. Uncertainty propagation suppressed.
        </p>
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
           <motion.div 
             className="h-full bg-brand-blue shadow-[0_0_10px_rgba(37,99,235,1)]"
             initial={{ width: "0%" }}
             animate={{ width: "92%" }}
             transition={{ duration: 2 }}
           />
        </div>
      </div>
    </div>
  );
}
