import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getFavouriteItems, removeFromFavourites } from '../../services/mockApi';
import type { MenuItem } from '../../types';

// SVG for empty state
const EmptyFavouritesIcon = () => (
    <svg className="w-24 h-24 text-surface-light mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h.01" />
    </svg>
);

const FavouriteItemCard: React.FC<{ item: MenuItem; onRemove: (itemId: string) => void; }> = ({ item, onRemove }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-surface/50 backdrop-blur-lg border border-surface-light rounded-2xl shadow-lg overflow-hidden group cursor-pointer"
            onClick={() => navigate(`/menu/${item.id}`)}
        >
            <div className="relative">
                <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/40 rounded-full text-red-500 transition-colors hover:bg-black/60"
                    aria-label="Remove from favourites"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
            <div className="p-4">
                <h3 className="font-bold font-heading text-lg truncate text-textPrimary">{item.name}</h3>
                <p className="font-black font-heading text-primary text-xl mt-1">₹{item.price}</p>
            </div>
        </motion.div>
    );
};

const FavouritesPage: React.FC = () => {
    const [favouriteItems, setFavouriteItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchFavourites = useCallback(async () => {
        setLoading(true);
        try {
            const items = await getFavouriteItems();
            setFavouriteItems(items);
        } catch (error) {
            console.error("Failed to fetch favourite items", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFavourites();
    }, [fetchFavourites]);

    const handleRemove = (itemId: string) => {
        removeFromFavourites(itemId);
        setFavouriteItems(prevItems => prevItems.filter(item => item.id !== itemId));
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Removed from Favourites', type: 'cart-warn' } }));
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-9 bg-surface/50 rounded-lg w-1/2 mb-8"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-64 bg-surface/50 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold font-heading mb-6 text-textPrimary" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Your Favourites ❤️
            </h1>
            
            <AnimatePresence>
                {favouriteItems.length > 0 ? (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1
                                }
                            }
                        }}
                        initial="hidden"
                        animate="show"
                    >
                        {favouriteItems.map(item => (
                            <FavouriteItemCard key={item.id} item={item} onRemove={handleRemove} />
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 bg-surface/50 backdrop-blur-lg border border-surface-light rounded-2xl shadow-md"
                    >
                        <EmptyFavouritesIcon />
                        <p className="text-xl font-semibold text-textPrimary">No favourites yet!</p>
                        <p className="text-textSecondary mt-2">Tap the heart icon on any food item to save it here.</p>
                        <button
                            onClick={() => navigate('/menu')}
                            className="mt-6 inline-block bg-primary text-background font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            Browse Menu
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FavouritesPage;
