import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { Zap, Mail, Lock, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const path = `users/${user.uid}`;
        try {
          await setDoc(doc(db, path), {
            email: user.email,
            tariff: 0.15,
            usageLimit: 100,
            currentUnits: 0
          });
        } catch (fsError) {
          handleFirestoreError(fsError, OperationType.CREATE, path);
        }
      }
      navigate('/');
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Initialize user profile
        const path = `users/${userCredential.user.uid}`;
        try {
          await setDoc(doc(db, path), {
            email: email,
            tariff: 0.15, // Default tariff
            usageLimit: 100, // Default limit
            currentUnits: 0
          });
        } catch (fsError) {
          handleFirestoreError(fsError, OperationType.CREATE, path);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth Error:', err);
      let message = err.message || 'Authentication failed';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'Email/Password authentication is not enabled in the Firebase Console for project "gen-lang-client-0232343880". Please enable it under Authentication > Sign-in method.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="scanline" />
      
      {/* Background Patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md techno-card p-10 relative z-10 border-emerald-500/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <Zap className="text-emerald-500" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 font-mono uppercase tracking-tighter">
            Energy <span className="text-emerald-500">OS</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">
            Intelligent Grid Access
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/5 border border-red-500/10 text-red-500 p-4 rounded-2xl text-[10px] font-bold mb-8 flex items-center gap-3 uppercase tracking-widest"
          >
            <AlertTriangle size={16} />
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono ml-1">Access ID</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500/50 rounded-2xl py-4 pl-12 pr-4 text-slate-900 outline-none transition-all font-mono text-sm placeholder:text-slate-300"
                placeholder="operator@eco-grid.io"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono ml-1">Security Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-emerald-500/50 rounded-2xl py-4 pl-12 pr-4 text-slate-900 outline-none transition-all font-mono text-sm placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-emerald-500/20 uppercase tracking-widest font-mono text-sm"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {isRegistering ? 'Initialize Account' : 'Establish Connection'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-slate-300 text-[10px] uppercase font-black tracking-widest">Secure Link</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full mt-8 bg-white border border-slate-100 hover:bg-slate-50 text-slate-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 font-mono text-sm uppercase tracking-widest shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google Auth
        </button>

        <div className="mt-10 text-center">
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-slate-400 hover:text-emerald-500 text-[10px] font-black uppercase tracking-widest transition-colors font-mono"
          >
            {isRegistering ? 'Already registered? Connect' : 'New operator? Initialize'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
