import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CartItem, Offer } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { placeOrder, placeDemoOrder, getOffers, createPaymentRecord } from '../../services/mockApi';

declare const Razorpay: any;

const getCartFromStorage = (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};

const CartPage: React.FC = () => {
    const [cart, setCart] = useState<CartItem[]>(getCartFromStorage());
    const [appliedCoupon, setAppliedCoupon] = useState<Offer | null>(null);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const toastTimerRef = useRef<number | null>(null);
    const [availableOffers, setAvailableOffers] = useState<Offer[]>([]);

    const { user } = useAuth();
    const navigate = useNavigate();
    
    const isDemoOrder = useMemo(() => cart.length > 0 && cart.every(item => item.isDemo), [cart]);
    
    useEffect(() => {
        return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, []);

    useEffect(() => {
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
                } catch (error) { console.error("Failed to fetch available offers", error); }
            }
        };
        if (!isDemoOrder) fetchOffers();
    }, [user, isDemoOrder]);

    const updateCart = (newCart: CartItem[]) => {
        if (appliedCoupon) {
            const subtotal = newCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            if (subtotal === 0) setAppliedCoupon(null);
        }
        setCart(newCart);
        saveCartToStorage(newCart);
    };

    const handleQuantityChange = (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) handleRemoveItem(itemId);
        else updateCart(cart.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item));
    };
    
    const handleRemoveItem = (itemId: string) => updateCart(cart.filter(item => item.id !== itemId));
    
    const handleNotesChange = (itemId: string, notes: string) => updateCart(cart.map(item => item.id === itemId ? { ...item, notes } : item));
    
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
    
    const discountAmount = useMemo(() => {
        if (!appliedCoupon) return 0;
        let discount = appliedCoupon.discountType === 'fixed' ? appliedCoupon.discountValue : subtotal * (appliedCoupon.discountValue / 100);
        return Math.min(discount, subtotal);
    }, [subtotal, appliedCoupon]);

    const totalAmount = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);

    const handleApplyCoupon = (offer: Offer) => {
        setAppliedCoupon(offer);
        let newDiscount = offer.discountType === 'fixed' ? offer.discountValue : subtotal * (offer.discountValue / 100);
        setToastMessage(`🎉 Congratulations! You saved ₹${Math.min(newDiscount, subtotal).toFixed(2)}`);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToastMessage(''), 3000);
    };
    
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setToastMessage('');
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }

    const handleDemoOrder = async () => {
        if (!user) return;
        setIsPlacingOrder(true);
        try {
            // FIX: Use studentId and studentName as expected by the updated function.
            const orderPayload = {
                studentId: user.id, studentName: user.username,
                items: cart.map(({ id, name, quantity, price, notes, imageUrl }) => ({ id, name, quantity, price, notes, imageUrl })),
                totalAmount, couponCode: appliedCoupon?.code, discountAmount,
            };
            const order = await placeDemoOrder(orderPayload);
            updateCart([]);
            navigate(`/customer/demo-order-collected/${order.id}`);
        } catch (error) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: (error as Error).message, type: 'payment-error' } }));
            setIsPlacingOrder(false);
        }
    };

    const handleRealOrderPlacement = async (paymentId: string) => {
        if (!user) return;
        try {
            // FIX: Use studentId and studentName as expected by the updated function.
            const orderPayload = {
                studentId: user.id, studentName: user.username,
                items: cart.map(({ id, name, quantity, price, notes, imageUrl }) => ({ id, name, quantity, price, notes, imageUrl })),
                totalAmount, couponCode: appliedCoupon?.code, discountAmount,
            };
            const order = await placeOrder(orderPayload);
            await createPaymentRecord({
                order_id: order.id,
                student_id: user.id,
                amount: totalAmount,
                method: 'Razorpay',
                status: 'successful',
                transaction_id: paymentId,
            });
            updateCart([]);
            navigate(`/customer/order-success/${order.id}`, { state: { showSuccessToast: true } });
        } catch (error) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: (error as Error).message, type: 'payment-error' } }));
            setIsPlacingOrder(false);
        }
    };
    
    const handlePayment = () => {
        setIsPlacingOrder(true);
        const options = {
            key: 'rzp_test_1DP5mmOlF5G5ag', // Public test key, replace with your own in production
            amount: totalAmount * 100, // Amount in paise
            currency: "INR",
            name: "Zero✦Degree",
            description: "Food Order Payment",
            image: "/favicon.ico",
            handler: (response: { razorpay_payment_id: string }) => {
                handleRealOrderPlacement(response.razorpay_payment_id);
            },
            prefill: {
                name: user?.username || 'Valued Customer',
                email: user?.email || '',
                contact: user?.phone || '',
            },
            theme: {
                color: "#A78BFA",
            },
            modal: {
                ondismiss: () => {
                    setIsPlacingOrder(false);
                    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Payment was cancelled.', type: 'cart-warn' } }));
                }
            }
        };
        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (response: any) => {
             window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Payment Failed: ${response.error.description}`, type: 'payment-error' } }));
            console.error('Razorpay Error:', response.error);
            setIsPlacingOrder(false);
        });
        rzp.open();
    };


    return (
        <div className="text-textPrimary">
             <style>{`.confetti { position: absolute; width: 8px; height: 8px; background-color: #fff; border-radius: 50%; opacity: 0; animation: confetti-pop 0.8s ease-out forwards; } .confetti:nth-child(odd) { background-color: #fbb_f24; }`}</style>
            <h1 className="text-3xl font-bold font-heading mb-6" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                {isDemoOrder ? 'Demo Cart 🧪' : 'Your Cart 🛒'}
            </h1>
            {isDemoOrder && (
                <div className="bg-blue-500/20 border border-blue-400 text-center p-3 rounded-lg mb-6 text-blue-200">
                    This is a demo order. No payment is needed.
                </div>
            )}
            {cart.length === 0 ? (
                <div className="text-center py-16 bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg shadow-md">
                    <p className="text-xl font-semibold">Your cart is empty.</p>
                    <p className="text-textSecondary mt-2">Looks like you haven't added anything yet!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        {cart.map(item => (
                            <div key={item.id} className="bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg p-4 flex gap-4 items-center shadow-md">
                                <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-md" />
                                <div className="flex-grow">
                                    <h3 className="font-bold font-heading text-lg">{item.name}</h3>
                                    <p className="font-bold font-heading text-primary">₹{item.price}</p>
                                    <input
                                        type="text"
                                        placeholder="Add cooking notes..."
                                        value={item.notes || ''}
                                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                        className="w-full text-sm mt-1 px-2 py-1 border border-white/30 bg-black/30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/50"
                                    />
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-black/30 rounded-full p-1">
                                        <button onClick={() => handleQuantityChange(item.id, item.quantity - 1)} className="w-6 h-6 rounded-full bg-primary text-background font-bold flex items-center justify-center">-</button>
                                        <span className="font-bold w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => handleQuantityChange(item.id, item.quantity + 1)} className="w-6 h-6 rounded-full bg-primary text-background font-bold flex items-center justify-center">+</button>
                                    </div>
                                    <button onClick={() => handleRemoveItem(item.id)} className="text-xs text-white/70 hover:underline">Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-surface/50 backdrop-blur-lg border border-surface-light rounded-lg p-6 h-fit sticky top-24 shadow-xl">
                        {toastMessage && (
                            <div
                                className="relative bg-green-500/90 text-white font-semibold p-4 rounded-lg shadow-lg mb-4 text-center overflow-hidden animate-fade-in-down cursor-pointer"
                                onClick={() => setToastMessage('')}
                            >
                                <span className="confetti" style={{ left: '10%', top: '50%', animationDelay: '0s' }}></span>
                                <span className="confetti" style={{ left: '90%', top: '50%', animationDelay: '0.4s' }}></span>
                                {toastMessage}
                            </div>
                        )}

                        <h2 className="text-2xl font-bold font-heading mb-4">Summary</h2>
                        
                        <>
                            {!isDemoOrder && (
                                <div className="mb-4 pt-4 border-t border-white/20">
                                    <h3 className="font-semibold text-white/90 mb-2">Apply a Coupon</h3>
                                    {availableOffers.length > 0 ? (
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                                            {availableOffers.map(offer => (
                                                <label key={offer.id} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${appliedCoupon?.id === offer.id ? 'bg-primary/30 border border-primary' : 'bg-black/30 hover:bg-white/10 border border-transparent'}`}>
                                                    <input type="radio" name="coupon" checked={appliedCoupon?.id === offer.id} onChange={() => handleApplyCoupon(offer)} className="form-radio h-4 w-4 bg-gray-600 border-gray-500 text-primary focus:ring-primary"/>
                                                    <div className="ml-3 text-sm flex-grow"><p className="font-mono font-bold text-primary">{offer.code}</p><p className="text-xs text-white/70">{offer.description}</p></div>
                                                </label>
                                            ))}
                                        </div>
                                    ) : ( <p className="text-sm text-white/70 bg-black/20 p-3 rounded-md">You have no available coupons.</p> )}
                                    {appliedCoupon && ( <div className="mt-2 text-right"><button onClick={handleRemoveCoupon} className="text-xs text-red-400 hover:underline font-semibold">Remove Coupon</button></div> )}
                                </div>
                            )}
                            <div className="space-y-2 border-t border-white/20 pt-4">
                                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                                {appliedCoupon && ( <div className="flex justify-between text-green-400"><span>Discount ({appliedCoupon.code})</span><span>- ₹{discountAmount.toFixed(2)}</span></div> )}
                                <div className="flex justify-between font-bold font-heading text-xl pt-2 mt-2 border-t border-white/20"><span>Total</span><span>₹{totalAmount.toFixed(2)}</span></div>
                            </div>
                            <button onClick={isDemoOrder ? handleDemoOrder : handlePayment} disabled={isPlacingOrder} className="w-full mt-6 bg-primary text-background font-bold font-heading py-3 px-4 rounded-lg hover:bg-primary-dark transition-colors shadow-lg hover:shadow-primary/50 disabled:bg-primary/50 disabled:cursor-wait">
                                {isPlacingOrder ? 'Processing...' : (isDemoOrder ? 'Place Demo Order' : 'Proceed to Pay')}
                            </button>
                        </>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;