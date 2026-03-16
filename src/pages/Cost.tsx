import React, { useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { EnergyStats, UserProfile } from '../types';
import { Receipt, TrendingUp, IndianRupee, Info } from 'lucide-react';
import { motion } from 'motion/react';

export default function Cost() {
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const statsPath = 'energy_stats/live';
    const profilePath = `users/${auth.currentUser.uid}`;

    const unsubStats = onSnapshot(doc(db, statsPath), (snapshot) => {
      if (snapshot.exists()) setStats(snapshot.data() as EnergyStats);
    }, (err) => handleFirestoreError(err, OperationType.GET, statsPath));

    const unsubProfile = onSnapshot(doc(db, profilePath), (snapshot) => {
      if (snapshot.exists()) setProfile(snapshot.data() as UserProfile);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, profilePath));

    return () => {
      unsubStats();
      unsubProfile();
    };
  }, []);

  if (loading) return null;

  const units = stats?.units || 0;
  const consumerType = profile?.consumerType || 'domestic';

  const calculateCost = (units: number, type: 'domestic' | 'commercial') => {
    let cost = 0;
    if (type === 'domestic') {
      if (units <= 400) {
        cost = units * 4.80;
      } else if (units <= 500) {
        cost = (400 * 4.80) + (units - 400) * 6.45;
      } else if (units <= 600) {
        cost = (400 * 4.80) + (100 * 6.45) + (units - 500) * 8.55;
      } else if (units <= 800) {
        cost = (400 * 4.80) + (100 * 6.45) + (100 * 8.55) + (units - 600) * 9.65;
      } else if (units <= 1000) {
        cost = (400 * 4.80) + (100 * 6.45) + (100 * 8.55) + (200 * 9.65) + (units - 800) * 10.70;
      } else {
        cost = (400 * 4.80) + (100 * 6.45) + (100 * 8.55) + (200 * 9.65) + (200 * 10.70) + (units - 1000) * 11.80;
      }
    } else {
      // Commercial
      if (units <= 100) {
        cost = units * 6.05;
      } else if (units <= 500) {
        cost = (100 * 6.05) + (units - 100) * 6.70;
      } else {
        cost = (100 * 6.05) + (400 * 6.70) + (units - 500) * 7.10;
      }
    }
    return cost;
  };

  const totalCost = calculateCost(units, consumerType);
  const averageTariff = units > 0 ? totalCost / units : (consumerType === 'domestic' ? 4.80 : 6.05);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900 font-mono uppercase tracking-tight">Cost <span className="text-eco-green">Analysis</span></h2>
        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">Estimated billing (India Region)</p>
      </header>

      <div className="techno-card p-8 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-eco-green to-blue-500 opacity-20" />
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
          <IndianRupee size={32} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 font-mono">Total Estimated Cost</p>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-slate-900 font-mono tracking-tighter">
            ₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="techno-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Units Consumed</p>
            <p className="text-xl font-bold text-slate-900 font-mono">{units.toFixed(2)} <span className="text-xs text-slate-400">kWh</span></p>
          </div>
        </div>

        <div className="techno-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <Receipt size={24} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Avg. Tariff ({consumerType})</p>
            <p className="text-xl font-bold text-slate-900 font-mono">₹{averageTariff.toFixed(2)} <span className="text-xs text-slate-400">/ kWh</span></p>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-5 flex gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <Info className="text-emerald-500" size={20} />
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">
          Costs are calculated in real-time based on Indian Standard Units. Update your tariff in the profile tab for precise local billing.
        </p>
      </div>
    </div>
  );
}
