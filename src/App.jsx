import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Global Components
import AuthModal from './components/AuthModal';

// Public Pages
import Home from './pages/Home';
import Launch from './pages/Launch';
import Premium from './pages/Premium';
import Transparency from './pages/Transparency';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/DataPolicy';
import RiskDisclosure from './pages/RiskDisclosure';
import Documentation from './pages/Documentation';

// User Dashboard Pages
import DashboardHome from './pages/user/DashboardHome';
import LiveLaunches from './pages/user/LiveLaunches';
import UpcomingLaunches from './pages/user/UpcomingLaunches';
import PreviousLaunches from './pages/user/PreviousLaunches';
import MyAllocations from './pages/user/MyAllocations';
import PremiumPage from './pages/user/PremiumPage';
import News from './pages/user/News';
import Settings from './pages/user/Settings';
import LaunchDetails from './pages/user/LaunchDetails';
import PaymentSuccess from './pages/payment/Success';
import PaymentCancelled from './pages/payment/Cancelled';
import NewsPostDetail from './pages/user/NewsPostDetail'; // adjust path

// Courses Pages
import Courses from './pages/user/Courses';
import CourseDetail from './pages/user/CourseDetail';
import ManageCourses from './pages/admin/ManageCourses';
import CreateCourse from './pages/admin/CreateCourse';



// Admin Dashboard Pages
import AdminHome from './pages/admin/AdminHome';
import ManageLaunches from './pages/admin/ManageLaunches';
import CreateLaunch from './pages/admin/CreateLaunch';
import ManageUsers from './pages/admin/ManageUsers';
import ManagePremium from './pages/admin/ManagePremium';
import ManageNews from './pages/admin/ManageNews';
import Analytics from './pages/admin/Analytics';
import Reports from './pages/admin/Reports';
import AdminSettings from './pages/admin/AdminSettings';
import PromoteUser from './pages/admin/PromoteUser';

function App() {
  return (
    <BrowserRouter>
      {/* Global Modals */}
      <AuthModal />

      <Routes>

        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="how-it-works" element={<Launch />} />
          <Route path="pricing" element={<Premium />} />
          <Route path="governance" element={<Transparency />} />
          <Route path="terms" element={<ProtectedRoute><TermsOfService /></ProtectedRoute>} />
          <Route path="privacy" element={<ProtectedRoute><PrivacyPolicy /></ProtectedRoute>} />
          <Route path="risk" element={<ProtectedRoute><RiskDisclosure /></ProtectedRoute>} />
          <Route path="docs" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />
          <Route path="payment/success" element={<PaymentSuccess />} />
          <Route path="payment/cancelled" element={<PaymentCancelled />} />
        </Route>

        {/* User Dashboard */}
        <Route path="/dashboard/user" element={<UserLayout />}>
          <Route index element={<ProtectedRoute><DashboardHome /></ProtectedRoute>} />
          <Route path="live" element={<ProtectedRoute><LiveLaunches /></ProtectedRoute>} />
          <Route path="upcoming" element={<ProtectedRoute><UpcomingLaunches /></ProtectedRoute>} />
          <Route path="allocations" element={<ProtectedRoute><MyAllocations /></ProtectedRoute>} />
          <Route path="launch/:id" element={<ProtectedRoute><LaunchDetails /></ProtectedRoute>} />
          <Route path="previous" element={<ProtectedRoute><PreviousLaunches /></ProtectedRoute>} />
          <Route path="premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} />
          <Route path="news" element={<ProtectedRoute><News /></ProtectedRoute>} />
          <Route path="news/:slug" element={<ProtectedRoute><NewsPostDetail /></ProtectedRoute>} />
          <Route path="courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
          <Route path="courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/dashboard/admin" element={<AdminLayout />}>
          <Route index element={<ProtectedRoute requireRole="admin"><AdminHome /></ProtectedRoute>} />
          <Route path="launches" element={<ProtectedRoute requireRole="admin"><ManageLaunches /></ProtectedRoute>} />
          <Route path="launches/create" element={<ProtectedRoute requireRole="admin"><CreateLaunch /></ProtectedRoute>} />
          <Route path="launches/edit/:id" element={<ProtectedRoute requireRole="admin"><CreateLaunch /></ProtectedRoute>} />
          <Route path="courses" element={<ProtectedRoute requireRole="admin"><ManageCourses /></ProtectedRoute>} />
          <Route path="courses/create" element={<ProtectedRoute requireRole="admin"><CreateCourse /></ProtectedRoute>} />
          <Route path="courses/edit/:id" element={<ProtectedRoute requireRole="admin"><CreateCourse /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute requireRole="admin"><ManageUsers /></ProtectedRoute>} />
          <Route path="users/promote" element={<ProtectedRoute requireRole="admin"><PromoteUser /></ProtectedRoute>} />
          <Route path="premium" element={<ProtectedRoute requireRole="admin"><ManagePremium /></ProtectedRoute>} />
          <Route path="news" element={<ProtectedRoute requireRole="admin"><ManageNews /></ProtectedRoute>} />
          <Route path="analytics" element={<ProtectedRoute requireRole="admin"><Analytics /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute requireRole="admin"><Reports /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute requireRole="admin"><AdminSettings /></ProtectedRoute>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
