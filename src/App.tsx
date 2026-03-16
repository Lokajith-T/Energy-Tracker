import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cost from './pages/Cost';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import Appliances from './pages/Appliances';

// Components
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden">
        <div className="scanline" />
        <div className="relative">
          <div className="w-16 h-16 border-2 border-emerald-500/10 rounded-full animate-ping absolute inset-0" />
          <div className="w-16 h-16 border-t-2 border-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="scanline" />
      <BrowserRouter>
        <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        
        <Route
          path="/"
          element={
            user ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/appliances"
          element={
            user ? (
              <Layout>
                <Appliances />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/cost"
          element={
            user ? (
              <Layout>
                <Cost />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/alerts"
          element={
            user ? (
              <Layout>
                <Alerts />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/profile"
          element={
            user ? (
              <Layout>
                <Profile />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
