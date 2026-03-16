import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { EnergyStats } from '../types';
import { Activity, Zap, Gauge, Battery, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import NILMInsights from '../components/NILMInsights';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = 'energy_stats/live';
    const unsub = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.data() as EnergyStats);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 border-4 border-eco-green/20 border-t-eco-green rounded-full animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Syncing with Grid...</p>
      </div>
    );
  }

  const cards = [
    { 
      label: 'Voltage', 
      value: stats?.voltage || 0, 
      unit: 'V', 
      icon: Gauge, 
      color: 'bg-emerald-50 text-emerald-600',
      iconColor: 'text-emerald-500'
    },
    { 
      label: 'Current', 
      value: stats?.current || 0, 
      unit: 'A', 
      icon: Activity, 
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-500'
    },
    { 
      label: 'Power', 
      value: stats?.power || 0, 
      unit: 'W', 
      icon: Zap, 
      color: 'bg-emerald-50 text-emerald-600',
      iconColor: 'text-emerald-500'
    },
    { 
      label: 'Energy Units', 
      value: stats?.units || 0, 
      unit: 'kWh', 
      icon: Battery, 
      color: 'bg-blue-50 text-blue-600',
      iconColor: 'text-blue-500'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative h-48 rounded-3xl overflow-hidden shadow-xl group">
        <img 
          src="https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800" 
          alt="Solar Energy" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-eco-green rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-eco-green uppercase tracking-widest">Live System Status</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Intelligent Energy Management</h2>
          <p className="text-white/60 text-xs mt-1">Optimizing your grid for maximum efficiency.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="techno-card p-5"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2.5 rounded-2xl", card.color)}>
                <card.icon size={20} />
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{card.unit}</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-slate-900 tracking-tighter font-mono">
                {card.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="techno-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-900 tracking-tight">Power Usage</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time Load Analysis</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-eco-green font-mono tracking-tighter">{(stats?.power || 0).toFixed(1)}W</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Load</div>
          </div>
        </div>
        
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(((stats?.power || 0) / 2000) * 100, 100)}%` }}
            className="h-full eco-gradient shadow-[0_0_10px_rgba(16,185,129,0.3)]"
          />
        </div>
        
        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
          <span>0W</span>
          <span>1000W</span>
          <span>2000W</span>
        </div>
      </div>

      <NILMInsights 
        appliances={stats?.appliances || []} 
        totalPower={stats?.power || 0} 
        method={stats?.detectionMethod}
      />

      {/* Additional Visual Element */}
      <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
          <ShieldCheck className="text-blue-500" size={24} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">Grid Stability: <span className="text-blue-600">Optimal</span></h4>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Frequency: 50.02 Hz | Phase: Balanced</p>
        </div>
      </div>
    </div>
  );
}
