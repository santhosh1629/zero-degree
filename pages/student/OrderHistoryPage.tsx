import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import type { Order, CartItem, MenuItem } from '../../types';
import { OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { getStudentOrders, cancelStudentOrder, getMenu } from '../../services/mockApi';

const getCartFromStorage = (): CartItem[] => {
    const cart = localStorage.getItem('cart');
    // Ensure cart items are not demo items unless explicitly marked
    const parsedCart = cart ? JSON.parse(cart) : [];
    return parsedCart.filter((item: any) => !item.isDemo);
};

const saveCartToStorage = (cart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(cart));
};


const getStatusDisplay = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING:
      return { text: 'Preparing', icon: '⏳', className: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' };
    case OrderStatus.PREPARED:
      return { text: 'Ready for Pickup', icon: '🍴', className: 'bg-blue-500/20 text-blue-300 border-blue-400/30' };
    case OrderStatus.COLLECTED:
      return { text: 'Collected', icon: '✅', className: 'bg-green-500/20 text-green-300 border-green-400/30' };
    case OrderStatus.CANCELLED:
      return { text: 'Cancelled', icon: '❌', className: 'bg-red-500/20 text-red-300 border-red-400/30' };
    default:
      return { text: status, icon: '❓', className: 'bg-gray-500/20 text-gray-300 border-gray-400/30' };
  }
};

