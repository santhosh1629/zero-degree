import React, { useState, useEffect, useCallback } from 'react';
import { getFavouriteItems, removeFromFavourites } from '../../services/mockApi';
import type { MenuItem } from '../../types';
import { Link } from 'react-router-dom';

const FavouritesPage: React.FC = () => {
    const [favouriteItems, setFavouriteItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

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
                <div className="h-9 bg-surface rounded-lg w-1/2 mb-8"></div>
                <div className="space-y-4">
                    <div className="h-24 bg-surface rounded-lg"></div>
                    <div className="h-24 bg-surface rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="text-textPrimary">
            <h1 className="text-3xl font-bold font-heading mb-6" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                Your Favourites ❤️
            </h1>
            
            {favouriteItems.length > 0 ? (
                <div className="space-y-4">
                    {favouriteItems.map(item => (
                        <div key={item.id} className="bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg p-4 flex gap-4 items-center shadow-md animate-fade-in-down">
                            <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                            <div className="flex-grow">
                                <h3 className="font-bold font-heading text-lg">{item.name}</h3>
                                <p className="font-bold font-heading text-primary">₹{item.price}</p>
                            </div>
                            <button 
                                onClick={() => handleRemove(item.id)} 
                                className="bg-red-600/80 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg shadow-md">
                    <p className="text-xl font-semibold">No favourites yet!</p>
                    <p className="text-textSecondary mt-2">Tap the heart icon on any food item to save it here.</p>
                    <Link to="/menu" className="mt-6 inline-block bg-primary text-background font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors">
                        Browse Menu
                    </Link>
                </div>
            )}
        </div>
    );
};

export default FavouritesPage;