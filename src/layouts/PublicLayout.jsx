import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import Footer from '../components/Footer';

export default function PublicLayout() {
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col justify-between overflow-x-hidden">
      <TopNavBar />
      <main className="relative pt-16 md:pt-20 flex-grow overflow-x-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
