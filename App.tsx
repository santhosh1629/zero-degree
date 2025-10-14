

import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import LoadingScreen from './components/common/LoadingScreen';

// Common pages
import HomePage from './pages/HomePage';
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
import DemoMenuPage from './pages/student/DemoMenuPage';
import DemoOrderCollectedPage from './pages/student/DemoOrderSuccessPage';

// Canteen Owner pages
import OwnerLayout from './pages/owner/OwnerLayout';
import OwnerDashboard from './pages/owner/OwnerDashboard';
import ScanQrPage from './pages/owner/ScanQrPage';
import FoodPopularityPage from './pages/owner/FoodPopularityPage';
import RewardsManagementPage from './pages/owner/RewardsManagementPage';
import DailySpecialsPage from './pages/owner/DailySpecialsPage';
import OwnerFeedbackPage from './pages/owner/FeedbackPage';
import OffersPage from './pages/owner/OffersPage';
import DemoOrdersPage from './pages/owner/DemoOrdersPage';
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
    return <Navigate to="/" replace />;
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
    const { user } = useAuth();

    const getHomeComponent = () => {
        if (!user) return <HomePage />;
        switch (user.role) {
            case Role.STUDENT:
                return <Navigate to="/customer/welcome" replace />;
            case Role.CANTEEN_OWNER:
                 if (user.approvalStatus !== 'approved') {
                    return <Navigate to="/login-owner" replace />;
                }
                // Differentiate between full owner and scan-only staff
                if (user.canteenName) {
                    return <Navigate to="/owner/dashboard" replace />;
                } else {
                    return <Navigate to="/scan-terminal/home" replace />;
                }
            case Role.ADMIN:
                return <Navigate to="/admin/dashboard" replace />;
            default:
                return <HomePage />;
        }
    };
    
    return (
        <Routes>
            <Route path="/" element={getHomeComponent()} />
            <Route path="/login-customer" element={<LoginCustomerPage />} />
            <Route path="/register-customer" element={<RegisterCustomerPage />} />
            <Route path="/login-owner" element={<LoginOwnerPage />} />
            <Route path="/register-owner" element={<RegisterOwnerPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/terms" element={<TermsAndConditionsPage />} />
            
            {/* Standalone Customer Welcome Page */}
            <Route path="/customer/welcome" element={
                <ProtectedRoute allowedRoles={[Role.STUDENT]}>
                    <WelcomePage />
                </ProtectedRoute>
            } />

            {/* Customer Routes */}
            <Route path="/customer" element={
                <ProtectedRoute allowedRoles={[Role.STUDENT]}>
                    <CustomerLayout />
                </ProtectedRoute>
            }>
                <Route path="menu" element={<MenuPage />} />
                <Route path="menu/:itemId" element={<FoodDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="demo-menu" element={<DemoMenuPage />} />
                <Route path="demo-order-collected/:orderId" element={<DemoOrderCollectedPage />} />
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
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="scan" element={<ScanQrPage />} />
                <Route path="demo-orders" element={<DemoOrdersPage />} />
                <Route path="popularity" element={<FoodPopularityPage />} />
                <Route path="rewards" element={<RewardsManagementPage />} />
                <Route path="menu" element={<DailySpecialsPage />} />
                <Route path="feedback" element={<OwnerFeedbackPage />} />
                <Route path="offers" element={<OffersPage />} />
            </g-4>

            {/* Standalone Owner pages */}
            <Route path="/owner/scan-approval" element={<ScanApprovalPage />} />
            <Route path="/owner/scan-terminal" element={<ScanTerminalLoginPage />} />
            <Route path="/owner/scan-only" element={
                 <ProtectedRoute allowedRoles={[Role.CANTEEN_OWNER]}>
                    <ScanOnlyPage />
                </ProtectedRoute>
            } />

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