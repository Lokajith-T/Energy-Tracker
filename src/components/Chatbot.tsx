import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { EnergyStats } from '../types';
import { Send, Bot, User, Sparkles, Loader2, X, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getEnergyAdvice } from '../services/aiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "Hello! I'm your Energy OS Advisor. How can I help you optimize your consumption today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const path = 'energy_stats/live';
    const unsub = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.data() as EnergyStats);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await getEnergyAdvice(stats, input);

    const aiMsg: Message = {
      role: 'ai',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsTyping(false);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "absolute bottom-24 right-6 w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 transition-all active:scale-90 z-40",
          isOpen && "scale-0 opacity-0"
        )}
      >
        <MessageCircle size={28} />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-24 right-6 w-[calc(100%-3rem)] max-w-[350px] h-[500px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="bg-emerald-500 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm tracking-tight">AI Advisor</h3>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-[9px] text-white/80 font-bold uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border text-[10px]",
                    msg.role === 'ai' 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                      : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                  )}>
                    {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed",
                    msg.role === 'ai'
                      ? "bg-slate-50 text-slate-700"
                      : "bg-emerald-500 text-white font-medium"
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Bot size={14} />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <Loader2 className="animate-spin text-emerald-500" size={14} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form 
              onSubmit={handleSend}
              className="p-4 border-t border-slate-100 bg-slate-50/50"
            >
              <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your grid..."
                  className="flex-1 bg-transparent outline-none px-3 py-1.5 text-xs text-slate-700 font-medium"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
