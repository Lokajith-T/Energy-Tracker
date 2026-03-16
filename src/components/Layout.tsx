import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Bell from 'lucide-react/dist/esm/icons/bell';
import User from 'lucide-react/dist/esm/icons/user';
import Cpu from 'lucide-react/dist/esm/icons/cpu';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Chatbot from './Chatbot';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard, path: '/' },
    { id: 'appliances', label: 'Apps', icon: Cpu, path: '/appliances' },
    { id: 'cost', label: 'Cost', icon: Receipt, path: '/cost' },
    { id: 'alerts', label: 'Alerts', icon: Bell, path: '/alerts' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="min-h-screen bg-cyber-gray flex flex-col max-w-md mx-auto shadow-2xl relative border-x border-slate-200">
      <div className="scanline" />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 eco-gradient rounded-2xl flex items-center justify-center shadow-lg shadow-eco-green/20">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Energy <span className="text-eco-green">OS</span></h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Intelligent Grid</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-xl border border-slate-100"
          aria-label="Logout"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-28 px-6 py-6">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Chatbot Widget */}
      <Chatbot />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(28rem-3rem)] mx-auto bg-white/90 backdrop-blur-xl border border-slate-200/50 px-2 py-2 flex justify-around items-center z-20 rounded-3xl shadow-2xl shadow-slate-200/50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center gap-1 py-2 px-4 transition-all duration-300 relative rounded-2xl",
                isActive ? "text-eco-green bg-eco-green/5" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold uppercase tracking-widest font-mono">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeNav"
                  className="absolute -bottom-1 w-1 h-1 bg-eco-green rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
