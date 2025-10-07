import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import DynamicBackground from '../../components/student/DynamicBackground';
import { useAuth } from '../../context/AuthContext';
import { getStudentOrders, updateFirstLoginStatus } from '../../services/mockApi';
import { Order, OrderStatus } from '../../types';

type ToastType = 'cart-add' | 'cart-warn' | 'stock-out' | 'coupon-success' | 'coupon-error' | 'payment-success' | 'payment-error';
interface ToastInfo {
  id: number;
  message: string;
  type: ToastType;
}

const ActiveOrderTracker: React.FC<{ order: Order }> = ({ order }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (order.status !== OrderStatus.PENDING) {
            setTimeLeft('');
            return;
        }

        const PREPARATION_TIME_MS = 15 * 60 * 1000;
        const orderTimestamp = new Date(order.timestamp).getTime();
        const estimatedReadyTime = orderTimestamp + PREPARATION_TIME_MS;

        const timer = setInterval(() => {
            const now = Date.now();
            const distance = estimatedReadyTime - now;

            if (distance > 0) {
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            } else {
                setTimeLeft('00:00');
                clearInterval(timer);
            }
        }, 1000);
        
        const initialDistance = estimatedReadyTime - Date.now();
        if (initialDistance > 0) {
            const minutes = Math.floor((initialDistance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((initialDistance % (1000 * 60)) / 1000);
            setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        } else {
             setTimeLeft('00:00');
        }

        return () => clearInterval(timer);
    }, [order]);
    
    const isPrepared = order.status === OrderStatus.PREPARED;
    const isPending = order.status === OrderStatus.PENDING;

    return (
        <div className={`
            ${isPrepared ? 'bg-green-500/80 text-white' : 'bg-student-accent/80 text-student-bg-dark'}
            backdrop-blur-sm animate-fade-in-down shadow-lg
        `}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 text-center">
                {isPrepared && (
                    <p className="font-black">
                        🔥 Your order #{order.id.slice(-6)} is ready for pickup!
                    </p>
                )}
                {isPending && (
                    <p className="font-semibold">
                        🧑‍🍳 Your order #{order.id.slice(-6)} is being prepared. Estimated time remaining: {timeLeft}
                    </p>
                )}
            </div>
        </div>
    );
};

// --- Icon Components ---
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
// Primary Nav Icons
const MenuBoardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const CartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
const HistoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);
// Drawer Icons
const ProfileIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5 mr-3" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const RewardsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-12v4m-2-2h4m5 4v4m-2-2h4M17 3l4 4M3 17l4 4m14-4l-4-4M7 3l-4 4" /></svg>);
const CouponsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>);
const FeedbackDrawerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>);
const LogoutIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);

// --- Toast Icons ---
const ToastCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const AnimatedCheckIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
        strokeDasharray="24" strokeDashoffset="24" className="animate-draw-check" />
    </svg>
);

const greetings = [
    "HUNGRY?",
    "ORDER. EAT. REPEAT.",
    "WHAT'S THE CRAVING?",
    "FEED THE BEAST.",
];

