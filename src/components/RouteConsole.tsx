import React, { useState, useRef, useEffect } from "react";
import { Send, MapPin, Bus, Navigation, Info, AlertCircle, ChevronRight, CornerDownRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface RouteStep {
  route_number: string;
  sacco: string;
  board_at: string;
  alight_at: string;
  fare_range: string;
  confidence: number;
}

interface RouteIntelligence {
  origin: string;
  destination: string;
  explanation: string;
  routes: RouteStep[];
  traffic_warning: string;
  confidence_score: number;
  alternatives: string[];
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
      content: "Hujambo! I'm your Matatu Intelligence Agent. Where are you commuting from today? I can help you navigate Nairobi's routes, estimate fares, and avoid the heaviest jams.",
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
        content: data.explanation || "I've analyzed the transit patterns for this route.",
        intelligence: data,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "I'm having trouble accessing my route graph right now. Please try again or check the live feed for updates.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full flex-1 bg-brand-bg relative shadow-2xl">
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 scroll-smooth" ref={scrollRef}>
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col max-w-[85%]",
                message.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                message.role === "user" 
                  ? "bg-brand-blue text-white rounded-tr-none" 
                  : "bg-brand-surface border border-white/10 rounded-tl-none font-medium"
              )}>
                {message.content}
              </div>

              {message.intelligence && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 w-full space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {message.intelligence.routes.map((step, idx) => (
                      <div key={idx} className="bg-brand-surface p-5 rounded-2xl border border-white/10 hover:border-brand-blue/50 transition-all glow-blue group">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] uppercase font-mono tracking-widest text-brand-blue">Stage {idx + 1}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                            <span className="text-[10px] font-mono text-muted-text">{(step.confidence * 100).toFixed(0)}% Conf.</span>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <div className="p-3 bg-white/5 rounded-xl">
                              <Bus className="w-6 h-6 text-brand-purple" />
                            </div>
                            <div className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-brand-purple text-[8px] font-bold rounded-sm">
                              {step.route_number}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <h4 className="font-display font-semibold text-lg">{step.sacco}</h4>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2 text-xs text-muted-text">
                                <MapPin className="w-3 h-3" />
                                <span>Board: <span className="text-white">{step.board_at}</span></span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-text">
                                <Navigation className="w-3 h-3" />
                                <span>Alight: <span className="text-white">{step.alight_at}</span></span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs font-mono text-muted-text uppercase italic">Est. Fare</span>
                          <span className="text-sm font-bold text-brand-green">{step.fare_range}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {message.intelligence.traffic_warning && (
                    <div className="bg-brand-amber/10 border border-brand-amber/30 p-4 rounded-xl flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-brand-amber flex-shrink-0" />
                      <p className="text-xs text-brand-amber font-medium">
                        <span className="uppercase font-bold mr-2 text-[10px] opacity-70 font-mono tracking-tighter">Traffic Signal:</span>
                        {message.intelligence.traffic_warning}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {message.intelligence.alternatives.map((alt, i) => (
                      <div key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-muted-text flex items-center gap-2">
                        <CornerDownRight className="w-3 h-3" />
                        {alt}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <div className="flex flex-col items-start gap-4 max-w-[85%]">
            <div className="bg-brand-surface p-4 rounded-2xl rounded-tl-none flex items-center gap-3 border border-white/10 shadow-lg">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 180] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                 <Activity className="w-4 h-4 text-brand-blue" />
              </motion.div>
              <span className="text-xs font-mono uppercase tracking-widest text-muted-text">Traversing route graph...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 border-t border-white/5 bg-brand-surface/50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., How do I get from Kawangware to Ruai right now?"
            className="w-full bg-brand-surface border border-white/10 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 transition-all font-medium placeholder:text-muted-text/50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className={cn(
              "absolute right-2 top-2 p-3 rounded-xl transition-all",
              input.trim() ? "bg-brand-blue text-white glow-blue" : "bg-white/5 text-muted-text cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2 text-[10px] font-mono text-muted-text uppercase">
             <Info className="w-3 h-3" />
             AI Reasoning Agent v4.8
           </div>
           <div className="h-3 w-px bg-white/10" />
           <div className="flex items-center gap-2 text-[10px] font-mono text-muted-text uppercase">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
             SACCO Direct Feed Active
           </div>
        </div>
      </div>
    </div>
  );
}