const OrderCard: React.FC<{ order: Order; onOrderCancelled: () => void; onReorder: (order: Order) => void; }> = ({ order, onOrderCancelled, onReorder }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const statusInfo = getStatusDisplay(order.status);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');

    const handleCancelOrder = async () => {
        setIsCancelling(true);
        setCancelError('');
        try {
            await cancelStudentOrder(order.id, order.studentId);
            setShowConfirmModal(false);
            onOrderCancelled();
        } catch (error) {
            setCancelError((error as Error).message || "Failed to cancel order. Please try again.");
        } finally {
            setIsCancelling(false);
        }
    };
    
    return (
        <>
        <div className="bg-black/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-md overflow-hidden transition-all duration-300 mb-4 text-white">
            <div 
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/10"
                onClick={() => setIsExpanded(!isExpanded)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls={`order-details-${order.id}`}
            >
                <div>
                    <p className="font-bold font-heading text-lg flex items-center gap-2">
                        Order #{order.id.slice(-6)}
                        {order.orderType === 'demo' && <span className="text-xs font-semibold bg-blue-500/50 text-blue-200 px-2 py-1 rounded-full">DEMO</span>}
                    </p>
                    <p className="text-sm text-white/70">{order.timestamp.toLocaleString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex items-center gap-4">
                    <p className="font-black font-heading text-2xl text-primary">₹{order.totalAmount.toFixed(2)}</p>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-white/80 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isExpanded && (
                <div id={`order-details-${order.id}`} className="p-4 bg-black/30 border-t border-white/20 animate-fade-in-down">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow">
                            <h4 className="font-semibold mb-2 text-white/90">Order Details</h4>
                            <div className="space-y-2">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <div>
                                            <p className="text-white/90">{item.name} <span className="text-white/60">x {item.quantity}</span></p>
                                            {item.notes && <p className="text-xs text-primary/80 italic pl-2">Note: "{item.notes}"</p>}
                                        </div>
                                        <p className="text-white/70">₹{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-white/20 my-2"></div>
                            {order.discountAmount && (
                                <div className="flex justify-between text-sm text-green-400">
                                    <span>Discount ({order.couponCode})</span>
                                    <span>- ₹{order.discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                             <div className="flex justify-between font-bold font-heading text-white">
                                <span>Total</span>
                                <span>₹{order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex-shrink-0 sm:w-48 text-center sm:border-l sm:border-white/20 sm:pl-4">
                            <h4 className="font-semibold mb-2 text-white/90">Status</h4>
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${statusInfo.className}`}>
                                {statusInfo.icon} {statusInfo.text}
                            </div>
                            {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PREPARED) && (
                                <div className="mt-4 flex flex-col items-center">
                                    <p className="text-sm text-white/70 mb-2">Show this QR code at the counter for pickup:</p>
                                    <div className="p-2 bg-white rounded-lg"><QRCodeSVG value={order.qrToken} size={128} /></div>
                                </div>
                            )}
                            {order.status === OrderStatus.CANCELLED && order.refundAmount != null && (
                                <p className="mt-4 text-sm text-red-400 bg-red-500/20 p-2 rounded-md">
                                    A refund of ₹{order.refundAmount.toFixed(2)} has been processed.
                                </p>
                            )}
                        </div>
                    </div>
                     { (order.status === OrderStatus.PENDING || order.status === OrderStatus.COLLECTED || order.status === OrderStatus.CANCELLED) && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                             {order.status === OrderStatus.PENDING && (
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    className="w-full bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
                                >
                                    Cancel Order
                                </button>
                             )}
                              {(order.status === OrderStatus.COLLECTED || order.status === OrderStatus.CANCELLED) && (
                                <button
                                    onClick={() => onReorder(order)}
                                    className="w-full bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    <span>Reorder</span>
                                </button>
                             )}
                        </div>
                     )}
                </div>
            )}
        </div>

        {showConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-sm text-center text-white animate-fade-in-down">
                    <h2 className="text-xl font-bold font-heading text-red-400 mb-4">Confirm Cancellation</h2>
                    <p className="text-white/80 mb-2">Are you sure you want to cancel this order?</p>
                    <div className="text-yellow-400 bg-yellow-500/20 p-3 rounded-md font-semibold text-sm mb-6">
                        Please note: Only 50% of the order amount (₹{(order.totalAmount * 0.5).toFixed(2)}) will be refunded.
                    </div>
                    {cancelError && <p className="text-red-400 text-sm mb-4">{cancelError}</p>}
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setShowConfirmModal(false)} disabled={isCancelling} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors">
                            Go Back
                        </button>
                        <button onClick={handleCancelOrder} disabled={isCancelling} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                            {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

const OrderHistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const isMounted = useRef(true);
    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchOrdersAndMenu = useCallback(async () => {
        if (user) {
            setLoading(true);
            try {
                const [data, menuData] = await Promise.all([
                    getStudentOrders(user.id),
                    getMenu()
                ]);
                if (isMounted.current) {
                    setOrders(data);
                    setMenu(menuData);
                }
            } catch (error) {
                console.error("Failed to fetch order history or menu", error);
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        } else {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchOrdersAndMenu();
    }, [fetchOrdersAndMenu]);
    
    const handleReorder = (orderToReorder: Order) => {
        const currentCart = getCartFromStorage();
        const unavailableItems: string[] = [];
        let itemsAdded = 0;

        orderToReorder.items.forEach(orderItem => {
            const fullMenuItem = menu.find(menuItem => menuItem.id === orderItem.id);

            if (fullMenuItem && fullMenuItem.isAvailable) {
                const cartItemIndex = currentCart.findIndex(ci => ci.id === orderItem.id);
                if (cartItemIndex > -1) {
                    currentCart[cartItemIndex].quantity += orderItem.quantity;
                } else {
                    const newCartItem: CartItem = {
                        ...fullMenuItem,
                        quantity: orderItem.quantity,
                        notes: orderItem.notes,
                        isDemo: false,
                    };
                    currentCart.push(newCartItem);
                }
                itemsAdded++;
            } else {
                unavailableItems.push(orderItem.name);
            }
        });

        if (itemsAdded > 0) {
            saveCartToStorage(currentCart);
            window.dispatchEvent(new CustomEvent('itemAddedToCart'));
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `${itemsAdded} item(s) re-added to cart!`, type: 'cart-add' } }));
            
            if (unavailableItems.length > 0) {
                setTimeout(() => window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Some items were out of stock.`, type: 'stock-out' } })), 500);
            }

            navigate('/student/cart');
        } else {
             window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'All items are currently out of stock.', type: 'stock-out' } }));
        }
    };


    if (loading) {
        return (
            <div>
                <div className="h-9 bg-black/50 rounded-lg w-1/2 mb-6 animate-pulse"></div>
                <div className="space-y-4 animate-pulse">
                    <div className="h-20 bg-black/50 rounded-2xl"></div>
                    <div className="h-20 bg-black/50 rounded-2xl"></div>
                    <div className="h-20 bg-black/50 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold font-heading mb-6 text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Order History 🧾</h1>
            {orders.length > 0 ? (
                <div>
                    {orders.map(order => (
                        <OrderCard key={order.id} order={order} onOrderCancelled={fetchOrdersAndMenu} onReorder={handleReorder} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-black/50 backdrop-blur-lg border border-white/20 rounded-2xl shadow-md">
                    <p className="text-xl font-semibold text-white">No Order History Found</p>
                    <p className="text-white/80 mt-2">You haven't placed any orders yet.</p>
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;