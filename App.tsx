

import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import LoadingScreen from './components/common/LoadingScreen';

// Common pages
import LoginCustomerPage from './pages/LoginStudentPage';
import RegisterCustomerPage from './pages/RegisterStudentPage';
import LoginOwnerPage from './pages/LoginOwnerPage';
import RegisterOwnerPage from './pages/RegisterOwnerPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';

// Customer pages
import WelcomePage from './pages/student/WelcomePage';
import CustomerLayout from './pages/student/StudentLayout';
import MenuPage from './pages/student/MenuPage';
import FoodDetailPage from './pages/student/FoodDetailPage';
import CartPage from './pages/student/CartPage';
import OrderSuccessPage from './pages/student/OrderSuccessPage';
import OrderHistoryPage from './pages/student/OrderHistoryPage';
import FeedbackPage from './pages/student/FeedbackPage';
import CouponsPage from './pages/student/CouponsPage';
import ProfilePage from './pages/student/ProfilePage';
import RewardsPage from './pages/student/RewardsPage';

// Canteen Owner pages
import OwnerLayout from './pages/owner/OwnerLayout';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import ScanQrPage from './pages/owner/ScanQrPage';
import FoodPopularityPage from './pages/owner/FoodPopularityPage';
import RewardsManagementPage from './pages/owner/RewardsManagementPage';
import DailySpecialsPage from './pages/owner/DailySpecialsPage';
import OwnerFeedbackPage from './pages/owner/FeedbackPage';
import OffersPage from './pages/owner/OffersPage';
import ScanApprovalPage from './pages/owner/ScanApprovalPage';
import ScanOnlyPage from './pages/owner/ScanOnlyPage';
import ScanTerminalLoginPage from './pages/owner/ScanTerminalLoginPage';
import ScanTerminalHomePage from './pages/owner/ScanTerminalHomePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ApprovalPage from './pages/admin/ApprovalPage';


interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login-customer" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
     return <Navigate to="/404" replace />;
  }

  if (user.role === Role.CANTEEN_OWNER && user.approvalStatus !== 'approved') {
      return <Navigate to="/login-owner" replace />;
  }

  return <>{children}</>;
};


const AppRoutes = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }
    
    const HomeRedirect = () => {
        if (!user) {
            return <Navigate to="/login-customer" replace />;
        }

        switch (user.role) {
            case Role.STUDENT:
                return <Navigate to="/customer/menu" replace />;
            case Role.CANTEEN_OWNER:
                if (user.approvalStatus !== 'approved') {
                    return <Navigate to="/login-owner" replace />;
                }
                return user.canteenName
                    ? <Navigate to="/owner/dashboard" replace />
                    : <Navigate to="/scan-terminal/home" replace />;
            case Role.ADMIN:
                return <Navigate to="/admin/dashboard" replace />;
            default:
                return <Navigate to="/login-customer" replace />;
        }
    };

    return (
        <Routes>
            <Route path="/" element={<HomeRedirect />} />
            
            {/* Public routes accessible without login */}
            <Route path="/login-customer" element={user ? <Navigate to="/" replace /> : <LoginCustomerPage />} />
            <Route path="/register-customer" element={user ? <Navigate to="/" replace /> : <RegisterCustomerPage />} />
            <Route path="/login-owner" element={user ? <Navigate to="/" replace /> : <LoginOwnerPage />} />
            <Route path="/register-owner" element={user ? <Navigate to="/" replace /> : <RegisterOwnerPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/terms" element={<TermsAndConditionsPage />} />
            <Route path="/owner/scan-terminal" element={user ? <Navigate to="/" replace /> : <ScanTerminalLoginPage />} />

            {/* Customer Routes */}
            <Route path="/customer/welcome" element={
                <ProtectedRoute allowedRoles={[Role.STUDENT]}>
                    <WelcomePage />
                </ProtectedRoute>
            } />
            <Route path="/customer" element={
                <ProtectedRoute allowedRoles={[Role.STUDENT]}>
                    <CustomerLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="menu" replace />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="menu/:itemId" element={<FoodDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="history" element={<OrderHistoryPage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="rewards" element={<RewardsPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Canteen Owner Routes */}
            <Route path="/owner" element={
                <ProtectedRoute allowedRoles={[Role.CANTEEN_OWNER]}>
                    <OwnerLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="scan" element={<ScanQrPage />} />
                <Route path="popularity" element={<FoodPopularityPage />} />
                <Route path="rewards" element={<RewardsManagementPage />} />
                <Route path="menu" element={<DailySpecialsPage />} />
                <Route path="feedback" element={<OwnerFeedbackPage />} />
                <Route path="offers" element={<OffersPage />} />
            </Route>
            
            {/* Standalone Scan Terminal page */}
            <Route path="/scan-terminal/home" element={
                 <ProtectedRoute allowedRoles={[Role.CANTEEN_OWNER]}>
                    <ScanTerminalHomePage />
                </ProtectedRoute>
            } />
            
            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={
                 <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <AdminDashboard />
                </ProtectedRoute>
            } />
            <Route path="/admin/approvals" element={
                 <ProtectedRoute allowedRoles={[Role.ADMIN]}>
                    <ApprovalPage />
                </ProtectedRoute>
            } />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full overflow-x-hidden font-sans bg-background text-textPrimary">
      <AuthProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </div>
  );
};

export default App;
