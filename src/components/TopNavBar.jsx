import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useTheme from '../hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopNavBar() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  
  const location = useLocation();
  const openAuthModal = useAuthStore(state => state.openAuthModal);
  const { isLight, toggleTheme } = useTheme();

  const navItems = [
    { id: '/', label: 'Home' },
    { id: '/how-it-works', label: 'How it Works' },
    { id: '/pricing', label: 'Pricing' },
  ];

  // Fetch notifications when dropdown is opened
  useEffect(() => {
    if (showNotifications) {
      setLoadingNotifications(true);
      const fetchNotifs = async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        setNotifications([]);
        setLoadingNotifications(false);
      };
      fetchNotifs();
    }
  }, [showNotifications]);

  return (
    <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-background/70 backdrop-blur-xl border-b border-white/10 shadow-[0_12px_50px_rgba(0,0,0,0.12)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-4 md:gap-12 min-w-0">
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img src="/HeaderIcon.png" alt="MemLaunch" className="h-10 w-auto block" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.id}
                to={item.id}
                className={`font-label-mono text-sm tracking-wide transition-colors ${
                  location.pathname === item.id 
                    ? 'text-primary font-bold' 
                    : 'text-on-surface-variant hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          
          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden xl:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-64 focus-within:border-primary/50 transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px] mr-2">search</span>
            <input
              type="text"
              placeholder="Search launches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[13px] text-white focus:ring-0 p-0 w-full placeholder:text-on-surface-variant/50 outline-none"
            />
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-10 h-10 rounded-full border border-transparent hover:border-white/10 hover:bg-white/5 flex items-center justify-center text-on-surface-variant hover:text-white transition-all relative"
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-80 bg-background/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-display-lg font-bold text-white">Notifications</h3>
                    <button className="text-primary font-label-mono text-[10px] hover:underline">MARK ALL READ</button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {loadingNotifications ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div key={notif.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer flex gap-4 items-start">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                            <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
                          </div>
                          <div>
                            <p className="text-white text-sm mb-1">{notif.title}</p>
                            <p className="text-on-surface-variant font-label-mono text-[10px]">{notif.time}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center">
                        <span className="material-symbols-outlined text-4xl text-white/20 mb-3 animate-pulse">notifications_paused</span>
                        <p className="text-white font-bold text-sm">All Caught Up!</p>
                        <p className="text-[11px] text-on-surface-variant mt-1">Check back later for new alerts.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 text-center border-t border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                    <span className="text-primary font-label-mono text-[11px] font-bold">VIEW ALL NOTIFICATIONS</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-6 bg-white/10 hidden md:block"></div>

          {/* Buttons */}
          <div className="flex items-center gap-3 md:gap-4 relative">
            
            <button
              onClick={() => openAuthModal('login')}
              className="hidden md:block font-label-mono text-sm text-on-surface-variant hover:text-white transition-colors"
            >
              Log In
            </button>
            
            <button
              onClick={() => openAuthModal('signup')}
              className="px-4 md:px-6 py-2.5 rounded-full font-label-mono font-bold hover:opacity-90 active:scale-95 transition-all text-sm bg-primary text-black"
              style={{
                boxShadow: '0 0 15px rgba(198, 198, 198, 0.1)'
              }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
