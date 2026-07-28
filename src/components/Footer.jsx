import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full py-10 px-4 sm:px-6 md:px-margin-desktop border-t border-white/10 bg-background/80 backdrop-blur-xl flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex flex-col items-center md:items-start gap-2">
        <Link
          to="/"
          className="font-display-lg text-[20px] font-bold tracking-tighter text-white hover:text-primary transition-colors text-left"
        >
          MemLaunch
        </Link>
        <span className="text-[13px] text-on-surface-variant/80">
          © 2026 MemLaunch Institutional. All rights reserved.
        </span>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
        <Link className="text-[13px] text-on-surface-variant hover:text-primary transition-colors" to="/terms">Terms of Service</Link>
        <Link className="text-[13px] text-on-surface-variant hover:text-primary transition-colors" to="/privacy">Privacy Policy</Link>
        <Link className="text-[13px] text-on-surface-variant hover:text-primary transition-colors" to="/risk">Risk Disclosure</Link>
        <Link className="text-[13px] text-on-surface-variant hover:text-primary transition-colors" to="/docs">Documentation</Link>
      </div>
    </footer>
  );
}
