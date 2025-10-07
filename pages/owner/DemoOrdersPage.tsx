import React, { useState, useEffect, useCallback } from 'react';
import { getOwnerDemoOrders } from '../../services/mockApi';
import type { Order } from '../../types';
import { QRCodeSVG } from 'qrcode.react';

const DemoOrderCard: React.FC<{ order: Order }> = ({ order }) => {
    return (
        <div className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700">
            <div className="flex flex-col sm:flex-row gap-6">
                {/* Details Section */}
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-lg text-gray-200">
                                DEMO-{order.id.slice(-6).toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-400">
                                Placed by: {order.studentName}
                            </p>
                            <p className="text-xs text-gray-500">
                                {new Date(order.timestamp).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <span className="bg-green-500/20 text-green-300 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                            Collected (Demo Only)
                        </span>
                    </div>
                    <div className="mt-4">
                        <h4 className="font-semibold text-gray-300">Items Ordered:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-400 mt-1">
                            {order.items.map(item => (
                                <li key={item.id}>{item.name} x {item.quantity}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* QR Code Section */}
                <div className="flex-shrink-0 flex flex-col items-center justify-center pt-4 sm:pt-0 border-t border-gray-700 sm:border-t-0 sm:border-l sm:pl-6 sm:ml-6">
                    <div className="relative p-2 bg-white rounded-lg">
                        <QRCodeSVG value={order.qrToken} size={128} />
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                            <span className="text-black font-bold text-2xl -rotate-45 border-2 border-black px-2">
                                DEMO
                            </span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Demo QR Code</p>
                </div>
            </div>
        </div>
    );
};


const DemoOrderCardSkeleton: React.FC = () => (
    <div className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-grow">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
            <div className="flex-shrink-0 self-center w-32 h-32 bg-gray-700 rounded-lg"></div>
        </div>
    </div>
);


const DemoOrdersPage: React.FC = () => {
    const [demoOrders, setDemoOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDemoOrders = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getOwnerDemoOrders();
            setDemoOrders(data);
        } catch (error) {
            console.error("Failed to fetch demo orders", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDemoOrders();
    }, [fetchDemoOrders]);
    
    if (loading) {
        return (
            <div>
                <div className="h-10 bg-gray-700 rounded w-1/3 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-700 rounded w-2/3 mb-6 animate-pulse"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DemoOrderCardSkeleton />
                    <DemoOrderCardSkeleton />
                </div>
            </div>
        );
    }


    return (
        <div>
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-6">
                <h1 className="text-4xl font-bold text-gray-200">Demo Orders (Training Only)</h1>
                <p className="mt-2 text-gray-400 max-w-3xl">
                    These are demo orders placed by new customers to learn how to use Zero✦Degree. They are not real orders and no payment will be received.
                </p>
            </div>

            {demoOrders.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {demoOrders.map(order => (
                        <DemoOrderCard key={order.id} order={order} />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 bg-gray-800 rounded-2xl shadow-md border border-gray-700">
                    <p className="text-xl font-semibold text-gray-200">No Demo Orders Found</p>
                    <p className="text-gray-400 mt-2">When new students try the demo, their orders will appear here.</p>
                </div>
            )}
        </div>
    );
};

export default DemoOrdersPage;