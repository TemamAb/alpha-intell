import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Loader2, TrendingUp, ShieldAlert } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Stats } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiCopilotProps {
  stats: Stats | null;
}

export default function AiCopilot({ stats }: AiCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm your AlphaMark AI Copilot. I have access to your real-time trading data. How can I help you optimize your strategies today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg, stats })
      });
      
      const data = await response.json();
      
      if (data.error) throw new Error(data.error);

      const aiText = data.response || "I'm sorry, I couldn't process that request.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error: Failed to connect to AlphaMark AI Intelligence system." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-500" />
          AI Copilot
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
          <Sparkles className="w-3 h-3" />
          Powered by Gemini
        </div>
      </div>

      <div className="flex-1 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/5 shadow-xl flex flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                msg.role === 'assistant' ? "bg-blue-600 text-white" : "bg-slate-800 text-gray-400"
              )}>
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'assistant' ? "bg-slate-800/50 text-slate-200 rounded-tl-none" : "bg-blue-600 text-white rounded-tr-none"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing telemetry...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/5 bg-slate-950/50">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about strategy performance or risk..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2 flex gap-4">
            <button 
              onClick={() => setInput("Analyze my current win rate.")}
              className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <TrendingUp className="w-3 h-3" />
              Analyze Win Rate
            </button>
            <button 
              onClick={() => setInput("What are the risks of arbitrage right now?")}
              className="text-[10px] text-gray-500 hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3" />
              Arbitrage Risks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
