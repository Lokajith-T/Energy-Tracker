import React, { useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserProfile } from '../types';
import { User, Mail, IndianRupee, Play, Pause, RefreshCw, Save, CheckCircle2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tariff, setTariff] = useState<string>('');
  const [consumerType, setConsumerType] = useState<'domestic' | 'commercial'>('domestic');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isMLMode, setIsMLMode] = useState(false);
  const [powerBuffer, setPowerBuffer] = useState<number[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const profilePath = `users/${auth.currentUser.uid}`;
    const unsub = onSnapshot(doc(db, profilePath), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        setProfile(data);
        setTariff(data.tariff?.toString() || '4.80');
        setConsumerType(data.consumerType || 'domestic');
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, profilePath));

    return () => unsub();
  }, []);

  // Simulation Logic
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(async () => {
        const voltage = 230 + (Math.random() * 10 - 5); // India standard is 230V
        const current = 5 + (Math.random() * 4 - 2);
        const totalPower = voltage * current;
        
        setPowerBuffer(prev => {
          const newBuffer = [...prev, totalPower].slice(-10);
          return newBuffer;
        });

        // NILM Disaggregation Simulation (Fallback)
        const appliances = [
          { name: 'Air Conditioner', base: 1200, variance: 200, icon: 'Wind' },
          { name: 'Refrigerator', base: 150, variance: 50, icon: 'Snowflake' },
          { name: 'Washing Machine', base: 500, variance: 100, icon: 'Waves' },
          { name: 'Lighting', base: 100, variance: 20, icon: 'Lightbulb' },
          { name: 'Others', base: 50, variance: 30, icon: 'Zap' }
        ];

        let remainingPower = totalPower;
        const disaggregated = appliances.map((app, idx) => {
          let p = 0;
          if (app.name === 'Air Conditioner' && totalPower > 1000) {
            p = app.base + (Math.random() * app.variance);
          } else if (app.name === 'Refrigerator') {
            p = app.base + (Math.random() * app.variance);
          } else if (app.name === 'Washing Machine' && totalPower > 1500) {
            p = app.base + (Math.random() * app.variance);
          } else if (app.name === 'Lighting') {
            p = app.base + (Math.random() * app.variance);
          } else if (app.name === 'Others') {
            p = Math.max(0, remainingPower);
          }
          
          p = Math.min(p, remainingPower);
          remainingPower -= p;
          
          return {
            name: app.name,
            power: parseFloat(p.toFixed(1)),
            status: p > 10 ? 'on' : 'off',
            icon: app.icon
          };
        });

        try {
          const updateData: any = {
            voltage,
            current,
            power: totalPower,
            units: (profile?.currentUnits || 0) + (totalPower / 3600000),
            lastUpdated: serverTimestamp(),
          };

          if (!isMLMode) {
            updateData.appliances = disaggregated;
            updateData.detectionMethod = 'Heuristic Simulation';
          }

          await setDoc(doc(db, 'energy_stats', 'live'), updateData, { merge: true });

          if (auth.currentUser) {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              currentUnits: (profile?.currentUnits || 0) + (totalPower / 3600000)
            });
          }
        } catch (err) {
          console.error('Simulation error:', err);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, profile?.currentUnits, isMLMode]);

  // ML Pattern Matching Effect
  useEffect(() => {
    if (isMLMode && powerBuffer.length >= 5 && !isDetecting) {
      const runMLDetection = async () => {
        setIsDetecting(true);
        try {
          const { detectAppliancesML } = await import('../services/nilmService');
          const detected = await detectAppliancesML(powerBuffer);
          if (detected.length > 0) {
            await setDoc(doc(db, 'energy_stats', 'live'), {
              appliances: detected,
              detectionMethod: 'ML Pattern Matching'
            }, { merge: true });
          }
        } catch (err) {
          console.error('ML Detection failed:', err);
        } finally {
          setIsDetecting(false);
        }
      };

      const timeout = setTimeout(runMLDetection, 4000);
      return () => clearTimeout(timeout);
    }
  }, [isMLMode, powerBuffer, isDetecting]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        tariff: parseFloat(tariff) || 0,
        consumerType: consumerType
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetData = async () => {
    if (!auth.currentUser) return;
    // Custom modal replacement for confirm
    if (!window.confirm('Are you sure you want to reset all energy data?')) return;
    
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        currentUnits: 0
      });
      await setDoc(doc(db, 'energy_stats', 'live'), {
        voltage: 0,
        current: 0,
        power: 0,
        units: 0,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900 font-mono uppercase tracking-tight">User <span className="text-eco-green">Profile</span></h2>
        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">System Configuration</p>
      </header>

      <div className="techno-card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center border border-slate-100">
            <User size={32} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 font-mono uppercase tracking-tight">{profile?.email?.split('@')[0]}</h3>
            <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold uppercase tracking-widest mt-1">
              <Mail size={12} />
              {profile?.email}
            </p>
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1 font-mono">
              Consumer Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setConsumerType('domestic')}
                className={cn(
                  "py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border",
                  consumerType === 'domestic' 
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" 
                    : "bg-slate-50 text-slate-400 border-slate-100"
                )}
              >
                Domestic
              </button>
              <button
                onClick={() => setConsumerType('commercial')}
                className={cn(
                  "py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all border",
                  consumerType === 'commercial' 
                    ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20" 
                    : "bg-slate-50 text-slate-400 border-slate-100"
                )}
              >
                Commercial
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1 font-mono">
              <IndianRupee size={12} />
              Base Tariff (₹/kWh)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                value={tariff}
                onChange={(e) => setTariff(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-500 text-white px-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-emerald-500/20"
              >
                {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="techno-card p-6 space-y-4 border-emerald-500/10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 font-mono uppercase tracking-widest text-sm">Simulation Mode</h3>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isSimulating ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'}`}>
            {isSimulating ? 'Active' : 'Idle'}
          </div>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">
          Enable simulation to generate mock energy data (230V Standard). This will update the global live feed and your personal consumption stats.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 font-mono text-xs uppercase tracking-widest ${isSimulating ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
          >
            {isSimulating ? (
              <>
                <Pause size={18} />
                Stop
              </>
            ) : (
              <>
                <Play size={18} />
                Start
              </>
            )}
          </button>
          <button
            onClick={resetData}
            className="w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:text-slate-900 transition-colors border border-slate-100"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
      <div className="techno-card p-6 space-y-4 border-blue-500/10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 font-mono uppercase tracking-widest text-sm">ML Pattern Matching</h3>
          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isMLMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 text-slate-400'}`}>
            {isMLMode ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed font-bold uppercase tracking-widest">
          Use Machine Learning to analyze power signatures and automatically detect active appliances.
        </p>
        <button
          onClick={() => setIsMLMode(!isMLMode)}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 font-mono text-xs uppercase tracking-widest ${isMLMode ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}
        >
          <Activity size={18} className={isDetecting ? "animate-pulse" : ""} />
          {isMLMode ? 'Disable ML Mode' : 'Enable ML Mode'}
        </button>
      </div>
    </div>
  );
}