const StudentLayout: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);
  const location = useLocation();

  const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'denied');
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  const greeting = useMemo(() => greetings[Math.floor(Math.random() * greetings.length)], []);

  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowDemoModal(true);
    }
  }, [user]);

  useEffect(() => {
    const handleItemAdded = () => {
        setIsCartAnimating(true);
        setTimeout(() => setIsCartAnimating(false), 600);
    };
    window.addEventListener('itemAddedToCart', handleItemAdded);
    return () => window.removeEventListener('itemAddedToCart', handleItemAdded);
  }, []);

   useEffect(() => {
    const handleShowToast = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        setActiveToast({ id: Date.now(), ...detail }); 
    };
    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleStartDemo = () => {
    setShowDemoModal(false);
    navigate('/student/demo-menu');
  };

  const handleSkipDemo = async () => {
    if (user) {
        await updateFirstLoginStatus(user.id);
        updateUser({ isFirstLogin: false });
        setShowDemoModal(false);
    }
  };

  const primaryNavLinks = [
    { to: "/student/menu", icon: <MenuBoardIcon />, label: "Menu" },
    { to: "/student/cart", icon: <CartIcon />, label: "Cart/QR" },
    { to: "/student/history", icon: <HistoryIcon />, label: "History" },
  ];
  
  const drawerNavLinks = [
    { to: "/student/profile", icon: <ProfileIcon />, label: "Profile" },
    { to: "/student/rewards", icon: <RewardsIcon />, label: "Rewards" },
    { to: "/student/coupons", icon: <CouponsIcon />, label: "Coupons" },
    { to: "/student/feedback", icon: <FeedbackDrawerIcon />, label: "Feedback" },
  ];
  
  const DrawerNavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => (
    <NavLink
        to={to}
        onClick={() => setIsDrawerOpen(false)}
        className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg text-lg font-medium transition-colors ${
            isActive ? 'bg-student-accent text-student-bg-dark font-black' : 'text-student-text-secondary hover:bg-student-card-hover hover:text-white'
            }`
        }
    >
        {icon} {label}
    </NavLink>
  );

  useEffect(() => { if (notificationPermission === 'default') setShowPermissionBanner(true); }, [notificationPermission]);

  const fetchActiveOrder = useCallback(async () => {
    if (user) {
        try {
            const orders = await getStudentOrders(user.id);
            const currentActiveOrder = orders.find(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARED) || null;

            setActiveOrder(prevActiveOrder => {
                if (
                    notificationPermission === 'granted' &&
                    currentActiveOrder &&
                    prevActiveOrder &&
                    currentActiveOrder.id === prevActiveOrder.id &&
                    prevActiveOrder.status === OrderStatus.PENDING &&
                    currentActiveOrder.status === OrderStatus.PREPARED
                ) {
                    new Notification('Order is ready for pickup!', {
                        body: `Your order #${currentActiveOrder.id.slice(-6)} is prepared.`,
                        icon: '/favicon.ico'
                    });
                }
                return currentActiveOrder;
            });
        } catch (error) { console.error("Failed to fetch active order", error); }
    }
  }, [user, notificationPermission]);

  useEffect(() => {
    fetchActiveOrder();
    const intervalId = setInterval(fetchActiveOrder, 5000);
    return () => clearInterval(intervalId);
  }, [fetchActiveOrder]);

  const handleRequestPermission = async () => {
      if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          setShowPermissionBanner(false);
      }
  };

  const getToastStyles = (type: ToastType) => {
    switch(type) {
      case 'cart-add': return { bg: 'bg-toast-cart-add', icon: <div className="animate-cart-icon-slide"><ToastCartIcon/></div>, glow: 'shadow-[0_0_20px_rgba(190,24,93,0.5)]' };
      case 'cart-warn': return { bg: 'bg-toast-cart-warn', icon: '⚠️', glow: 'shadow-[0_0_20px_rgba(252,163,17,0.5)]' };
      case 'stock-out': return { bg: 'bg-toast-stock-out', icon: '❌', glow: 'shadow-[0_0_20px_rgba(185,28,28,0.5)]' };
      case 'coupon-success': return { bg: 'bg-toast-coupon-success', icon: '🎉', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.5)]' };
      case 'coupon-error': return { bg: 'bg-toast-coupon-error', icon: <div className="animate-shake-toast-icon">❌</div>, glow: 'shadow-[0_0_20px_rgba(239,68,68,0.4)]' };
      case 'payment-success': return { bg: 'bg-toast-payment-success backdrop-blur-md', icon: <AnimatedCheckIcon />, glow: 'shadow-[0_0_20px_rgba(34,197,94,0.6)]' };
      case 'payment-error': return { bg: 'bg-toast-payment-error', icon: '🚫', glow: 'shadow-[0_0_20px_rgba(185,28,28,0.5)]' };
      default: return { bg: 'bg-gray-700', icon: '🔔', glow: '' };
    }
  };


  return (
    <div className="flex flex-col min-h-screen font-sans text-student-text-primary">
      <DynamicBackground />
      <div className="absolute inset-0 bg-student-bg-dark/40 -z-40"></div>

       {/* Global Toast Notification */}
      {activeToast && (
        <div key={activeToast.id} className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm pointer-events-none">
          <div 
            onAnimationEnd={() => setActiveToast(null)}
            className={`
              flex items-center gap-4 p-3 pr-4 rounded-full shadow-lg text-white font-bold 
              border border-white/20 animate-toast ${getToastStyles(activeToast.type).bg} ${getToastStyles(activeToast.type).glow}
            `}
          >
            <span className="flex-shrink-0 h-8 w-8 rounded-full bg-black/20 flex items-center justify-center text-xl">
              {getToastStyles(activeToast.type).icon}
            </span>
            <p className="flex-grow text-sm">{activeToast.message}</p>
          </div>
        </div>
      )}

       {/* Drawer Overlay */}
       <div
          className={`fixed inset-0 bg-black/60 z-50 transition-opacity duration-300 ${isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsDrawerOpen(false)}
      />

      {/* Side Drawer */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-student-bg-dark/90 backdrop-blur-xl border-r border-student-card-border shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between p-4 border-b border-student-card-border h-16">
              <h2 className="text-xl font-bold font-heading text-student-accent">Zero✦Degree</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-white">
                  <CloseIcon />
              </button>
          </div>
          <div className="p-4 flex flex-col h-[calc(100%-4rem)]">
              <div className="flex-grow space-y-2">
                  {drawerNavLinks.map(link => <DrawerNavLink key={link.to} {...link} />)}
              </div>
          </div>
      </aside>

       {/* Header */}
      <header className="bg-student-bg-dark/60 backdrop-blur-lg sticky top-0 z-40 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-student-card-border">
        <div className="flex items-center gap-4">
            <button onClick={() => setIsDrawerOpen(true)} className="text-gray-300 hover:text-white">
              <MenuIcon />
            </button>
            <h1 className="text-xl font-black font-heading text-student-text-primary" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{greeting}</h1>
        </div>
      </header>
       
      {/* Desktop Primary Nav */}
       <nav className="hidden sm:flex justify-center items-center gap-8 bg-student-bg-dark/70 backdrop-blur-lg border-b border-student-card-border sticky top-16 z-30 h-14">
            {primaryNavLinks.map(link => (
                <NavLink 
                    key={link.to}
                    to={link.to} 
                    className={({ isActive }) =>
                        `flex items-center gap-2 font-medium border-b-2 transition-colors px-2 py-1 ${
                        isActive ? 'border-student-accent text-student-accent' : 'border-transparent text-student-text-secondary hover:text-white'
                        }`
                    }
                >
                    {link.icon}
                    <span>{link.label}</span>
                </NavLink>
            ))}
            <button
                onClick={handleLogout}
                className="flex items-center gap-2 font-medium text-student-text-secondary hover:text-white transition-colors"
            >
                <LogoutIcon />
                <span>Logout</span>
            </button>
        </nav>

       {activeOrder && <ActiveOrderTracker order={activeOrder} />}

      {showPermissionBanner && (
        <div className="bg-student-accent/80 backdrop-blur-sm border-b-2 border-student-accent-dark/20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
                <p className="text-sm text-student-bg-dark font-semibold">Enable notifications for real-time order updates!</p>
                <div>
                    <button onClick={handleRequestPermission} className="bg-student-bg-dark text-student-text-primary font-semibold px-3 py-1 text-sm rounded-md hover:bg-gray-800">Enable</button>
                    <button onClick={() => setShowPermissionBanner(false)} className="ml-2 text-student-bg-dark font-semibold text-sm px-2 py-1">Dismiss</button>
                </div>
            </div>
        </div>
      )}
      
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
        <div key={location.pathname}>
            <Outlet />
        </div>
      </main>

      {/* Bottom navigation for small screens */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-student-bg-dark/80 backdrop-blur-lg shadow-lg border-t border-student-card-border z-40">
        <div className="flex justify-around items-center h-16">
            {primaryNavLinks.map(link => 
              <NavLink 
                key={link.to}
                to={link.to} 
                id={link.to === '/student/cart' ? 'cart-icon-wrapper' : undefined}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 w-full text-student-text-secondary hover:text-white transition-colors font-medium p-2 rounded-md ${
                    isActive ? 'text-student-accent' : ''
                  } ${link.to === '/student/cart' && isCartAnimating ? 'animate-cart-bounce' : ''}`
                }
              >
                {link.icon}
                <span className="text-xs">{link.label}</span>
              </NavLink>
            )}
             <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center gap-1 w-full text-student-text-secondary hover:text-white transition-colors font-medium p-2 rounded-md"
            >
              <LogoutIcon />
              <span className="text-xs">Logout</span>
            </button>
        </div>
      </nav>

        {/* Demo Welcome Modal */}
        {showDemoModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                <div className="bg-student-bg-dark border border-student-card-border p-8 rounded-lg shadow-xl w-full max-w-sm text-center text-student-text-primary animate-fade-in-down">
                    <h2 className="text-2xl font-bold font-heading text-student-accent mb-4">Try a Demo Order!</h2>
                    <p className="text-student-text-secondary mb-6">
                        Since this is your first time, you can try booking a demo food to understand how Zero✦Degree works. No real payment will be charged.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={handleSkipDemo} className="bg-student-card-hover text-white font-bold font-heading py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors w-full sm:w-auto">
                            Skip for Now
                        </button>
                        <button onClick={handleStartDemo} className="btn-3d w-full sm:w-auto bg-student-accent border-student-accent-dark text-student-bg-dark font-black font-heading py-3 px-6 rounded-lg transition-transform hover:-translate-y-1">
                            Start Demo
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default StudentLayout;