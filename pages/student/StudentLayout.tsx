import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import DynamicBackground from '../../components/student/DynamicBackground';

type ToastType = 'cart-add' | 'cart-warn' | 'stock-out' | 'coupon-success' | 'coupon-error' | 'payment-success' | 'payment-error';
interface ToastInfo {
  id: number;
  message: string;
  type: ToastType;
}

const getCartCountFromStorage = () => {
    try {
        const cart = localStorage.getItem('cart');
        const parsedCart: { quantity: number }[] = cart ? JSON.parse(cart) : [];
        return parsedCart.reduce((total, item) => total + item.quantity, 0);
    } catch {
        return 0;
    }
};

// --- Icon Components ---
const MenuBoardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const CartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);
const HistoryIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);
const FeedbackIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>);


// --- Toast Icons ---
const ToastCartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const AnimatedCheckIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
        strokeDasharray="24" strokeDashoffset="24" className="animate-draw-check" />
    </svg>
);

const CustomerLayout: React.FC = () => {
  const [isCartAnimating, setIsCartAnimating] = useState(false);
  const [activeToast, setActiveToast] = useState<ToastInfo | null>(null);
  const location = useLocation();
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = useCallback(() => {
    const count = getCartCountFromStorage();
    setCartCount(count);
  }, []);

  useEffect(() => {
    updateCartCount(); // Initial count

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'cart') {
            updateCartCount();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('itemAddedToCart', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('itemAddedToCart', updateCartCount);
        window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, [updateCartCount]);

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

  const primaryNavLinks = [
    { to: "/menu", icon: <MenuBoardIcon />, label: "Menu" },
    { to: "/cart", icon: <CartIcon />, label: "Cart" },
    { to: "/history", icon: <HistoryIcon />, label: "History" },
    { to: "/feedback", icon: <FeedbackIcon />, label: "Feedback" },
  ];
  
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
    <div className="flex flex-col min-h-screen font-sans text-textPrimary">
      <DynamicBackground />
      <div className="absolute inset-0 bg-background/40 -z-40"></div>

       {/* Global Toast Notification */}
      {activeToast && (
        <div key={activeToast.id} className="fixed bottom-24 sm:bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm pointer-events-none">
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
       
        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 pt-6 pb-24">
            <div key={location.pathname} className="animate-fade-in-down">
                <Outlet />
            </div>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-surface-light shadow-lg z-30 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-auto sm:rounded-full sm:border sm:bottom-4">
            <div className="flex justify-around items-center h-16 sm:px-4 sm:gap-2">
                {primaryNavLinks.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 w-full transition-colors sm:flex-row sm:w-auto sm:px-4 sm:py-2 sm:rounded-full sm:gap-2 ${
                            isActive ? 'text-primary sm:bg-primary/20' : 'text-textSecondary hover:text-primary'
                            }`
                        }
                    >
                        <div className="relative">
                            <div className={link.to === '/cart' && isCartAnimating ? 'animate-cart-bounce' : ''}>
                                {link.icon}
                            </div>
                             {link.to === '/cart' && cartCount > 0 && (
                                <span className="absolute -top-1 -right-2 h-5 w-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center border-2 border-background">
                                    {cartCount}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium sm:text-sm">{link.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    </div>
  );
};

export default CustomerLayout;
