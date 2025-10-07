import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

type PageState = 'form' | 'pending' | 'rejected';

const EyeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EyeOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);

const LoginOwnerPage: React.FC = () => {
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();
  const [pageState, setPageState] = useState<PageState>('form');

  // Effect to check if a user is already logged in but not approved
  useEffect(() => {
    if (user && user.role === Role.CANTEEN_OWNER) {
        if (user.approvalStatus === 'pending') setPageState('pending');
        else if (user.approvalStatus === 'rejected') setPageState('rejected');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(phoneOrEmail, password);
      
      if (loggedInUser.role === Role.ADMIN) {
        navigate('/admin/dashboard');
        return;
      }
      
      if (loggedInUser.role === Role.CANTEEN_OWNER) {
        if (loggedInUser.approvalStatus === 'approved') {
          navigate('/owner/dashboard');
        } else if (loggedInUser.approvalStatus === 'pending') {
          setPageState('pending');
        } else {
          setPageState('rejected');
        }
      } else {
        setError('Access denied. This portal is for partners and admins only.');
        logout();
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
      switch(pageState) {
          case 'pending':
              return (
                   <div className="text-center text-white animate-fade-in-down">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h2 className="text-3xl font-bold font-heading">Awaiting Approval</h2>
                        <p className="text-gray-300 mt-2 mb-6">
                            Your account requires administrator approval. You will be notified once it's active.
                        </p>
                        <button onClick={() => { logout(); setPageState('form'); }} className="text-sm text-gray-400 hover:underline">
                            Logout
                        </button>
                   </div>
              );
          case 'rejected':
              return (
                  <div className="text-center text-white animate-fade-in-down">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <h2 className="text-3xl font-bold font-heading">Access Denied</h2>
                      <p className="text-gray-300 mt-2 mb-6">
                          Unfortunately, your registration request has been rejected. Please contact support for more information.
                      </p>
                      <button onClick={() => { logout(); setPageState('form'); }} className="text-sm text-gray-400 hover:underline">
                          Logout
                      </button>
                  </div>
              );
          case 'form':
          default:
              return (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-4xl font-bold font-heading text-white">Partner & Admin Login</h2>
                      <p className="text-gray-300 mt-2">Manage your restaurant or the platform.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                        <div>
                            <label className="block text-gray-200 font-semibold mb-2" htmlFor="phoneOrEmail">Email or Phone Number</label>
                            <input type="text" id="phoneOrEmail" name="phoneOrEmail" autoComplete="off" value={phoneOrEmail} onChange={(e) => setPhoneOrEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-800 border-b-2 border-gray-600 text-white rounded-lg focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-500 focus:shadow-[0_0_15px_rgba(129,140,248,0.5)]" placeholder="e.g., mail@example.com" required />
                        </div>
                        <div>
                            <label className="block text-gray-200 font-semibold mb-2" htmlFor="password">Password</label>
                            <div className="relative">
                              <input type={showPassword ? 'text' : 'password'} id="password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 pr-10 bg-gray-800 border-b-2 border-gray-600 text-white rounded-lg focus:outline-none focus:border-indigo-500 transition-all placeholder:text-gray-500 focus:shadow-[0_0_15px_rgba(129,140,248,0.5)]" placeholder="Enter your password" required />
                              <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
                                  aria-label={showPassword ? "Hide password" : "Show password"}
                              >
                                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                              </button>
                            </div>
                        </div>
                         <div className="text-right text-xs -mt-4">
                          <Link to="/forgot-password" className="text-gray-400 hover:underline">Forgot Password?</Link>
                        </div>
                        
                        {error && <p className="text-red-400 text-sm text-center !-mt-2">{error}</p>}
                        
                        <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold font-heading py-3 px-4 rounded-lg shadow-[0_5px_15px_rgba(99,102,241,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] active:scale-95 active:shadow-inner disabled:bg-indigo-400/50 disabled:shadow-none disabled:transform-none">
                          {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="text-center mt-6 space-y-2">
                         <p><Link to="/register-owner" className="text-sm text-indigo-400 hover:text-indigo-300 font-bold font-heading transition-colors">Don't have an account? Register</Link></p>
                        <p><Link to="/" className="text-sm text-gray-400 hover:text-white font-medium transition-colors">Back to Home</Link></p>
                    </div>
                  </>
              );
      }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 overflow-hidden">
       <div className="relative max-w-md w-full bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 animate-pop-in">
          {renderContent()}
       </div>
    </div>
  );
};

export default LoginOwnerPage;