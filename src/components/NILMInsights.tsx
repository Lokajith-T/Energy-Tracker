import React from 'react';
import { ApplianceUsage } from '../types';
import { Wind, Snowflake, Waves, Lightbulb, Zap, ChevronRight } from 'lucide-react';
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

interface NILMInsightsProps {
  appliances: ApplianceUsage[];
  totalPower: number;
  method?: string;
}

export default function NILMInsights({ appliances, totalPower, method }: NILMInsightsProps) {
  if (!appliances || appliances.length === 0) return null;

  return (
    <div className="techno-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 tracking-tight">NILM Insights</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            {method || 'Appliance Disaggregation'}
          </p>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
          method?.includes('ML') 
            ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
        )}>
          {method?.includes('ML') ? 'ML Active' : 'AI Active'}
        </div>
      </div>

      <div className="space-y-4">
        {appliances.filter(app => app.power > 0).sort((a, b) => b.power - a.power).map((app, index) => {
          const Icon = iconMap[app.icon] || Zap;
          const percentage = (app.power / totalPower) * 100;

          return (
            <motion.div 
              key={app.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{app.name}</div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{app.power.toFixed(1)}W</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900 font-mono">{percentage.toFixed(1)}%</div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Load Share</div>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all group">
        View Detailed Analytics
        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
