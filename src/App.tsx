import { useState } from "react";
import IntelligenceSidebar from "./components/IntelligenceSidebar";
import RouteConsole from "./components/RouteConsole";
import MobilityGraph from "./components/MobilityGraph";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X, Shield, Activity } from "lucide-react";
import { cn } from "./lib/utils";

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative flex flex-col lg:flex-row h-screen w-full bg-brand-bg overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-brand-surface border-b border-white/5 z-50">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-blue" />
          <h1 className="font-display font-bold text-lg tracking-tight">Mobility OS</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 bg-brand-blue/10 rounded-lg text-brand-blue"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Main Content Area */}
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-1 h-full overflow-hidden relative"
      >
        {/* Sidebar Overlay for Mobile */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        <div className={cn(
          "absolute lg:relative top-0 left-0 bottom-0 h-full transition-transform duration-300 ease-in-out z-40 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <IntelligenceSidebar />
        </div>

        <div className="flex-1 overflow-hidden">
          <RouteConsole />
        </div>
        
        <MobilityGraph />
      </motion.main>

      {/* Mobile Floating Action Indicator */}
      <div className="lg:hidden absolute bottom-24 right-6 pointer-events-none">
        <div className="bg-brand-surface/80 border border-white/5 p-3 rounded-full backdrop-blur-xl flex items-center gap-3 shadow-2xl">
          <Activity className="w-4 h-4 text-brand-green animate-pulse" />
          <span className="text-[10px] font-mono text-white font-bold uppercase">System Live</span>
        </div>
      </div>
    </div>
  );
}
