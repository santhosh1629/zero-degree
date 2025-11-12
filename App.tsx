import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import LoadingScreen from './components/common/LoadingScreen';

// Common pages
import HomePage from './pages/HomePage';
import LoginOwnerPage from './pages/LoginOwnerPage';
import RegisterOwnerPage from './pages/RegisterOwnerPage';
import NotFoundPage from './pages/NotFoundPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';

// Simplified Customer pages
import CustomerLayout from './pages/student/StudentLayout';
import MenuPage from './pages/student/MenuPage';
import FoodDetailPage from './pages/student/FoodDetailPage';
import CartPage from './pages/student/CartPage';
import OrderSuccessPage from './pages/student/OrderSuccessPage';
import OrderHistoryPage from './pages/student/OrderHistoryPage';
import StudentFeedbackPage from './pages/student/FeedbackPage';
import FavouritesPage from './pages/student/FavouritesPage';


// Canteen Owner pages
import OwnerLayout from './pages/owner/OwnerLayout';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import ScanQrPage from './pages/owner/ScanQrPage';
import FoodPopularityPage from './pages/owner/FoodPopularityPage';
import RewardsManagementPage from './pages/owner/RewardsManagementPage';
import DailySpecialsPage from './pages/owner/DailySpecialsPage';
import OwnerFeedbackPage from './pages/owner/FeedbackPage';
import OffersPage from './pages/owner/OffersPage';
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
    // If no user, redirect to owner login as customer flow is public.
    return <Navigate to="/login-owner" replace />;
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
    
    // This component now only redirects logged-in owners/admins
    const OwnerOrAdminRedirect = () => {
        if (user) {
            switch (user.role) {
                case Role.CANTEEN_OWNER:
                    if (user.approvalStatus !== 'approved') {
                        return <LoginOwnerPage />;
                    }
                    return user.canteenName
                        ? <Navigate to="/owner/dashboard" replace />
                        : <Navigate to="/scan-terminal/home" replace />;
                case Role.ADMIN:
                    return <Navigate to="/admin/dashboard" replace />;
                default:
                     return <HomePage />;
            }
        }
        // If not a logged-in owner/admin, show the home page.
        return <HomePage />;
    };

    return (
        <Routes>
            <Route path="/" element={<OwnerOrAdminRedirect />} />
            
            {/* New Public Customer Routes */}
            <Route element={<CustomerLayout />}>
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/menu/:itemId" element={<FoodDetailPage />} />
                <Route path="/favourites" element={<FavouritesPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="/history" element={<OrderHistoryPage />} />
                <Route path="/feedback" element={<StudentFeedbackPage />} />
            </Route>
            
            {/* Public Owner/Admin Login/Register */}
            <Route path="/login-owner" element={user ? <Navigate to="/" replace /> : <LoginOwnerPage />} />
            <Route path="/register-owner" element={user ? <Navigate to="/" replace /> : <RegisterOwnerPage />} />
            <Route path="/terms" element={<TermsAndConditionsPage />} />
            <Route path="/owner/scan-terminal" element={user ? <Navigate to="/" replace /> : <ScanTerminalLoginPage />} />


            {/* Canteen Owner Routes (Protected) */}
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
            
            {/* Standalone Scan Terminal page (Protected) */}
            <Route path="/scan-terminal/home" element={
                 <ProtectedRoute allowedRoles={[Role.CANTEEN_OWNER]}>
                    <ScanTerminalHomePage />
                </ProtectedRoute>
            } />
            
            {/* Admin Routes (Protected) */}
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