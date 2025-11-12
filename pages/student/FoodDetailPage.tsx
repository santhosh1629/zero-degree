import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMenuItemById, getFeedbacks, isFavourited, toggleFavourite } from '../../services/mockApi';
import { useAuth } from '../../context/AuthContext';
import type { MenuItem, Feedback, CartItem } from '../../types';

const getCartFromStorage = (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};


const StarDisplay: React.FC<{ rating: number; reviewCount?: number }> = ({ rating, reviewCount }) => (
    <div className="flex items-center gap-2">
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588 1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
        <span className="text-sm text-white/80 font-semibold">{rating.toFixed(1)}</span>
        {reviewCount !== undefined && <span className="text-sm text-white/70">({reviewCount} reviews)</span>}
    </div>
);

const FoodDetailPage: React.FC = () => {
    const { itemId } = useParams<{ itemId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [item, setItem] = useState<MenuItem | null>(null);
    const [reviews, setReviews] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
    const [isFav, setIsFav] = useState(false);


    useEffect(() => {
        const fetchData = async () => {
            if (!itemId) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [itemData, allReviews] = await Promise.all([
                    getMenuItemById(itemId, user?.id),
                    getFeedbacks()
                ]);

                if (itemData) {
                    setItem(itemData);
                    setReviews(allReviews.filter(r => r.itemId === itemId));
                    setIsFav(isFavourited(itemData.id));
                } else {
                     navigate('/404');
                }
            } catch (error) {
                console.error("Failed to fetch item details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [itemId, user, navigate]);

     const handleAddToCart = useCallback(() => {
        if (!item) return;

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

        window.dispatchEvent(new CustomEvent('itemAddedToCart'));
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: '✅ Item Added to Cart', type: 'cart-add' } }));
    }, [item]);
    
    const handleFavouriteToggle = () => {
        if (!item) return;
        const newState = toggleFavourite(item.id);
        setIsFav(newState);
    };


    if (loading) {
        return (
            <div className="animate-pulse max-w-4xl mx-auto">
                <div className="bg-black/50 backdrop-blur-lg p-6 rounded-lg shadow-lg">
                    <div className="h-48 bg-gray-600/30 rounded-lg mb-6"></div>
                    <div className="h-9 bg-gray-600/30 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-600/30 rounded w-1/2 mb-4"></div>
                    <div className="h-10 bg-gray-600/30 rounded w-1/4"></div>
                </div>
            </div>
        );
    }

    if (!item) {
        return <div className="text-center p-8 bg-black/50 backdrop-blur-lg rounded-lg text-white">Item not found.</div>;
    }

    return (
        <div>
            <div className="p-4 sm:p-6 max-w-4xl mx-auto relative z-10">
                <div className="bg-black/50 backdrop-blur-lg border border-white/20 p-6 rounded-2xl shadow-2xl text-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-80 object-cover rounded-lg shadow-lg"/>
                        <div>
                            <div className="flex items-start justify-between gap-4">
                                <h1 className="text-3xl sm:text-4xl font-extrabold flex-grow">{item.emoji} {item.name}</h1>
                                <button onClick={handleFavouriteToggle} className={`transition-transform duration-200 hover:scale-125 active:scale-95 flex-shrink-0 ${isFav ? 'text-red-500 animate-heart-pop' : 'text-gray-400'}`} aria-label="Add to favourites">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                            {item.averageRating != null && (
                                <div className="mt-2">
                                    <StarDisplay rating={item.averageRating} reviewCount={reviews.length} />
                                </div>
                            )}
                             <p className="text-4xl font-black text-primary mt-4">₹{item.price.toFixed(0)}</p>
                             <div className="mt-6">
                                <button onClick={handleAddToCart} className="w-full bg-accent text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-rose-500/50 transform hover:-translate-y-0.5 hover:bg-rose-600 transition-all text-lg">
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>


                    <div className="mt-6 border-t border-white/20 pt-6">
                        <div className="border-b border-white/20 mb-6">
                            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                                <button onClick={() => setActiveTab('description')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'description' ? 'border-primary text-white' : 'border-transparent text-white/70 hover:text-white'}`}>
                                    Description
                                </button>
                                <button onClick={() => setActiveTab('reviews')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'reviews' ? 'border-primary text-white' : 'border-transparent text-white/70 hover:text-white'}`}>
                                    Reviews ({reviews.length})
                                </button>
                            </nav>
                        </div>

                        {activeTab === 'description' && (
                            <div className="prose prose-invert max-w-none animate-fade-in-down text-white/90">
                                <p>{item.description || 'No description available for this item.'}</p>
                                {item.isCombo && item.comboItems && (
                                    <div className="mt-4">
                                        <h4 className="font-bold">This Combo Includes:</h4>
                                        <ul className="list-disc pl-5">
                                            {item.comboItems.map(ci => <li key={ci.id}>{ci.name}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-6 animate-fade-in-down">
                                {reviews.length > 0 ? reviews.map(review => (
                                    <div key={review.id} className="border-b border-white/20 pb-4">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-white">{review.studentName}</p>
                                            <StarDisplay rating={review.rating} />
                                        </div>
                                        {review.comment && <p className="mt-2 text-white/80 italic">"{review.comment}"</p>}
                                    </div>
                                )) : <p className="text-white">No reviews yet for this item.</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodDetailPage;