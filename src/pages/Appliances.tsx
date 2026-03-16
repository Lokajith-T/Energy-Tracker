import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { EnergyStats, ApplianceUsage } from '../types';
import { Wind, Snowflake, Waves, Lightbulb, Zap, Activity, Info, TrendingUp, AlertCircle, Cpu, Search, Fingerprint } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const iconMap: Record<string, any> = {
  Wind,
  Snowflake,
  Waves,
  Lightbulb,
  Zap
};

export default function Appliances() {
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const statsPath = 'energy_stats/live';
    const unsub = onSnapshot(doc(db, statsPath), (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.data() as EnergyStats);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, statsPath));

    return () => unsub();
  }, []);

  // Simulate scanning effect when detection method changes or periodically
  useEffect(() => {
    if (stats?.detectionMethod?.includes('ML')) {
      setIsScanning(true);
      setScanProgress(0);
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            setIsScanning(false);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [stats?.detectionMethod, stats?.appliances?.length]);

  const activeAppliances = stats?.appliances?.filter(app => app.power > 0) || [];
  const totalAppliancePower = activeAppliances.reduce((acc, app) => acc + app.power, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">NILM Engine</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Non-Intrusive Load Monitoring</p>
        </div>
        <div className={cn(
          "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border flex items-center gap-2",
          stats?.detectionMethod?.includes('ML') 
            ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        )}>
          <Cpu size={12} className={isScanning ? "animate-spin" : ""} />
          {stats?.detectionMethod?.includes('ML') ? 'ML Detection Active' : 'Heuristic Mode'}
        </div>
      </header>

      {/* NILM Signature Analysis Visual */}
      <div className="techno-card p-6 bg-slate-900 border-none overflow-hidden relative min-h-[160px]">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Fingerprint size={16} className="text-blue-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Signature Analysis</span>
            </div>
            {isScanning && (
              <span className="text-[9px] font-bold text-blue-400 animate-pulse uppercase tracking-widest">
                Scanning Waveform... {scanProgress}%
              </span>
            )}
          </div>

          {/* Waveform Visualization */}
          <div className="flex items-end justify-between gap-1 h-16 mb-4">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  height: isScanning ? [20, 60, 30, 50, 20][i % 5] : [10, 20, 15, 25, 10][i % 5],
                  opacity: isScanning ? [0.4, 1, 0.6][i % 3] : 0.3
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5, 
                  delay: i * 0.05,
                  ease: "easeInOut"
                }}
                className={cn(
                  "w-full rounded-full",
                  stats?.detectionMethod?.includes('ML') ? "bg-blue-500" : "bg-emerald-500"
                )}
              />
            ))}
          </div>

          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-bold font-mono tracking-tighter text-white">
                {totalAppliancePower.toFixed(0)}<span className="text-sm font-medium text-slate-500 ml-1">W</span>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Aggregated Load Signature</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-emerald-400 font-mono">
                {activeAppliances.length} Matches
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Pattern Library</p>
            </div>
          </div>
        </div>

        {/* Scanning Line */}
        {isScanning && (
          <motion.div 
            initial={{ left: "-10%" }}
            animate={{ left: "110%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 bottom-0 w-px bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)] z-20"
          />
        )}
      </div>

      {/* Appliance List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-slate-400" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Disaggregated Devices</h3>
          </div>
          <TrendingUp size={14} className="text-slate-300" />
        </div>

        {activeAppliances.length > 0 ? (
          activeAppliances.sort((a, b) => b.power - a.power).map((app, index) => {
            const Icon = iconMap[app.icon] || Zap;
            const percentage = (app.power / (stats?.power || 1)) * 100;

            return (
              <motion.div
                key={app.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="techno-card p-4 group hover:border-emerald-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{app.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Now</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 font-mono">{app.power.toFixed(1)}W</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{percentage.toFixed(1)}% of Load</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Efficiency: High</span>
                    <span>Est. Cost: ₹{(app.power * 0.0075).toFixed(2)}/hr</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="techno-card p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Info size={24} />
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">No active appliances detected</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Start simulation in your profile to see real-time appliance monitoring.
            </p>
          </div>
        )}
      </div>

      {/* Efficiency Tips */}
      <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Optimization Alert</span>
        </div>
        <p className="text-xs text-amber-800 leading-relaxed">
          Your <strong>Air Conditioner</strong> is currently consuming 45% of your total energy. Consider increasing the temperature by 2°C to save approximately ₹150/month.
        </p>
      </div>

      {/* NILM Info Section */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-blue-600">
          <Info size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest">NILM Technology</span>
        </div>
        <p className="text-[11px] text-blue-800 leading-relaxed">
          <strong>Non-Intrusive Load Monitoring (NILM)</strong> uses advanced AI to analyze the unique electrical "fingerprint" of each appliance from a single measurement point. No individual smart plugs are required.
        </p>
        <div className="flex gap-2">
          <div className="px-2 py-1 bg-white rounded-lg text-[8px] font-bold text-blue-600 border border-blue-100">AI PATTERN MATCHING</div>
          <div className="px-2 py-1 bg-white rounded-lg text-[8px] font-bold text-blue-600 border border-blue-100">LOAD DISAGGREGATION</div>
        </div>
      </div>
    </div>
  );
}
