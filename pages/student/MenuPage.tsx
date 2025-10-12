import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MenuItem, CartItem } from '../../types';
import { getMenu, toggleFavoriteItem, getOwnerStatus } from '../../services/mockApi';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

declare const gsap: any;

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
        <div onClick={() => isAvailable ? onCardClick(id) : window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Currently Out of Stock!', type: 'stock-out' } }))} className={`bg-surface/50 backdrop-blur-lg border border-surface-light rounded-2xl shadow-lg overflow-hidden transition-all duration-300 group hover:shadow-2xl hover:bg-surface-light/30 hover:-translate-y-1 ${!isAvailable ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}>
            <div className="relative">
                <img src={imageUrl} alt={name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
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
                        {averageRating !== undefined && (
                             <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
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
    
    const { user } = useAuth();
    const navigate = useNavigate();

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

    const handleToggleFavorite = async (itemId: string, isFavorited: boolean) => {
        if (!user) return;
        setMenu(prevMenu => prevMenu.map(item => 
            item.id === itemId ? { ...item, isFavorited: !isFavorited, favoriteCount: (item.favoriteCount || 0) + (!isFavorited ? 1 : -1) } : item
        ));
        await toggleFavoriteItem(user.id, itemId);

        const message = !isFavorited ? 'Added to favorites! ❤️' : 'Removed from favorites.';
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type: 'cart-warn' } }));
    };

    const handleAddToCart = useCallback((item: MenuItem) => {
        const cart = getCartFromStorage();
        const existingItem = cart.find(cartItem => cartItem.id === item.id);
        if (existingItem) {
            const newCart = cart.map(cartItem =>
                cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
            );
            saveCartToStorage(newCart);
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Item quantity updated!', type: 'cart-warn' } }));
        } else {
            const newCart = [...cart, { ...item, quantity: 1 }];
            saveCartToStorage(newCart);
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Item Added to Cart!', type: 'cart-add' } }));
        }
        window.dispatchEvent(new CustomEvent('itemAddedToCart'));
    }, []);

    const handleCardClick = (itemId: string) => {
        navigate(`/student/menu/${itemId}`);
    };

    const handleCarouselCardClick = (item: MenuItem, element: HTMLElement) => {
        navigate(`/student/menu/${item.id}`);
    };

    const topSellingItems = useMemo(() => 
        [...menu]
            .filter(item => item.isAvailable)
            .sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0))
            .slice(0, 8), 
        [menu]
    );

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="mb-8">
                    <div className="h-10 bg-surface rounded-lg w-1/3 mb-4"></div>
                    <div className="flex gap-4 overflow-hidden">
                        <div className="w-80 h-48 bg-surface rounded-xl flex-shrink-0"></div>
                        <div className="w-80 h-48 bg-surface rounded-xl flex-shrink-0"></div>
                        <div className="w-80 h-48 bg-surface rounded-xl flex-shrink-0"></div>
                    </div>
                </div>
                <div>
                    <div className="h-10 bg-surface rounded-lg w-1/4 mb-4"></div>
                    <div className="mb-6 h-12 bg-surface rounded-xl"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-72 bg-surface rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            {!isCanteenOnline && (
                <div className="bg-red-500/20 border border-red-400/30 text-center p-3 rounded-lg mb-6 text-red-200 animate-fade-in-down">
                    The canteen is currently offline. All food items are unavailable for ordering.
                </div>
            )}
            
            <PromotionsBanner items={topSellingItems} onCardClick={handleCarouselCardClick} />

            <section>
                <h2 className="text-2xl font-bold font-heading mb-4 text-textPrimary bg-black/50 backdrop-blur-lg px-4 py-2 rounded-lg inline-block border border-surface-light" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Full Menu</h2>
                 <div className="mb-6 bg-surface/50 backdrop-blur-lg p-2 rounded-xl shadow-lg sticky top-[calc(4rem+3.5rem+1rem)] z-30 border border-surface-light flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="SEARCH. EAT. REPEAT."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-grow px-4 py-2 border-none bg-black/20 text-textPrimary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-textSecondary/80 font-black"
                    />
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`flex-shrink-0 p-3 rounded-lg transition-colors ${showFavoritesOnly ? 'bg-red-500/80 text-white' : 'bg-black/20 text-white/70 hover:text-white'}`}
                        aria-label="Show favorites only"
                        title="Show favorites only"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                {filteredMenu.length === 0 && !loading ? (
                    <div className="text-center py-16 bg-surface/50 backdrop-blur-lg rounded-xl shadow-lg border border-surface-light">
                        <p className="text-xl font-semibold text-textPrimary">NO FOOD MATCHES YOUR SEARCH.</p>
                         {showFavoritesOnly && <p className="text-textSecondary mt-2">Try removing the 'favorites only' filter.</p>}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredMenu.map(item => (
                            <MenuItemCard key={item.id} item={item} onCardClick={handleCardClick} onToggleFavorite={handleToggleFavorite} onAddToCart={handleAddToCart} />
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
};

export default MenuPage;
