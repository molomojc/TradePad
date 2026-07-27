import React from 'react';
import { Link } from 'react-router-dom';

export default function ManageUsers() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl text-white font-display-lg">Manage Users</h1>
        <Link to="/dashboard/admin/users/promote" className="bg-primary text-black px-4 py-2 rounded-xl font-label-mono text-xs font-bold">
          Promote User
        </Link>
      </div>
      <div className="glass-card p-6 border-white/5 rounded-2xl">
        <p className="text-on-surface-variant">Use the promotion page to upgrade a profile to admin and grant access to both dashboard areas.</p>
      </div>
    </div>
  );
}
