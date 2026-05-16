import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  MapPin, 
  Bus, 
  Navigation, 
  Info, 
  AlertCircle, 
  ChevronRight, 
  CornerDownRight, 
  Activity, 
  Clock, 
  CloudRain, 
  CheckCircle, 
  Network, 
  Zap, 
  Target, 
  AlertTriangle, 
  Database 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface TimelineStep {
  action: "BOARD" | "ALIGHT" | "WALK" | "TRANSFER";
  detail: string;
  route: string | null;
  sacco: string | null;
  location: string;
  metadata: {
    fare: string | null;
    traffic: "low" | "moderate" | "heavy" | "stalled";
    confidence: number;
    commuter_verified: boolean;
  };
}

interface Alternative {
  label: "CHEAPEST" | "FASTEST" | "FEWEST_TRANSFERS" | "SAFEST_NIGHT";
  summary: string;
}

interface RouteIntelligence {
  origin: string;
  destination: string;
  explanation: string;
  reasoning_why: string;
  timeline: TimelineStep[];
  intelligence_flags: {
    is_rush_hour: boolean;
    rain_delay_prob: number;
    fare_surge: boolean;
  };
  alternatives: Alternative[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  intelligence?: RouteIntelligence;
}

export default function RouteConsole() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Jambo! Nairobi Mobility OS is online. I'm analyzing real-time matatu flows. Where is your starting stage?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))
        }),
      });

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.explanation || "Route graph traversed. Logic mapped.",
        intelligence: data,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "Graph sync failed. Attempting to reconnect to Nairobi node...",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case "low": return "text-brand-green";
      case "moderate": return "text-brand-amber";
      case "heavy": return "text-brand-red";
      case "stalled": return "text-brand-red animate-pulse";
      default: return "text-muted-text";
    }
  };

  return (
    <div className="flex flex-col h-full flex-1 bg-brand-bg relative overflow-hidden">
      {/* Dynamic Scan Line */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-full h-px bg-brand-blue/30 blur-sm animate-scan" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 md:py-10 space-y-8 md:space-y-12 scroll-smooth z-10" ref={scrollRef}>
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, x: message.role === "user" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex flex-col w-full max-w-4xl mx-auto",
                message.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "px-4 md:px-6 py-2 md:py-3 rounded-2xl text-xs md:text-sm leading-relaxed border backdrop-blur-md",
                message.role === "user" 
                  ? "bg-brand-blue/20 border-brand-blue/30 text-white rounded-tr-none" 
                  : "bg-brand-surface/80 border-white/10 rounded-tl-none font-medium"
              )}>
                {message.content}
              </div>

              {message.intelligence && (
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.1 }}
                   className="mt-6 md:mt-8 w-full space-y-6 md:space-y-8"
                >
                  {/* Reasoning Header */}
                  <div className="flex flex-wrap gap-2 md:gap-4 items-center">
                    {message.intelligence?.intelligence_flags?.is_rush_hour && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-brand-red/10 border border-brand-red/30 rounded-full text-[9px] md:text-[10px] font-bold text-brand-red animate-pulse">
                        <Clock className="w-3 h-3" />
                        RUSH HOUR PROTOCOL
                      </div>
                    )}
                    {message.intelligence?.intelligence_flags?.rain_delay_prob > 0.5 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-brand-blue/10 border border-brand-blue/30 rounded-full text-[9px] md:text-[10px] font-bold text-brand-blue">
                        <CloudRain className="w-3 h-3" />
                        RAIN DELAY INFERRED
                      </div>
                    )}
                    <div className="text-[9px] md:text-[10px] uppercase font-mono tracking-widest text-muted-text bg-white/5 px-3 py-1 rounded-full border border-white/5">
                      Confidence: {(message.intelligence?.timeline ? Math.max(...message.intelligence.timeline.map(t => t.metadata.confidence)) : 0).toFixed(2)}
                    </div>
                  </div>

                  {/* Why this route? */}
                  <div className="bg-brand-surface border-l-2 border-brand-blue p-3 md:p-4 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-2">
                       <Info className="w-3 h-3 text-brand-blue" />
                       <span className="text-[9px] md:text-[10px] font-mono text-brand-blue uppercase font-bold">Route Strategy Reasoning</span>
                    </div>
                    <p className="text-[11px] md:text-xs text-muted-text italic leading-relaxed">
                      {message.intelligence.reasoning_why}
                    </p>
                  </div>

                  {/* Structured Timeline */}
                  <div className="relative space-y-0 pl-1">
                    {message.intelligence?.timeline?.map((step, idx) => (
                      <div key={idx} className="relative pb-6 md:pb-10 last:pb-0 group">
                        {idx !== (message.intelligence?.timeline?.length || 0) - 1 && <div className="timeline-line" />}
                        <div className={cn(
                          "timeline-dot",
                          step.metadata?.confidence > 0.8 ? "animate-pulse" : "opacity-50"
                        )} />

                        <div className="ml-6 md:ml-10 flex flex-col md:flex-row gap-4 md:gap-6">
                          <div className="flex-1 card-gradient border border-white/5 p-4 md:p-6 rounded-2xl group-hover:border-brand-blue/30 transition-all">
                            <div className="flex items-center justify-between mb-3 md:mb-4">
                              <div className="flex items-center gap-2 md:gap-3">
                                {step.action === "BOARD" && <Bus className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-green" />}
                                {step.action === "ALIGHT" && <Navigation className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-red" />}
                                {step.action === "WALK" && <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-amber" />}
                                {step.action === "TRANSFER" && <CornerDownRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-purple" />}
                                <span className={cn(
                                  "text-[10px] md:text-xs font-bold uppercase tracking-wider",
                                  step.action === "BOARD" ? "text-brand-green" :
                                  step.action === "ALIGHT" ? "text-brand-red" :
                                  step.action === "WALK" ? "text-brand-amber" :
                                  "text-brand-purple"
                                )}>
                                  {step.action}
                                </span>
                              </div>
                              {step.metadata?.commuter_verified && (
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-brand-green/10 border border-brand-green/20 rounded-md">
                                  <CheckCircle className="w-2 md:w-2.5 h-2 md:h-2.5 text-brand-green" />
                                  <span className="text-[8px] md:text-[9px] font-mono font-bold text-brand-green uppercase">Verified</span>
                                </div>
                              )}
                            </div>

                            <p className="text-xs md:text-sm font-medium mb-1">{step.detail}</p>
                            <div className="flex items-center gap-2 mb-4">
                              <MapPin className="w-3 md:w-3.5 h-3 md:h-3.5 text-muted-text" />
                              <span className="text-[11px] md:text-xs text-white/70">{step.location}</span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/5">
                              {step.route && (
                                <div>
                                  <p className="text-[8px] uppercase font-mono text-muted-text mb-0.5">Route #</p>
                                  <p className="text-xs font-bold text-brand-purple">{step.route}</p>
                                </div>
                              )}
                              {step.metadata?.fare && (
                                <div>
                                  <p className="text-[8px] uppercase font-mono text-muted-text mb-0.5">Est. Fare</p>
                                  <p className="text-xs font-bold text-brand-green">{step.metadata.fare}</p>
                                </div>
                              )}
                              {step.metadata && (
                                <div>
                                  <p className="text-[8px] uppercase font-mono text-muted-text mb-0.5">Traffic</p>
                                  <p className={cn("text-xs font-bold uppercase", getTrafficColor(step.metadata.traffic))}>
                                    {step.metadata.traffic}
                                  </p>
                                </div>
                              )}
                              {step.metadata && (
                                <div>
                                  <p className="text-[8px] uppercase font-mono text-muted-text mb-0.5">Certainty</p>
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                       <div 
                                         className="h-full bg-brand-blue" 
                                         style={{ width: `${(step.metadata.confidence || 0) * 100}%` }}
                                       />
                                    </div>
                                    <span className="text-[9px] font-mono text-muted-text">
                                      {((step.metadata.confidence || 0) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Alternative Scenarios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {message.intelligence?.alternatives?.map((alt, i) => (
                      <div key={i} className="bg-brand-surface/50 border border-white/10 p-4 rounded-xl hover:border-brand-blue/30 cursor-pointer group transition-all">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[9px] font-mono font-bold text-brand-blue uppercase">{alt.label?.replace('_', ' ')}</span>
                           <Target className="w-3 h-3 text-muted-text group-hover:text-brand-blue" />
                        </div>
                        <p className="text-[10px] text-muted-text line-clamp-2 leading-relaxed italic">{alt.summary}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex flex-col items-start gap-4 max-w-4xl mx-auto">
            <div className="bg-brand-surface/80 p-5 rounded-2xl rounded-tl-none flex items-center gap-4 border border-brand-blue/20 shadow-2xl backdrop-blur-xl">
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="p-1 border-2 border-dashed border-brand-blue rounded-full"
                >
                   <Network className="w-5 h-5 text-brand-blue" />
                </motion.div>
                <div className="absolute inset-0 bg-brand-blue/20 rounded-full animate-pulse shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-white font-bold block mb-1">Simulating Commuter Logic</span>
                <span className="text-[9px] font-mono text-muted-text uppercase">Node sync in progress: 2,408 active points scoped</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 pb-6 md:pb-10 border-t border-white/5 bg-brand-surface/80 backdrop-blur-xl z-20">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto group">
          <div className="absolute inset-0 bg-brand-blue/5 rounded-xl md:rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative flex items-center bg-brand-surface border border-white/10 rounded-xl md:rounded-2xl p-1.5 md:p-2 focus-within:border-brand-blue/50 transition-all shadow-2xl shadow-black/50">
            <div className="hidden sm:block px-4 text-muted-text border-r border-white/5 py-2 mr-2">
              <Zap className="w-5 h-5 text-brand-amber animate-pulse" />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query Nairobi Mobility OS..."
              className="flex-1 bg-transparent py-3 md:py-4 px-2 text-xs md:text-sm focus:outline-none font-medium placeholder:text-muted-text/30"
            />
            <div className="flex items-center gap-1 md:gap-2 px-1 md:px-2">
              <button 
                type="button"
                className="p-2 md:p-3 text-muted-text hover:text-white transition-colors"
              >
                <Navigation className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className={cn(
                  "p-2 md:p-3 rounded-lg md:rounded-xl transition-all shadow-lg",
                  input.trim() ? "bg-brand-blue text-white shadow-brand-blue/20" : "bg-white/5 text-muted-text cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </form>
        
        <div className="mt-4 md:mt-6 flex flex-wrap items-center justify-center gap-x-4 md:gap-x-8 gap-y-3">
           <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-mono font-bold text-muted-text uppercase cursor-pointer hover:text-brand-blue transition-colors bg-white/5 md:bg-transparent px-2 py-1 md:p-0 rounded-full">
              <CloudRain className="w-3 md:w-3.5 h-3 md:h-3.5" />
              <span className="hidden sm:inline">Toggle Rain Heuristics</span>
              <span className="sm:hidden">Rain</span>
           </div>
           <div className="hidden md:block h-4 w-px bg-white/10" />
           <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-mono font-bold text-muted-text uppercase cursor-pointer hover:text-brand-red transition-colors bg-white/5 md:bg-transparent px-2 py-1 md:p-0 rounded-full">
              <AlertTriangle className="w-3 md:w-3.5 h-3 md:h-3.5" />
              <span className="hidden sm:inline">Avoid Heavy Traffic</span>
              <span className="sm:hidden">Traffic</span>
           </div>
           <div className="hidden md:block h-4 w-px bg-white/10" />
           <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-mono font-bold text-muted-text uppercase cursor-pointer hover:text-brand-green transition-colors bg-white/5 md:bg-transparent px-2 py-1 md:p-0 rounded-full">
              <Database className="w-3 md:w-3.5 h-3 md:h-3.5" />
              <span className="hidden sm:inline">Cheapest Mode</span>
              <span className="sm:hidden">Cheap</span>
           </div>
        </div>
      </div>
    </div>
  );
}
