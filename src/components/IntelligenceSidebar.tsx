import { useEffect, useState } from "react";
import { Shield, Map as MapIcon, Activity, AlertTriangle, CloudRain, Clock, CheckCircle, Database, LogIn, User } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup, onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";

interface Alert {
  id: number;
  type: string;
  message: string;
  time: string;
  severity: "high" | "medium" | "low";
}

export default function IntelligenceSidebar() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [signalMsg, setSignalMsg] = useState("");
  const [signalType, setSignalType] = useState("traffic");
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    fetch("/api/feed")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAlerts(data);
      })
      .catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handlePostSignal = async () => {
    if (!signalMsg || !currentUser || isPosting) return;
    setIsPosting(true);
    try {
      const res = await fetch('/api/signals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: signalType, 
          message: signalMsg, 
          severity: 'medium', 
          userId: currentUser.uid 
        })
      });
      if (res.ok) {
        setSignalMsg("");
        // Refresh alerts
        const feedRes = await fetch("/api/feed");
        const data = await feedRes.json();
        if (Array.isArray(data)) setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to post signal", error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <div className="flex flex-col h-full bg-brand-surface border-r border-white/5 w-[280px] sm:w-80 overflow-y-auto">
      <div className="p-4 sm:p-6 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-blue/20 rounded-lg">
              <Shield className="w-5 h-5 text-brand-blue" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base sm:text-lg tracking-tight">Intelligence Hub</h2>
            </div>
          </div>
          
          {currentUser ? (
            <button 
              onClick={handleLogout}
              className="p-1 sm:p-2 hover:bg-white/5 rounded-full transition-colors group"
              title="Sign Out"
            >
              <img src={currentUser.photoURL || ""} alt="" className="w-6 h-6 rounded-full border border-brand-blue" />
            </button>
          ) : (
            <button 
              onClick={handleLogin}
              className="p-1 sm:p-2 hover:bg-white/5 rounded-full transition-colors text-muted-text hover:text-brand-blue"
              title="Sign In"
            >
              <LogIn className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-1">
          <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-white/5 transition-colors text-[13px] sm:text-sm text-left">
            <MapIcon className="w-4 h-4 text-brand-purple" />
            <span>Route Map Repository</span>
          </button>
          <button className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-white/5 transition-colors text-[13px] sm:text-sm text-left text-muted-text">
            <Database className="w-4 h-4 text-brand-blue" />
            <span>Commuter Logic Base</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {currentUser && (
          <div className="mb-8 p-3 sm:p-4 bg-brand-blue/5 border border-brand-blue/20 rounded-xl">
            <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-blue mb-3 font-bold">Report Live Signal</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                value={signalMsg}
                onChange={(e) => setSignalMsg(e.target.value)}
                placeholder="What's happening?" 
                className="w-full bg-brand-surface border border-white/10 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-brand-blue outline-none"
              />
              <div className="flex gap-2">
                <select 
                  value={signalType}
                  onChange={(e) => setSignalType(e.target.value)}
                  className="flex-1 bg-brand-surface border border-white/10 rounded-lg p-2.5 text-[10px] focus:ring-1 focus:ring-brand-blue outline-none uppercase font-mono"
                >
                  <option value="traffic">Traffic</option>
                  <option value="confirmation">Confirm</option>
                  <option value="alert">Alert</option>
                  <option value="weather">Weather</option>
                </select>
                <button 
                  onClick={handlePostSignal}
                  disabled={isPosting || !signalMsg}
                  className={cn(
                    "bg-brand-blue text-white px-4 rounded-lg text-xs font-bold transition-all",
                    (isPosting || !signalMsg) ? "opacity-50 cursor-not-allowed" : "hover:glow-blue"
                  )}
                >
                  {isPosting ? "..." : "Post"}
                </button>
              </div>
            </div>
          </div>
        )}

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
