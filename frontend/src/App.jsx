import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Satellite, CloudSun, MessageCircle, Activity, Menu, X } from 'lucide-react';

// Pages
import HomePage from './pages/HomePage';
import PassesPage from './pages/PassesPage';
import SpaceWeatherPage from './pages/SpaceWeatherPage';
import ChatPage from './pages/ChatPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Activity, label: 'Home' },
    { path: '/passes', icon: Satellite, label: 'Passes' },
    { path: '/space-weather', icon: CloudSun, label: 'Space Weather' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-950 via-slate-900/95 to-transparent backdrop-blur-md border-b border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Satellite className="w-8 h-8 text-space-400 group-hover:text-space-300 transition-colors" />
              <div className="absolute inset-0 blur-xl bg-space-500/20 group-hover:bg-space-400/30 transition-all" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-display font-bold text-white tracking-tight">
                Space Agent
              </span>
              <span className="text-xs text-slate-400 font-mono -mt-1">
                Mission Control
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg font-medium transition-all ${
                    active
                      ? 'text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-space-600/20 to-aurora-600/20 rounded-lg border border-space-500/30"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                        active
                          ? 'bg-gradient-to-r from-space-600/20 to-aurora-600/20 text-white border border-space-500/30'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          {/* Animated background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-space-500/10 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-aurora-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-solar-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
          </div>

          <Navigation />
          
          <main className="relative pt-16">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/passes" element={<PassesPage />} />
                <Route path="/space-weather" element={<SpaceWeatherPage />} />
                <Route path="/chat" element={<ChatPage />} />
              </Routes>
            </AnimatePresence>
          </main>

          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'bg-slate-800 text-white border border-slate-700',
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
