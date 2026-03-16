import React, { useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { EnergyStats, UserProfile } from '../types';
import { Bell, BellRing, AlertCircle, Save, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Alerts() {
  const [stats, setStats] = useState<EnergyStats | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [limit, setLimit] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const statsPath = 'energy_stats/live';
    const profilePath = `users/${auth.currentUser.uid}`;

    const unsubStats = onSnapshot(doc(db, statsPath), (snapshot) => {
      if (snapshot.exists()) setStats(snapshot.data() as EnergyStats);
    }, (err) => handleFirestoreError(err, OperationType.GET, statsPath));

    const unsubProfile = onSnapshot(doc(db, profilePath), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfile;
        setProfile(data);
        setLimit(data.usageLimit?.toString() || '100');
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, profilePath));

    return () => {
      unsubStats();
      unsubProfile();
    };
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        usageLimit: parseFloat(limit) || 0
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const units = stats?.units || 0;
  const usageLimit = profile?.usageLimit || 100;
  const isExceeded = units > usageLimit;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-900 font-mono uppercase tracking-tight">Usage <span className="text-eco-green">Alerts</span></h2>
        <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">Set limits and get notified</p>
      </header>

      <AnimatePresence>
        {isExceeded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 flex flex-col items-center text-center gap-3"
          >
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-red-500/10">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-red-900 font-bold font-mono uppercase tracking-tighter">Limit Exceeded!</h3>
              <p className="text-red-700 text-[10px] font-bold uppercase tracking-widest mt-1">
                Usage ({units.toFixed(2)} kWh) &gt; Limit ({usageLimit} kWh)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="techno-card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <BellRing size={20} />
          </div>
          <h3 className="font-bold text-slate-900 font-mono uppercase tracking-widest text-sm">Set Usage Limit</h3>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] font-mono">Limit (kWh)</label>
          <div className="relative">
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
              placeholder="e.g. 100"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono text-xs">kWh</div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full eco-gradient hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 font-mono text-xs uppercase tracking-widest"
        >
          {saved ? (
            <>
              <CheckCircle2 size={20} />
              Updated
            </>
          ) : (
            <>
              <Save size={20} />
              {saving ? 'Syncing...' : 'Update Limit'}
            </>
          )}
        </button>
      </div>

      <div className="techno-card p-6 border-dashed border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Current Progress</span>
          <span className="text-sm font-bold text-slate-900 font-mono">{Math.round((units / usageLimit) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((units / usageLimit) * 100, 100)}%` }}
            className={isExceeded ? "h-full bg-red-500 shadow-lg shadow-red-500/20" : "h-full bg-emerald-500 shadow-lg shadow-emerald-500/20"}
          />
        </div>
      </div>
    </div>
  );
}
