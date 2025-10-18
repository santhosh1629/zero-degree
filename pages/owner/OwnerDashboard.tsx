
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Order, MenuItem, SalesSummary, StudentPoints, TodaysDashboardStats, User } from '../../types';
import { OrderStatus } from '../../types';
import { 
    getOwnerOrders, updateOrderStatus, getMenu, updateMenuAvailability, getSalesSummary, 
    getMostSellingItems, getOrderStatusSummary, getStudentPointsList, getTodaysDashboardStats, getTodaysDetailedReport,
    getScanTerminalStaff, deleteScanTerminalStaff
} from '../../services/mockApi';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';

// For xlsx library loaded from CDN
declare const XLSX: any;

type DashboardTab = 'live' | 'analytics' | 'management' | 'history' | 'staff';

// --- Reusable Components & Icons ---

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
    </svg>
);

const getStatusBadgeClass = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.PENDING: return 'bg-yellow-500/20 text-yellow-300';
    case OrderStatus.PREPARED: return 'bg-blue-500/20 text-blue-300';
    case OrderStatus.COLLECTED: return 'bg-green-500/20 text-green-300';
    case OrderStatus.CANCELLED: return 'bg-red-500/20 text-red-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
};

const PIE_COLORS = ['#fbbf24', '#60a5fa', '#4ade80']; // amber-400, blue-400, green-400

// --- Tab Components ---

