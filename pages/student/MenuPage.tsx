
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MenuItem, CartItem } from '../../types';
import { getMenu, toggleFavoriteItem, getOwnerStatus } from '../../services/mockApi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

declare const gsap: any;
declare const ScrollTrigger: any;

const getCartFromStorage = (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const PromotionsBanner: React.FC<{ items: MenuItem[]; onCardClick: (item: MenuItem, element: HTMLElement) => void; }> = ({ items, onCardClick }) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof gsap === 'undefined' || !scrollerRef.current || !wrapperRef.current) return;

        const scroller = scrollerRef.current;
        const cards = Array.from(scroller.children) as HTMLElement[];
        if(cards.length === 0) return;

        // Duplicate for seamless loop
        cards.forEach((item: HTMLElement) => {
            const clone = item.cloneNode(true) as HTMLElement;
            clone.setAttribute('aria-hidden', 'true');
            scroller.appendChild(clone);
        });

        // GSAP Animations
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ repeat: -1 });
            tl.to(scroller, {
                xPercent: -50,
                duration: cards.length * 5, // Slower scroll for banner feel
                ease: 'none',
            });
            
            wrapperRef.current?.addEventListener('mouseenter', () => tl.pause());
            wrapperRef.current?.addEventListener('mouseleave', () => tl.play());

        }, wrapperRef);

        return () => ctx.revert();
    }, [items]);
    
    return (
        <section className="mb-8" ref={wrapperRef}>
             <h2 className="text-2xl font-bold font-heading mb-4 text-textPrimary inline-block relative bg-black/50 backdrop-blur-lg px-4 py-2 rounded-lg border border-surface-light" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                🔥 Daily Offers & Bestsellers
            </h2>
            <div className="w-full overflow-hidden mask-gradient">
                 <div ref={scrollerRef} className="flex gap-6 w-max py-4">
                    {items.map(item => (
                        <div key={item.id} onClick={(e) => onCardClick(item, e.currentTarget)} className="w-80 h-48 bg-surface/50 backdrop-blur-lg border border-surface-light rounded-xl shadow-lg overflow-hidden cursor-pointer flex-shrink-0 group transform transition-transform hover:scale-105 hover:shadow-2xl flex">
                            <img src={item.imageUrl} alt={item.name} className="w-1/2 h-full object-cover"/>
                            <div className="p-4 flex flex-col justify-center w-1/2 text-textPrimary">
                                <h3 className="font-bold font-heading text-lg">{item.name}</h3>
                                <p className="font-black font-heading text-primary text-2xl mt-2">₹{item.price}</p>
                                <span className="text-textSecondary text-sm font-semibold mt-auto opacity-0 group-hover:opacity-100 transition-opacity">Order Now &rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <style>{`
                .mask-gradient {
                    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
                    mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
                }
            `}</style>
        </section>
    );
};

const MenuItemCard: React.FC<{ 
    item: MenuItem; 
    onCardClick: (itemId: string) => void;
    onToggleFavorite: (itemId: string, isFavorited: boolean) => void;
    onAddToCart: (item: MenuItem) => void;
}> = ({ item, onCardClick, onToggleFavorite, onAddToCart }) => {
    const { id, name, price, isAvailable, imageUrl, averageRating, isFavorited, emoji, isCombo } = item;
    const [isAdding, setIsAdding] = useState(false);
    const [isAnimatingFavorite, setIsAnimatingFavorite] = useState(false);

    const handleAddToCartClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isAvailable) return;
        onAddToCart(item);
        setIsAdding(true);
        setTimeout(() => setIsAdding(false), 700); // Animation duration
    };

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isFavorited) { // Animate only when adding
            setIsAnimatingFavorite(true);
            setTimeout(() => setIsAnimatingFavorite(false), 500);
        }
        onToggleFavorite(id, isFavorited ?? false);
    };
    
    return (
        <div onClick={() => isAvailable ? onCardClick(id) : window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Currently Out of Stock!', type: 'stock-out' } }))} className={`bg-surface/50 backdrop-blur-lg border border-surface-light rounded-2xl shadow-lg overflow-hidden transition-transform,box-shadow,background-color duration-300 hover:shadow-2xl hover:bg-surface-light/30 hover:-translate-y-1 ${!isAvailable ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}>
            <div className="relative">
                <img src={imageUrl} alt={name} className="w-full h-40 object-cover" />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${isAvailable ? 'bg-green-600/80' : 'bg-red-600/80'} backdrop-blur-sm`}>
                        {isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                    </span>
                    {isCombo && <span className="text-xs font-bold px-2 py-1 rounded-full bg-primary/80 text-background backdrop-blur-sm">COMBO</span>}
                </div>
                <button 
                    onClick={handleFavoriteClick}
                    className="absolute top-2 right-2 bg-black/30 backdrop-blur-sm p-2 rounded-full text-2xl transition-transform hover:scale-125 active:scale-90"
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                    <span className={isAnimatingFavorite ? 'animate-heart-pop block' : 'block'}>
                        {isFavorited ? '❤️' : '🤍'}
                    </span>
                </button>
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold font-heading text-lg">Unavailable</span>
                    </div>
                )}
            </div>
            <div className="p-4 text-textPrimary">
                <h3 className="font-bold font-heading text-lg truncate">{emoji} {name}</h3>
                <div className="flex justify-between items-center mt-2">
                    <p className="font-black font-heading text-primary text-xl">₹{price}</p>
                    <div className="flex items-center gap-3">
                        {averageRating != null && (
                             <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588 1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-sm font-semibold text-textSecondary">{averageRating.toFixed(1)}</span>
                            </div>
                        )}
                        {isAvailable && (
                            <button
                                onClick={handleAddToCartClick}
                                className={`bg-primary text-background font-black rounded-full p-2 transition-transform duration-200 hover:scale-110 active:scale-95 ${isAdding ? 'animate-cart-bounce' : ''}`}
                                aria-label="Add to cart"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MenuPage: React.FC = () => {
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [filteredMenu, setFilteredMenu] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [isCanteenOnline, setIsCanteenOnline] = useState(true);
    const [showPermissionBanner, setShowPermissionBanner] = useState(false);
    
    // State for pull-to-refresh
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullPosition, setPullPosition] = useState(0);
    const touchStartRef = useRef<number | null>(null);
    const PULL_THRESHOLD = 80;

    const { user } = useAuth();
    const navigate = useNavigate();
    const menuGridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            setShowPermissionBanner(true);
        }
    }, []);

    const handleRequestPermission = async () => {
        if ('Notification' in window) {
            await Notification.requestPermission();
            setShowPermissionBanner(false);
        }
    };

    const fetchPageData = useCallback(async () => {
        if (user) {
            try {
                const [menuItems, ownerStatus] = await Promise.all([
                    getMenu(user.id),
                    getOwnerStatus()
                ]);
                setMenu(menuItems);
                setIsCanteenOnline(ownerStatus.isOnline);
            } catch (error) {
                console.error("Failed to fetch page data", error);
            }
        }
    }, [user]);

    // Pull-to-refresh logic
    useEffect(() => {
        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                touchStartRef.current = e.touches[0].clientY;
            } else {
                touchStartRef.current = null;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (touchStartRef.current === null || isRefreshing) return;
            const pullDistance = e.touches[0].clientY - touchStartRef.current;
            if (pullDistance > 0) {
                e.preventDefault(); // Prevent native pull-to-refresh and overscroll
                setPullPosition(pullDistance);
            }
        };

        const handleTouchEnd = () => {
            if (touchStartRef.current === null) return;
            
            const finalPullPosition = pullPosition;
            touchStartRef.current = null;
            
            if (finalPullPosition > PULL_THRESHOLD && !isRefreshing) {
                setIsRefreshing(true);
                fetchPageData().finally(() => {
                    setTimeout(() => {
                        setIsRefreshing(false);
                        setPullPosition(0);
                    }, 500); // Keep spinner for a bit for better UX
                });
            } else if (!isRefreshing) {
                setPullPosition(0); // Snap back if not pulled enough
            }
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        
        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [fetchPageData, isRefreshing, pullPosition]);

    useEffect(() => {
        const initialFetch = async () => {
            setLoading(true);
            await fetchPageData();
            setLoading(false);
        };
        initialFetch();
        
        const channel = supabase
            .channel('public:menu')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu' }, (payload) => {
                console.log('Menu change received!', payload);
                fetchPageData(); // Refetch data on any change
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchPageData]);


    useEffect(() => {
        let items = [...menu];
        if (showFavoritesOnly) {
            items = items.filter(item => item.isFavorited);
        }
        if (searchTerm) {
            items = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        setFilteredMenu(items);
    }, [menu, searchTerm, showFavoritesOnly]);

    // GSAP Scroll Animation Effect
    useEffect(() => {
        if (loading || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !menuGridRef.current) return;

        gsap.registerPlugin(ScrollTrigger);
        const cards = gsap.utils.toArray(menuGridRef.current.children) as HTMLElement[];
        if (cards.length === 0) return;

        const ctx = gsap.context(() => {
            // Set initial state for cards
            gsap.set(cards, { opacity: 0, y: 50, scale: 0.9 });

            ScrollTrigger.batch(cards, {
                start: "top 90%",
                onEnter: batch => gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    stagger: { each: 0.1, from: "start" },
                    ease: 'power3.out',
                    overwrite: true
                }),
                onLeave: batch => gsap.set(batch, { opacity: 0, y: -50, overwrite: true }),
                onEnterBack: batch => gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power3.out',
                    overwrite: true
                }),
                onLeaveBack: batch => gsap.set(batch, { opacity: 0, y: 50, overwrite: true })
            });
        }, menuGridRef);

        return () => ctx.revert();
    }, [loading, filteredMenu]);

    const handleCardClick = useCallback((item: MenuItem, element: HTMLElement) => {
        navigate(`/customer/menu/${item.id}`);
    }, [navigate]);

    const handleToggleFavorite = useCallback(async (itemId: string, isFavorited: boolean) => {
        if (!user) return;
        
        // Optimistic UI update
        setMenu(prev => prev.map(item => item.id === itemId ? { ...item, isFavorited: !isFavorited, favoriteCount: (item.favoriteCount || 0) + (!isFavorited ? 1 : -1) } : item));
        
        try {
            await toggleFavoriteItem(user.id, itemId);
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            // Revert on error
            setMenu(prev => prev.map(item => item.id === itemId ? { ...item, isFavorited: isFavorited, favoriteCount: (item.favoriteCount || 0) + (isFavorited ? 1 : -1) } : item));
        }
    }, [user]);

    const handleAddToCart = useCallback((item: MenuItem) => {
        const cart = getCartFromStorage();
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        
        let newCart;
        if (existingItem) {
            newCart = cart.map(cartItem => 
                cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
            );
        } else {
            newCart = [...cart, { ...item, quantity: 1 }];
        }
        saveCartToStorage(newCart);

        // Dispatch events for UI feedback
        window.dispatchEvent(new CustomEvent('itemAddedToCart'));
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Item Added to Cart!', type: 'cart-add' } }));
    }, []);

    const promotedItems = useMemo(() => {
        // Simple promotion logic: highest rated available items
        return menu
            .filter(item => item.isAvailable)
            .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
            .slice(0, 10);
    }, [menu]);
    
    return (
        <div>
            {/* Pull-to-refresh indicator */}
            <div style={{ transform: `translateY(${Math.min(pullPosition, PULL_THRESHOLD)}px)`, transition: isRefreshing || pullPosition === 0 ? 'transform 0.3s' : 'none' }} className="fixed top-16 left-0 right-0 z-20 flex justify-center items-center pt-2 pb-4 text-white">
                <div className="bg-surface/50 backdrop-blur-lg p-2 rounded-full shadow-lg">
                    {isRefreshing ? (
                        <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg style={{ transform: `rotate(${Math.min(pullPosition / PULL_THRESHOLD, 1) * 360}deg)` }} className="h-6 w-6 text-white transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M5 9a7 7 0 0110-5.222M19 15a7 7 0 01-10 5.222M20 20v-5h-5" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Notification permission banner */}
            {showPermissionBanner && (
                 <div className="bg-indigo-600/80 backdrop-blur-md text-white p-3 rounded-lg flex items-center justify-between gap-4 mb-6 animate-fade-in-down">
                    <p className="text-sm font-semibold">
                        🔔 Get notified when your order is ready for pickup!
                    </p>
                    <button onClick={handleRequestPermission} className="bg-white text-indigo-600 font-bold text-xs py-1 px-3 rounded-full flex-shrink-0">
                        Enable Notifications
                    </button>
                </div>
            )}
            
            {isCanteenOnline ? (
            <>
            <PromotionsBanner items={promotedItems} onCardClick={handleCardClick} />

            <div className="flex flex-col sm:flex-row gap-4 mb-6 sticky top-16 z-20 bg-background/80 backdrop-blur-md py-4 -mx-4 px-4">
                <input
                    type="text"
                    placeholder="Search for food..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:flex-grow px-4 py-2 bg-surface/80 border border-surface-light text-textPrimary rounded-full focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/70"
                />
                <div className="flex items-center justify-center">
                    <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors text-sm ${showFavoritesOnly ? 'bg-primary text-background' : 'bg-surface/80 text-textSecondary hover:bg-surface-light'}`}>
                        {showFavoritesOnly ? '❤️ Favorites' : '🤍 Show Favorites'}
                    </button>
                </div>
            </div>

            {filteredMenu.length > 0 ? (
                <div ref={menuGridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMenu.map(item => (
                        <MenuItemCard 
                            key={item.id} 
                            item={item} 
                            onCardClick={() => navigate(`/customer/menu/${item.id}`)}
                            onToggleFavorite={handleToggleFavorite}
                            onAddToCart={handleAddToCart}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-textPrimary/80">
                    <p className="text-xl font-semibold">No items found.</p>
                    <p>Try adjusting your search or filter.</p>
                </div>
            )}
            </>
            ) : (
                <div className="text-center py-20 bg-surface/50 backdrop-blur-lg rounded-lg">
                    <h2 className="text-3xl font-bold text-red-400">Canteen is currently offline</h2>
                    <p className="mt-2 text-textPrimary/80">Please check back later.</p>
                </div>
            )}
        </div>
    );
};

export default MenuPage;
