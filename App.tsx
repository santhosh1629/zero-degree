

import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Role } from './types';
import LoadingScreen from './components/common/LoadingScreen';
import { supabase } from './services/supabase';

// Common pages
import HomePage from './pages/HomePage';
import LoginOwnerPage from './pages/LoginOwnerPage';
import RegisterOwnerPage from './pages/RegisterOwnerPage';
import NotFoundPage from './pages/NotFoundPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';

// Customer pages
import CustomerLayout from './pages/student/StudentLayout';
import MenuPage from './pages/student/MenuPage';
import FoodDetailPage from './pages/student/FoodDetailPage';
import CartPage from './pages/student/CartPage';
import OrderSuccessPage from './pages/student/OrderSuccessPage';
import OrderHistoryPage from './pages/student/OrderHistoryPage';
import FeedbackPage from './pages/student/FeedbackPage';
import ProfilePage from './pages/student/ProfilePage';
import CouponsPage from './pages/student/CouponsPage';
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
    // Redirect is now only for non-customer roles
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
    
    const RootRedirect = () => {
        if (!user) {
            return <HomePage />;
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
                return <HomePage />;
        }
    };

    return (
        <Routes>
            <Route path="/" element={<RootRedirect />} />
            
            {/* Public routes accessible without login */}
            <Route path="/login-owner" element={user ? <Navigate to="/" replace /> : <LoginOwnerPage />} />
            <Route path="/register-owner" element={user ? <Navigate to="/" replace /> : <RegisterOwnerPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/terms" element={<TermsAndConditionsPage />} />
            <Route path="/owner/scan-terminal" element={user ? <Navigate to="/" replace /> : <ScanTerminalLoginPage />} />

            {/* Customer Routes - now publicly accessible layout, with protection inside pages */}
            <Route path="/customer" element={<CustomerLayout />}>
                <Route index element={<Navigate to="menu" replace />} />
                <Route path="menu" element={<MenuPage />} />
                <Route path="menu/:itemId" element={<FoodDetailPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="order-success/:orderId" element={<OrderSuccessPage />} />
                <Route path="history" element={<OrderHistoryPage />} />
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
  const [dbConnectionError, setDbConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const checkDbConnection = async () => {
      // A simple query to check if a core table exists.
      const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });

      if (error && error.message.includes('relation "public.users" does not exist')) {
        const projectId = supabase.supabaseUrl.split('.')[0].replace('https://', '');
        const sqlEditorLink = `https://supabase.com/dashboard/project/${projectId}/sql`;
        
        setDbConnectionError(
          `<b>Critical Error: Database setup is incomplete.</b> The 'users' table is missing. 
           Please run the SQL schema script provided in your Supabase project's SQL Editor. 
           <a href="${sqlEditorLink}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline; font-weight: bold;">
             Click here to open the SQL Editor.
           </a>`
        );
      }
    };
    checkDbConnection();
  }, []);

  return (
    <div className="min-h-screen w-full overflow-x-hidden font-sans bg-background text-textPrimary">
       {dbConnectionError && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ef4444', // red-500
            color: 'white',
            padding: '16px',
            textAlign: 'center',
            zIndex: 9999,
            fontSize: '14px',
            lineHeight: '1.5',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          dangerouslySetInnerHTML={{ __html: dbConnectionError }}
        />
      )}
      <AuthProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </div>
  );
};

export default App;