const DailyStats: React.FC<{ stats: TodaysDashboardStats }> = ({ stats }) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadReport = async () => {
        setIsDownloading(true);
        try {
            const reportData = await getTodaysDetailedReport();
            const summaryData = [
                ["Daily Report Summary"], [],
                ["Date", reportData.date],
                ["Total Orders", reportData.totalOrders],
                ["Total Income (₹)", reportData.totalIncome.toFixed(2)],
            ];
            const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
            const itemSalesData = [
                ["Item Name", "Quantity Sold", "Total Price (₹)"],
                ...reportData.itemSales.map(item => [item.name, item.quantity, item.totalPrice])
            ];
            const wsItems = XLSX.utils.aoa_to_sheet(itemSalesData);
            wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }];
            wsItems['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
            XLSX.utils.book_append_sheet(wb, wsItems, "Item-wise Sales");
            XLSX.writeFile(wb, `Daily_Report_${reportData.date}.xlsx`);
        } catch (error) { console.error("Failed to generate report", error); } 
        finally { setIsDownloading(false); }
    };

    return (
        <div className="mb-6">
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-gray-200">Today's Summary ({new Date().toLocaleDateString()})</h2>
                <button onClick={handleDownloadReport} disabled={isDownloading} className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 disabled:bg-gray-600 hover:bg-gray-600 transform hover:-translate-y-0.5">
                    <DownloadIcon /> {isDownloading ? 'Generating...' : 'Download Report'}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 border border-gray-700">
                     <div className="bg-indigo-500/20 text-indigo-400 p-4 rounded-full text-3xl">📦</div>
                     <div>
                        <p className="text-sm text-gray-400">Total Orders</p>
                        <p className="text-3xl font-bold text-white">{stats.totalOrders}</p>
                     </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-md flex items-center gap-4 border border-gray-700">
                    <div className="bg-green-500/20 text-green-300 p-4 rounded-full text-3xl">💰</div>
                     <div>
                        <p className="text-sm text-gray-400">Total Income</p>
                        <p className="text-3xl font-bold text-white">₹{stats.totalIncome.toFixed(2)}</p>
                     </div>
                </div>
                <div className="md:col-span-2 lg:col-span-1 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                    <h3 className="font-bold mb-2 text-gray-200">Items Sold Today</h3>
                     {stats.itemsSold.length > 0 ? (
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                            {stats.itemsSold.map(item => (
                                <li key={item.name} className="flex justify-between text-sm">
                                    <span className="text-gray-300">{item.name}</span>
                                    <span className="font-bold text-white">x {item.quantity}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-400">No items sold yet today.</p>}
                </div>
            </div>
        </div>
    );
};

const StaffScanLeaderboard: React.FC<{ counts: { name: string; count: number }[] }> = ({ counts }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
        <h2 className="text-2xl font-bold text-gray-200 mb-4">Today's Staff Scans 🏆</h2>
        {counts.length > 0 ? (
            <ul className="space-y-3">
                {counts.map((staff, index) => (
                    <li key={staff.name + index} className="flex items-center justify-between bg-gray-700/50 p-3 rounded-lg transition-transform hover:scale-105">
                        <div className="flex items-center gap-3">
                            <span className={`font-bold text-lg w-8 text-center ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </span>
                            <span className="font-semibold text-white">{staff.name}</span>
                        </div>
                        <span className="font-black text-xl text-indigo-400">{staff.count} scans</span>
                    </li>
                ))}
            </ul>
        ) : (
            <p className="text-center text-gray-400 py-4">No scans recorded by staff today.</p>
        )}
    </div>
);


const OrdersManager: React.FC<{orders: Order[], onStatusUpdate: () => void, onViewOrder: (order: Order) => void}> = ({ orders, onStatusUpdate, onViewOrder }) => {
    const [showOnlyPending, setShowOnlyPending] = useState(false);
    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            onStatusUpdate();
        } catch (error) { console.error("Failed to update status:", error); }
    };
    
    // Sort active orders by timestamp in ascending order (FIFO)
    const activeOrders = useMemo(() => 
        orders
            .filter(o => o.status === OrderStatus.PENDING || o.status === OrderStatus.PREPARED)
            .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()), 
        [orders]
    );

    const displayedOrders = showOnlyPending ? activeOrders.filter(o => o.status === OrderStatus.PENDING) : activeOrders;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 className="text-2xl font-bold text-gray-200">Current Orders 🛎️</h2>
                <div className="flex items-center space-x-2">
                    <label htmlFor="pending-toggle" className="text-sm font-medium text-gray-400 cursor-pointer">Show only pending</label>
                    <button id="pending-toggle" onClick={() => setShowOnlyPending(!showOnlyPending)} className={`${showOnlyPending ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`} role="switch" aria-checked={showOnlyPending}>
                        <span className={`${showOnlyPending ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/>
                    </button>
                </div>
            </div>

            {displayedOrders.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Items</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {displayedOrders.map(order => (
                                <tr key={order.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">...{order.id.slice(-6)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm align-top">
                                        <div className="font-medium text-gray-200">{order.studentName}</div>
                                        {order.customerPhone && <div className="text-gray-400">{order.customerPhone}</div>}
                                        {order.seatNumber && (
                                            <div className="mt-1 font-bold text-lg text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md inline-block">
                                                🪑 Seat: {order.seatNumber}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-400 align-top">
                                        <ul className="list-disc list-inside space-y-1">
                                            {order.items.map(i => (
                                                <li key={i.id}>{i.name} (x{i.quantity}) {i.notes && <span className="block text-xs text-indigo-400 italic pl-2">Note: {i.notes}</span>}</li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap align-top"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>{order.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                                        <div className="flex items-center justify-end gap-2 flex-wrap">
                                            <button onClick={() => onViewOrder(order)} className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs py-2 px-3 rounded-lg border border-indigo-500 hover:bg-indigo-500/10 transition-colors">View</button>
                                            {order.status === OrderStatus.PENDING && 
                                                <button onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARED)} className="bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg text-xs hover:bg-blue-700 transition-colors">
                                                    Mark as Prepared
                                                </button>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p className="text-center text-gray-400 py-4">No active orders right now.</p>}
        </div>
    );
};

const AnalyticsView: React.FC<{ salesSummary: SalesSummary; mostSellingItems: { name: string; count: number }[]; orderStatusSummary: { name: string; value: number }[]; }> = ({ salesSummary, mostSellingItems, orderStatusSummary }) => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold mb-4 text-gray-200">Weekly Sales (Last 4 Weeks)</h3>
            <ResponsiveContainer width="100%" height={300}><BarChart data={salesSummary.weekly}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="week" tick={{ fill: '#CBD5E0' }} /><YAxis tick={{ fill: '#CBD5E0' }} /><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} /><Legend /><Bar dataKey="total" fill="#6366F1" name="Sales (₹)" /></BarChart></ResponsiveContainer>
        </div>
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold mb-4 text-gray-200">Order Status</h3>
            <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={orderStatusSummary} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>{orderStatusSummary.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} /><Legend /></PieChart></ResponsiveContainer>
        </div>
        <div className="lg:col-span-5 bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold mb-4 text-gray-200">Most Popular Items</h3>
            <ResponsiveContainer width="100%" height={300}><BarChart data={mostSellingItems} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis type="number" tick={{ fill: '#CBD5E0' }} /><YAxis type="category" dataKey="name" tick={{ fill: '#CBD5E0' }} width={100} /><Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} /><Legend /><Bar dataKey="count" fill="#A78BFA" name="Units Sold" /></BarChart></ResponsiveContainer>
        </div>
    </div>
);

const ManagementView: React.FC<{ menu: MenuItem[]; customerPoints: StudentPoints[]; onAvailabilityChange: (itemId: string, isAvailable: boolean) => void; }> = ({ menu, customerPoints, onAvailabilityChange }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold mb-4 text-gray-200">Menu Availability</h3>
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">{menu.map(item => (<li key={item.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg"><span className="text-gray-200">{item.name}</span><button onClick={() => onAvailabilityChange(item.id, !item.isAvailable)} className={`${item.isAvailable ? 'bg-indigo-600' : 'bg-gray-600'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none`} role="switch" aria-checked={item.isAvailable}><span className={`${item.isAvailable ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}/></button></li>))}</ul>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold mb-4 text-gray-200">Customer Loyalty Points</h3>
            <ul className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin">{customerPoints.map(sp => (<li key={sp.studentId} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg"><span className="text-gray-200">{sp.studentName}</span><span className="font-bold text-amber-400">{sp.points} pts</span></li>))}</ul>
        </div>
    </div>
);

const OrderHistoryView: React.FC<{ orders: Order[] }> = ({ orders }) => {
    const [filter, setFilter] = useState<'all' | OrderStatus>('all');
    const filteredOrders = useMemo(() => filter === 'all' ? orders : orders.filter(o => o.status === filter), [orders, filter]);

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
            <h3 className="font-bold mb-4 text-gray-200">Completed/Cancelled Orders</h3>
            <div className="mb-4"><select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2"><option value="all">All</option><option value={OrderStatus.COLLECTED}>Collected</option><option value={OrderStatus.CANCELLED}>Cancelled</option></select></div>
            <div className="overflow-x-auto max-h-[60vh] scrollbar-thin pr-2">{filteredOrders.length > 0 ? <table className="min-w-full divide-y divide-gray-700"><thead className="bg-gray-700/50 sticky top-0"><tr><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Order ID</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Customer</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Date</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Status</th><th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Total</th></tr></thead><tbody className="bg-gray-800 divide-y divide-gray-700">{filteredOrders.map(order => (<tr key={order.id}><td className="px-4 py-2 text-sm text-gray-400">...{order.id.slice(-6)}</td><td className="px-4 py-2 text-sm text-gray-200">{order.studentName}</td><td className="px-4 py-2 text-sm text-gray-400">{new Date(order.timestamp).toLocaleDateString()}</td><td className="px-4 py-2"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>{order.status}</span></td><td className="px-4 py-2 text-sm font-semibold text-gray-200">₹{(order.totalAmount || 0).toFixed(2)}</td></tr>))}</tbody></table> : <p className="text-center text-gray-400 py-4">No historical orders found.</p>}</div>
        </div>
    );
};

const StaffManagementView: React.FC<{
    staff: User[];
    onAddStaff: (details: { name: string, phone: string, password: string }) => Promise<void>;
    onDeleteStaff: (userId: string) => Promise<void>;
}> = ({ staff, onAddStaff, onDeleteStaff }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (!/^\d{10}$/.test(phone)) {
            setError("Please enter a valid 10-digit phone number.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onAddStaff({ name, phone, password });
            setName('');
            setPhone('');
            setPassword('');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <h3 className="text-xl font-bold text-gray-200 mb-4">Create New Staff Account</h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-gray-400 block mb-1">Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full input-field" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-gray-400 block mb-1">Phone</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full input-field" />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-sm font-medium text-gray-400 block mb-1">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full input-field" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full btn-primary h-10">
                        {isSubmitting ? 'Creating...' : 'Add Staff'}
                    </button>
                    {error && <p className="text-red-400 text-sm md:col-span-4">{error}</p>}
                </form>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <h3 className="text-xl font-bold text-gray-200 mb-4">Current Staff ({staff.length})</h3>
                <div className="space-y-3">
                    {staff.map(s => (
                        <div key={s.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                            <div>
                                <p className="font-semibold text-white">{s.username}</p>
                                <p className="text-sm text-gray-400">{s.phone}</p>
                            </div>
                            <button onClick={() => onDeleteStaff(s.id)} className="text-sm bg-red-800 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-red-700">
                                Remove
                            </button>
                        </div>
                    ))}
                    {staff.length === 0 && <p className="text-gray-500 text-center py-4">No staff accounts created yet.</p>}
                </div>
            </div>
             <style>{`
                .input-field { padding: 0.5rem 0.75rem; border-radius: 0.375rem; border: 1px solid #4B5563; background-color: #1F2937; color: white; }
                .btn-primary { background-color: #4F46E5; color: white; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.375rem; }
                .btn-primary:hover { background-color: #4338CA; }
                .btn-primary:disabled { background-color: #4f46e580; cursor: not-allowed; }
            `}</style>
        </div>
    );
}

export const OwnerDashboard: React.FC = () => {
    const { user, registerStaffUser } = useAuth();
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const [activeTab, setActiveTab] = useState<DashboardTab>('live');

    const [orders, setOrders] = useState<Order[]>([]);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [salesSummary, setSalesSummary] = useState<SalesSummary>({ daily: [], weekly: [] });
    const [mostSellingItems, setMostSellingItems] = useState<{ name: string; count: number }[]>([]);
    const [orderStatusSummary, setOrderStatusSummary] = useState<{ name: string; value: number }[]>([]);
    const [customerPoints, setCustomerPoints] = useState<StudentPoints[]>([]);
    const [todaysStats, setTodaysStats] = useState<TodaysDashboardStats>({ totalOrders: 0, totalIncome: 0, itemsSold: [] });
    const [staff, setStaff] = useState<User[]>([]);
    const [staffScanCounts, setStaffScanCounts] = useState<{ name: string; count: number }[]>([]);
    
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            const [
                ordersData, menuData, salesData, sellingItemsData, statusSummaryData,
                pointsData, todaysStatsData, staffData
            ] = await Promise.all([
                getOwnerOrders(), getMenu(), getSalesSummary(), getMostSellingItems(),
                getOrderStatusSummary(), getStudentPointsList(), getTodaysDashboardStats(), getScanTerminalStaff()
            ]);

            setOrders(ordersData);
            setMenu(menuData);
            setSalesSummary(salesData);
            setMostSellingItems(sellingItemsData);
            setOrderStatusSummary(statusSummaryData);
            setCustomerPoints(pointsData);
            setTodaysStats(todaysStatsData);
            setStaff(staffData);

            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const collectedToday = ordersData.filter(o => o.status === OrderStatus.COLLECTED && new Date(o.timestamp) >= todayStart && o.collectedByStaffId);
            const scanCounts: { [key: string]: number } = {};
            
            for (const order of collectedToday) {
                if (order.collectedByStaffId) {
                    scanCounts[order.collectedByStaffId] = (scanCounts[order.collectedByStaffId] || 0) + 1;
                }
            }
            
            // Combine scan-only staff with the main owner for the leaderboard map
            const allScanners = user ? [...staffData, user] : staffData;
            
            // WORKAROUND: Use the same numeric ID logic as in verifyQrCodeAndCollectOrder.
            // The `collected_by_staff_id` is stored as an integer, so we map users by a derived integer ID.
            const staffMap = new Map(allScanners.map(s => {
                // This logic must match the one in `verifyQrCodeAndCollectOrder`
                const numericId = parseInt(s.id.split('-')[0], 16);
                return [String(numericId), s.username];
            }));

            const leaderboard = Object.entries(scanCounts)
                .map(([staffId, count]) => ({ name: staffMap.get(staffId) || 'Unknown Staff', count }))
                .sort((a, b) => b.count - a.count);

            setStaffScanCounts(leaderboard);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
                console.log('Order change received!', payload);
                fetchData();
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData]);


    const handleAvailabilityChange = async (itemId: string, isAvailable: boolean) => {
        try {
            await updateMenuAvailability(itemId, isAvailable);
            setMenu(prev => prev.map(item => item.id === itemId ? { ...item, isAvailable } : item));
        } catch (error) { console.error("Failed to update menu availability", error); }
    };

    const handleAddStaff = async (details: { name: string, phone: string, password: string }) => {
        await registerStaffUser(details.name, details.phone, details.password);
        fetchData();
    };

    const handleDeleteStaff = async (userId: string) => {
        if (window.confirm("Are you sure you want to remove this staff member? This action is permanent.")) {
            await deleteScanTerminalStaff(userId);
            fetchData();
        }
    };
    
    const historicalOrders = useMemo(() => 
        orders.filter(o => o.status === OrderStatus.COLLECTED || o.status === OrderStatus.CANCELLED), 
    [orders]);

    const TabButton: React.FC<{ tab: DashboardTab, label: string }> = ({ tab, label }) => (
        <button onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-semibold rounded-md text-sm transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            {label}
        </button>
    );

    const renderOrderDetails = (order: Order) => {
      const { id, studentName, customerPhone, seatNumber, items, totalAmount, couponCode, discountAmount } = order;
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      return (
        <div className="text-sm text-gray-300 space-y-4">
          <div>
            <h3 className="font-bold text-lg text-white mb-2">Customer Details</h3>
            <p><strong>Name:</strong> {studentName}</p>
            {customerPhone && <p><strong>Phone:</strong> {customerPhone}</p>}
            {seatNumber && <p className="font-bold text-lg text-amber-400 mt-2">🪑 Seat Number: {seatNumber}</p>}
          </div>

          <div>
            <h3 className="font-bold text-lg text-white mb-2">Items Ordered</h3>
            <ul className="space-y-2">
              {items.map(item => (
                <li key={item.id} className="border-b border-gray-700 pb-2">
                  <div className="flex justify-between">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.notes && <p className="text-xs text-indigo-400 italic pl-2">Note: "{item.notes}"</p>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg text-white mb-2">Payment Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
              {discountAmount && discountAmount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount ({couponCode}):</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-xl pt-2 border-t border-gray-600">
                <span>Total Paid:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
        <div className="space-y-8">
            {viewingOrder && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in-down" onClick={() => setViewingOrder(null)}>
                    <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full border border-gray-700 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewingOrder(null)} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                        <h2 className="text-2xl font-bold mb-4">Order ...{viewingOrder.id.slice(-6)}</h2>
                        <div className="overflow-y-auto scrollbar-thin max-h-[60vh] pr-2">
                            {renderOrderDetails(viewingOrder)}
                        </div>
                    </div>
                </div>
            )}
            
            {loading ? (
                 <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-400">Loading Dashboard...</p>
                </div>
            ) : (
                <>
                    <DailyStats stats={todaysStats} />
                    
                    <div className="bg-gray-800/50 backdrop-blur-md border border-gray-700 p-2 rounded-lg flex flex-wrap gap-2 mb-6 sticky top-20 z-10">
                        <TabButton tab="live" label="Live View" />
                        <TabButton tab="analytics" label="Analytics" />
                        <TabButton tab="management" label="Management" />
                        <TabButton tab="history" label="History" />
                        <TabButton tab="staff" label="Staff" />
                    </div>

                    {activeTab === 'live' && (
                        <div className="space-y-6 animate-fade-in-down">
                            <OrdersManager orders={orders} onStatusUpdate={fetchData} onViewOrder={setViewingOrder} />
                            <StaffScanLeaderboard counts={staffScanCounts} />
                        </div>
                    )}
                    {activeTab === 'analytics' && <div className="animate-fade-in-down"><AnalyticsView salesSummary={salesSummary} mostSellingItems={mostSellingItems} orderStatusSummary={orderStatusSummary} /></div>}
                    {activeTab === 'management' && <div className="animate-fade-in-down"><ManagementView menu={menu} customerPoints={customerPoints} onAvailabilityChange={handleAvailabilityChange} /></div>}
                    {activeTab === 'history' && <div className="animate-fade-in-down"><OrderHistoryView orders={historicalOrders} /></div>}
                    {activeTab === 'staff' && <div className="animate-fade-in-down"><StaffManagementView staff={staff} onAddStaff={handleAddStaff} onDeleteStaff={handleDeleteStaff} /></div>}
                </>
            )}
        </div>
    );
};
