import { useEffect, useState } from "react";
import { Shield, Map as MapIcon, Activity, AlertTriangle, CloudRain, Clock, CheckCircle, Database } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface Alert {
  id: number;
  type: string;
  message: string;
  time: string;
  severity: "high" | "medium" | "low";
}

export default function IntelligenceSidebar() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    fetch("/api/feed")
      .then(res => res.json())
      .then(setAlerts)
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col h-full bg-brand-surface border-r border-white/5 w-80 overflow-y-auto">
      <div className="p-6 border-bottom border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-brand-blue/20 rounded-lg">
            <Shield className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg tracking-tight">Intelligence Hub</h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-text font-mono">Nairobi Operations Center</p>
          </div>
        </div>

        <div className="space-y-1">
          <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-white/5 transition-colors text-sm text-left">
            <MapIcon className="w-4 h-4 text-brand-purple" />
            <span>Route Map Repository</span>
          </button>
          <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-white/5 transition-colors text-sm text-left">
            <Database className="w-4 h-4 text-brand-blue" />
            <span>Commuter Logic Base</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-muted-text">Live Mobility Signals</h3>
          <Activity className="w-3 h-3 text-brand-green animate-pulse" />
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group cursor-pointer"
            >
              <div className="flex gap-3">
                <div className={cn(
                  "mt-1 p-1.5 rounded-full ring-1",
                  alert.severity === "high" ? "bg-brand-red/10 ring-brand-red/30 text-brand-red" :
                  alert.severity === "medium" ? "bg-brand-amber/10 ring-brand-amber/30 text-brand-amber" :
                  "bg-brand-green/10 ring-brand-green/30 text-brand-green"
                )}>
                  {alert.type === "traffic" && <AlertTriangle className="w-3 h-3" />}
                  {alert.type === "confirmation" && <CheckCircle className="w-3 h-3" />}
                  {alert.type === "alert" && <Clock className="w-3 h-3" />}
                  {alert.type === "weather" && <CloudRain className="w-3 h-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium leading-relaxed group-hover:text-brand-blue transition-colors">
                    {alert.message}
                  </p>
                  <span className="text-[10px] text-muted-text font-mono">{alert.time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6 mt-auto border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
          <span className="text-[10px] font-mono text-muted-text uppercase">Agent System Online</span>
        </div>
        <p className="text-[9px] text-muted-text leading-tight uppercase font-mono tracking-tighter italic">
          Continuous learning from 4.2M daily commuter patterns
        </p>
      </div>
    </div>
  );
}
