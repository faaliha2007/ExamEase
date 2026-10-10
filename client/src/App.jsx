import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

// Pages
import { LandingPage } from './pages/LandingPage';
import { DemoLoginPage } from './pages/DemoLoginPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { BookingFlowPage } from './pages/BookingFlowPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminBookingDetailPage } from './pages/AdminBookingDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-[#fbfbfa] text-slate-900 selection:bg-blue-100 selection:text-blue-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public & Candidate Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<DemoLoginPage />} />
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/book" element={<BookingFlowPage />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route path="/bookings/:id" element={<BookingDetailsPage />} />

              {/* Administrator Routes */}
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/bookings/:id" element={<AdminBookingDetailPage />} />

              {/* Error & Fallback Routes */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/404" element={<NotFoundPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
