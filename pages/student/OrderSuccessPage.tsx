import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import type { Order } from '../../types';
import { OrderStatus } from '../../types';
import { getOrderById, updateOrderSeatNumber } from '../../services/mockApi';
import { supabase } from '../../services/supabase';

const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [seatNumber, setSeatNumber] = useState('');
  const [seatSubmitted, setSeatSubmitted] = useState(false);
  const location = useLocation();
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (location.state?.showSuccessToast) {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Payment Successful!', type: 'payment-success' } }));
    }
  }, [location.state]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        try {
          const orderData = await getOrderById(orderId);
          setOrder(orderData);
          setCurrentStatus(orderData.status);
          if (orderData.seatNumber) {
            setSeatNumber(orderData.seatNumber);
            setSeatSubmitted(true);
          }
        } catch (error) {
          console.error("Failed to fetch order details", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchOrder();

    const channel = supabase.channel(`public:orders:id=eq.${orderId}`);
    channel
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
        const newStatus = payload.new.status as OrderStatus;
        setCurrentStatus(newStatus);
        if (newStatus === OrderStatus.COLLECTED) {
            window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Your food is ready & collected!', type: 'payment-success' } }));
        }
      })
      .subscribe();
      
    return () => {
        supabase.removeChannel(channel);
    }

  }, [orderId]);

  const handleSeatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seatNumber.trim() && orderId) {
      try {
        await updateOrderSeatNumber(orderId, seatNumber.trim());
        setSeatSubmitted(true);
      } catch(error) {
        console.error("Failed to submit seat number", error);
        alert("Could not submit seat number. Please try again.");
      }
    }
  };

  if (loading) {
    return (
        <div className="max-w-md mx-auto bg-surface/50 backdrop-blur-lg border border-surface-light p-6 sm:p-8 rounded-2xl shadow-xl animate-pulse">
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="h-24 w-24 bg-surface rounded-full"></div>
                </div>
                <div className="h-8 bg-surface rounded w-3/4 mx-auto mb-2"></div>
                <div className="h-5 bg-surface rounded w-full mx-auto"></div>
            </div>
            <div className="mt-8 pt-8 border-t-2 border-dashed border-surface-light flex flex-col items-center">
                <div className="h-7 bg-surface rounded w-1/2 mb-2"></div>
                <div className="h-5 bg-surface rounded w-3/4 mb-4"></div>
                <div className="h-52 w-52 bg-surface rounded-lg"></div>
            </div>
            <div className="mt-8 bg-surface/50 p-4 rounded-lg">
                <div className="h-6 bg-surface rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-5 bg-surface rounded"></div>
                    <div className="h-5 bg-surface rounded w-5/6"></div>
                    <div className="h-5 bg-surface rounded w-4/6"></div>
                </div>
            </div>
        </div>
    );
  }

  if (!order) {
    return <div className="text-center text-lg text-red-400 bg-surface/50 backdrop-blur-lg rounded-lg p-8">Could not find your order.</div>;
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const isCollected = currentStatus === OrderStatus.COLLECTED;

  return (
    <div className="max-w-md mx-auto bg-surface/50 backdrop-blur-lg border border-surface-light p-6 sm:p-8 rounded-2xl shadow-xl text-textPrimary">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-400 animate-scale-in" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold font-heading animate-slide-in-up opacity-0" style={{ animationDelay: '100ms' }}>
          {isCollected ? "Order Collected!" : "Payment Successful!"}
        </h1>
        <p className="text-textSecondary mt-2 animate-slide-in-up opacity-0" style={{ animationDelay: '200ms' }}>
          Thank you! Your order <span className="font-bold">{order.orderNumber ? `Order Num ${order.orderNumber}`: `#${order.id.slice(-6)}`}</span> {isCollected ? 'has been collected.' : 'is being prepared.'}
        </p>
      </div>

      {/* QR Code Section */}
      <div className="mt-8 pt-8 border-t-2 border-dashed border-surface-light flex flex-col items-center animate-fade-in-down opacity-0" style={{ animationDelay: '300ms' }}>
        <h2 className="text-2xl font-bold font-heading mb-2">Your Pickup Code</h2>
        <p className="text-textSecondary mb-4 max-w-sm text-center">
          {isCollected ? "This order has been collected." : "Present this QR code at the counter to collect your order."}
        </p>
        <div className={`relative p-4 bg-white rounded-lg border-4 border-primary shadow-lg transition-all ${isCollected ? 'grayscale opacity-50' : 'hover:scale-105 cursor-pointer'}`}>
          <QRCode value={order.qrToken} size={200} fgColor="#1E293B" bgColor="#FFFFFF" />
          {isCollected && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <span className="text-black font-bold text-4xl -rotate-12 border-4 border-black px-4 py-1">COLLECTED</span>
            </div>
          )}
        </div>
      </div>
      
       {/* Seat Number Section */}
       <div className="mt-8 pt-8 border-t-2 border-dashed border-surface-light animate-pop-in opacity-0" style={{ animationDelay: '400ms' }}>
        <h2 className="text-2xl font-bold font-heading text-center mb-4">For Dine-in Service</h2>
        {seatSubmitted ? (
            <div className="text-center bg-green-500/20 border border-green-400/50 p-4 rounded-lg">
                <p className="font-bold text-green-300">Seat Number {seatNumber} submitted!</p>
                <p className="text-sm text-green-300/80">We'll bring your order to you.</p>
            </div>
        ) : (
            <form onSubmit={handleSeatSubmit} className="flex flex-col items-center gap-4">
                <label htmlFor="seatNumber" className="text-textSecondary text-center">Please enter your seat number below:</label>
                <input
                    id="seatNumber"
                    type="text"
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    placeholder="e.g., A12 or 5"
                    className="w-48 text-center text-2xl font-bold p-3 bg-black/30 border-2 border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                />
                <button type="submit" className="bg-primary text-background font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors">
                    Submit Seat Number
                </button>
            </form>
        )}
      </div>

      <div className="mt-8 bg-black/30 p-4 rounded-lg animate-slide-in-up opacity-0" style={{ animationDelay: '500ms' }}>
        <h3 className="text-lg font-semibold mb-2">Order Summary</h3>
        <div className="space-y-2">
          {order.items.map(item => (
              <div key={item.id} className="py-1">
                  <div className="flex justify-between text-textPrimary/90">
                      <span>{item.name} x {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.notes && (
                      <p className="text-sm text-textSecondary/80 pl-4 italic">"{item.notes}"</p>
                  )}
              </div>
          ))}
        </div>
        <div className="border-t border-white/20 mt-2 pt-2 space-y-1">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {order.discountAmount && (
                <div className="flex justify-between text-green-400">
                    <span>Discount ({order.couponCode})</span>
                    <span>- ₹{order.discountAmount.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between font-bold font-heading text-lg mt-1">
                <span>Total Paid</span>
                <span>₹{order.totalAmount.toFixed(2)}</span>
            </div>
        </div>
      </div>

      {order.canteenOwnerPhone && (
        <div className="mt-8 text-center bg-black/30 p-4 rounded-lg animate-slide-in-up opacity-0" style={{ animationDelay: '600ms' }}>
            <p className="text-textSecondary">
                Need help? Contact Canteen: 
                <a href={`tel:${order.canteenOwnerPhone}`} className="font-bold font-heading text-primary ml-2 hover:underline">
                    📞 {order.canteenOwnerPhone}
                </a>
            </p>
        </div>
      )}
    </div>
  );
};

export default OrderSuccessPage;