import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem, Offer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { placeOrder, placeDemoOrder, getOwnerBankDetails, getOffers } from '../../services/mockApi';

const getCartFromStorage = (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const UpiPayment: React.FC<{ totalAmount: number; onConfirm: () => void; onBack: () => void; isPlacingOrder: boolean; isDemo?: boolean; }> = 
({ totalAmount, onConfirm, onBack, isPlacingOrder, isDemo = false }) => {
    const [canteenUpiId, setCanteenUpiId] = useState('canteen@mockupi');

    useEffect(() => {
        if (isDemo) return;
        const fetchUpiId = async () => {
            try {
                const details = await getOwnerBankDetails();
                if (details.phone) {
                    setCanteenUpiId(`${details.phone}@mockupi`);
                }
            } catch (error) {
                console.error("Failed to fetch owner bank details", error);
            }
        };
        fetchUpiId();
    }, [isDemo]);
    
    const upiLink = `upi://pay?pa=${canteenUpiId}&pn=Zeon%20Food%20Court&am=${totalAmount.toFixed(2)}&cu=INR&tn=OrderPayment`;

    const upiApps = [
        { name: 'Google Pay', link: upiLink, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Google_Pay_Logo.svg/2560px-Google_Pay_Logo.svg.png' },
        { name: 'PhonePe', link: upiLink, logo: 'https://cdn.iconscout.com/icon/free/png-256/free-phonepe-1527393-1292889.png' },
        { name: 'Paytm', link: upiLink, logo: 'https://cdn.iconscout.com/icon/free/png-256/free-paytm-226444.png' },
    ];

    return (
        <div className="bg-student-card backdrop-blur-lg border border-student-card-border rounded-lg shadow-md p-6 max-w-lg mx-auto text-student-text-primary">
            <h2 className="text-2xl font-bold font-heading text-center mb-2">{isDemo ? 'Demo Payment' : 'Complete Your Payment'}</h2>
            
            {isDemo && (
                <p className="text-center text-yellow-300 bg-yellow-500/20 p-2 rounded-md mb-4">
                    This is a demo. No real money will be charged.
                </p>
            )}

            <p className="text-center text-student-text-secondary mb-2">Total Amount: <span className="font-bold font-heading text-student-accent text-3xl">₹{totalAmount.toFixed(2)}</span></p>
            {!isDemo && <p className="text-center text-sm text-student-text-secondary mb-6">Paying to: <span className="font-semibold">{canteenUpiId}</span></p>}

            {!isDemo && <div className="space-y-4 mb-6">
                <p className="text-sm text-center text-student-text-secondary/70">Click on your preferred app to pay, then return here to confirm.</p>
                <div className="grid grid-cols-3 gap-4">
                    {upiApps.map(app => (
                        <a key={app.name} href={app.link} target="_blank" rel="noopener noreferrer" className="bg-black/30 p-3 rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-colors">
                            <img src={app.logo} alt={app.name} className="h-10 object-contain"/>
                            <span className="text-xs font-semibold">{app.name}</span>
                        </a>
                    ))}
                </div>
            </div>}

            <div className="text-center space-y-4">
                 <button 
                    onClick={onConfirm}
                    disabled={isPlacingOrder}
                    className="w-full bg-green-600 text-white font-bold font-heading py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400"
                >
                    {isPlacingOrder ? 'Confirming...' : (isDemo ? 'Confirm Demo Order' : 'I have paid, Confirm Order')}
                </button>
                 <button onClick={onBack} className="text-sm text-student-text-secondary/70 hover:underline">
                    Back to Cart
                </button>
            </div>
        </div>
    );
};

const CartPage: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>(getCartFromStorage());
    const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const toastTimerRef = useRef<number | null>(null);
    
    const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);

    const { user } = useAuth();
    const navigate = useNavigate();
    
    const isDemoOrder = useMemo(() => cart.length > 0 && cart.every(item => item.isDemo), [cart]);
    
    useEffect(() => {
        // Cleanup timer on component unmount
        return () => {
            if (toastTimerRef.current) {
                clearTimeout(toastTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Clear non-demo items if a demo item is added, and vice-versa
        const hasDemo = cart.some(item => item.isDemo);
        const hasReal = cart.some(item => !item.isDemo);

        if (hasDemo && hasReal) {
            const latestItem = cart[cart.length - 1];
            const newCart = latestItem.isDemo ? cart.filter(item => item.isDemo) : cart.filter(item => !item.isDemo);
            updateCart(newCart);
        }
    }, [cart]);


    useEffect(() => {
        const fetchOffers = async () => {
            if (user) {
                try {
                    const offers = await getOffers(user.id);
                    setAvailableOffers(offers);
                } catch (error) {
                    console.error("Failed to fetch available offers", error);
                }
            }
        };
        if (!isDemoOrder) {
            fetchOffers();
        }
    }, [user, isDemoOrder]);

    const updateCart = (newCart: CartItem[]) => {
        // When cart changes, re-evaluate applied coupon
        if (appliedCoupon) {
            const subtotal = newCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            if (subtotal === 0) {
                setAppliedCoupon(null);
            }
        }
        setCart(newCart);
        saveCartToStorage(newCart);
    };

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) {
            handleRemoveItem(itemId);
        } else {
            const newCart = cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item);
            updateCart(newCart);
        }
    };
    
    const handleRemoveItem = (itemId: string) => {
        const newCart = cart.filter(item => item.id !== itemId);
        updateCart(newCart);
    };
    
    const handleNotesChange = (itemId: string, notes: string) => {
        const newCart = cart.map(item => item.id === itemId ? { ...item, notes } : item);
        updateCart(newCart);
    };
    
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    
    const discountAmount = useMemo(() => {
        if (!appliedCoupon) return 0;
        let discount = 0;
        if (appliedCoupon.discountType === 'fixed') {
            discount = appliedCoupon.discountValue;
        } else {
            discount = subtotal * (appliedCoupon.discountValue / 100);
        }
        return Math.min(discount, subtotal);
    }, [subtotal, appliedCoupon]);

    const totalAmount = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

    const handleApplyCoupon = (offer: Offer) => {
        setAppliedCoupon(offer);

        let newDiscountAmount = 0;
        if (offer.discountType === 'fixed') {
            newDiscountAmount = offer.discountValue;
        } else {
            newDiscountAmount = subtotal * (offer.discountValue / 100);
        }
        newDiscountAmount = Math.min(newDiscountAmount, subtotal);
        
        setToastMessage(`🎉 Congratulations! You saved ₹${newDiscountAmount.toFixed(2)}`);

        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
            setToastMessage('');
        }, 3000);
    };
    
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setToastMessage('');
        if (toastTimerRef.current) {
            clearTimeout(toastTimerRef.current);
        }
    }

    const handlePlaceOrder = async () => {
        if (!user) return;
        setIsPlacingOrder(true);
        try {
            const orderPayload = {
                studentId: user.id,
                items: cart.map(({ id, name, quantity, price, notes, imageUrl }) => ({ id, name, quantity, price, notes, imageUrl })),
                totalAmount,
                couponCode: appliedCoupon?.code,
                discountAmount,
            };
    
            if (isDemoOrder) {
                const order = await placeDemoOrder(orderPayload);
                updateCart([]); // Clear the cart
                navigate(`/student/demo-order-collected/${order.id}`); // Immediately redirect
            } else {
                const order = await placeOrder(orderPayload);
                setOrderId(order.id);
                setShowConfirmation(true); // Show confirmation modal for real orders
                updateCart([]);
            }
        } catch (error) {
            console.error("Failed to place order:", error);
        } finally {
            setIsPlacingOrder(false);
        }
    };

    
    const handleConfirmAndNavigate = () => {
        setShowConfirmation(false);
        // This function is now only for real orders
        navigate(`/student/order-success/${orderId}`);
    }

    if (showPayment) {
        return <UpiPayment totalAmount={totalAmount} onConfirm={handlePlaceOrder} onBack={() => setShowPayment(false)} isPlacingOrder={isPlacingOrder} isDemo={isDemoOrder} />;
    }
    
     if (showConfirmation) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                <div className="bg-student-card backdrop-blur-lg border border-student-card-border p-8 rounded-lg shadow-xl w-full max-w-sm text-center text-student-text-primary animate-scale-in">
                    <h2 className="text-2xl font-bold font-heading text-student-accent mb-4">Processing...</h2>
                    <p>Your order is being confirmed. Please wait a moment.</p>
                     <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-student-accent mx-auto my-6"></div>
                     <button onClick={handleConfirmAndNavigate} className="w-full bg-student-accent text-student-bg-dark font-bold font-heading py-3 px-4 rounded-lg hover:bg-student-accent-dark">
                        View Order Details
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="text-student-text-primary">
             <style>{`
                .confetti {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background-color: #fff;
                    border-radius: 50%;
                    opacity: 0;
                    animation: confetti-pop 0.8s ease-out forwards;
                }
                .confetti:nth-child(odd) {
                     background-color: #fbb_f24;
                }
             `}</style>
            <h1 className="text-3xl font-bold font-heading mb-6" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                {isDemoOrder ? 'Demo Cart 🧪' : 'Your Cart 🛒'}
            </h1>
            {isDemoOrder && (
                <div className="bg-blue-500/20 border border-blue-400 text-center p-3 rounded-lg mb-6 text-blue-200">
                    This is a demo order. No payment is needed.
                </div>
            )}
            {cart.length === 0 ? (
                <div className="text-center py-16 bg-student-card backdrop-blur-lg border border-student-card-border rounded-lg shadow-md">
                    <p className="text-xl font-semibold">Your cart is empty.</p>
                    <p className="text-student-text-secondary mt-2">Looks like you haven't added anything yet!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="bg-student-card backdrop-blur-lg border border-student-card-border rounded-lg p-4 flex gap-4 items-center shadow-md">
                                <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-md" />
                                <div className="flex-grow">
                                    <h3 className="font-bold font-heading text-lg">{item.name}</h3>
                                    <p className="font-bold font-heading text-student-accent">₹{item.price}</p>
                                    <input
                                        type="text"
                                        placeholder="Add cooking notes..."
                                        value={item.notes || ''}
                                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                        className="w-full text-sm mt-1 px-2 py-1 border border-white/30 bg-black/30 rounded-md focus:outline-none focus:ring-1 focus:ring-student-accent placeholder:text-white/50"
                                    />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-black/30 rounded-full p-1">
                                        <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-student-accent text-student-bg-dark font-bold flex items-center justify-center">-</button>
                                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-student-accent text-student-bg-dark font-bold flex items-center justify-center">+</button>
                                    </div>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-xs text-white/70 hover:underline">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-student-card backdrop-blur-lg border border-student-card-border rounded-lg p-6 h-fit sticky top-24 shadow-xl">
                        {toastMessage && (
                            <div
                                className="relative bg-green-500/90 text-white font-semibold p-4 rounded-lg shadow-lg mb-4 text-center overflow-hidden animate-fade-in-down cursor-pointer"
                                onClick={() => setToastMessage('')}
                            >
                                <span className="confetti" style={{ left: '10%', top: '50%', animationDelay: '0s' }}></span>
                                <span className="confetti" style={{ left: '30%', top: '60%', animationDelay: '0.1s' }}></span>
                                <span className="confetti" style={{ left: '50%', top: '40%', animationDelay: '0.2s' }}></span>
                                <span className="confetti" style={{ left: '70%', top: '60%', animationDelay: '0.3s' }}></span>
                                <span className="confetti" style={{ left: '90%', top: '50%', animationDelay: '0.4s' }}></span>
                                {toastMessage}
                            </div>
                        )}

                        <h2 className="text-2xl font-bold font-heading mb-4">Summary</h2>
                        
                        {!isDemoOrder && (
                             <div className="mb-4 pt-4 border-t border-white/20">
                                <h3 className="font-semibold text-white/90 mb-2">Apply a Coupon</h3>
                                {availableOffers.length > 0 ? (
                                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                                        {availableOffers.map(offer => (
                                            <label key={offer.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${appliedCoupon?.id === offer.id ? 'bg-student-accent/30 border border-student-accent' : 'bg-black/30 hover:bg-white/10 border border-transparent'}`}>
                                                <input 
                                                    type="radio" 
                                                    name="coupon" 
                                                    checked={appliedCoupon?.id === offer.id}
                                                    onChange={() => handleApplyCoupon(offer)}
                                                    className="form-radio h-4 w-4 bg-gray-600 border-gray-500 text-student-accent focus:ring-student-accent"
                                                />
                                                <div className="ml-3 text-sm flex-grow">
                                                    <p className="font-mono font-bold text-student-accent">{offer.code}</p>
                                                    <p className="text-xs text-white/70">{offer.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-white/70 bg-black/20 p-3 rounded-md">You have no available coupons.</p>
                                )}
                                {appliedCoupon && (
                                    <div className="mt-2 text-right">
                                        <button onClick={handleRemoveCoupon} className="text-xs text-red-400 hover:underline font-semibold">Remove Coupon</button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2 border-t border-white/20 pt-4">
                             <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                             {appliedCoupon && (
                                <div className="flex justify-between text-green-400">
                                    <span>Discount ({appliedCoupon.code})</span>
                                    <span>- ₹{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold font-heading text-xl pt-2 mt-2 border-t border-white/20">
                                <span>Total</span>
                                <span>₹{totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowPayment(true)}
                            className="w-full mt-6 bg-student-accent text-student-bg-dark font-bold font-heading py-3 px-4 rounded-lg hover:bg-student-accent-dark transition-colors shadow-lg hover:shadow-student-accent/50"
                        >
                            {isDemoOrder ? 'Proceed to Demo Payment' : 'Proceed to Pay'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;