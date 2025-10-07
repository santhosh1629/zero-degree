import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// --- Icon Components ---
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
const DashboardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
const MenuBoardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>);
const ScanIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M7 21v-2M17 21v-2M7 3v2M17 3v2" /></svg>);
const FeedbackDrawerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>);
const PopularityIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>);
const RewardsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" /><path d="M9 11l3-3m0 0l3 3m-3-3v8m-9 5a9 9 0 1118 0 9 9 0 01-18 0z" /></svg>);
const PaymentIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>);
const LogoutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>);
const DemoOrdersDrawerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a4 4 0 00-5.656 0l-2.829 2.829a4 4 0 01-5.656-5.656l2.829-2.829a4 4 0 005.656-5.656l-2.829-2.829a4 4 0 00-5.656 5.656l2.829 2.829" /><path d="M12 21v-4m0 0V6.5a3.5 3.5 0 00-3.5-3.5H8.5a3.5 3.5 0 000 7h3.5" /></svg>);

const OwnerLayout: React.FC = () => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        await logout();
        setShowLogoutConfirm(false);
        navigate('/');
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    const primaryNavLinks = [
        { to: "/owner/dashboard", icon: <DashboardIcon />, label: "Dashboard" },
        { to: "/owner/menu", icon: <MenuBoardIcon />, label: "Menu" },
        { to: "/owner/scan", icon: <ScanIcon />, label: "Scan QR" },
    ];

    const drawerNavLinks = [
        { to: "/owner/popularity", icon: <PopularityIcon />, label: "Food Popularity" },
        { to: "/owner/rewards", icon: <RewardsIcon />, label: "Rewards" },
        { to: "/owner/demo-orders", icon: <DemoOrdersDrawerIcon />, label: "Demo Orders" },
        { to: "/owner/bank-details", icon: <PaymentIcon />, label: "Payment Details" },
        { to: "/owner/feedback", icon: <FeedbackDrawerIcon />, label: "Feedback" },
    ];

    const DrawerNavLink: React.FC<{ to: string, icon: React.ReactNode, label: string }> = ({ to, icon, label }) => (
        <NavLink
            to={to}
            onClick={() => setIsDrawerOpen(false)}
            className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
            }
        >
            {icon} {label}
        </NavLink>
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-900 text-gray-300">
            {/* Drawer Overlay */}
            {isDrawerOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 transition-opacity lg:hidden"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Side Drawer */}
            <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Zero✦Degree</h2>
                    <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-white">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-4 flex flex-col h-full">
                    <div className="flex-grow space-y-2">
                        {drawerNavLinks.map(link => <DrawerNavLink key={link.to} {...link} />)}
                    </div>
                    <div className="mt-auto">
                        <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-red-800/50 hover:text-white transition-colors"
                        >
                            <LogoutIcon /> Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Header */}
            <header className="bg-gray-800/80 backdrop-blur-md shadow-md sticky top-0 z-30 border-b border-gray-700">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsDrawerOpen(true)} className="text-gray-300 hover:text-white">
                            <MenuIcon />
                        </button>
                        <h1 className="text-xl font-bold text-white">Owner Panel</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-sm hidden sm:block">
                            Welcome, <span className="font-bold">{user?.username}</span>
                        </div>
                        <button
                            onClick={handleLogoutClick}
                            title="Logout"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3 sm:px-4 rounded-lg text-sm transition-colors flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Desktop Primary Nav */}
            <nav className="hidden sm:block bg-gray-800 border-b border-gray-700">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-14 space-x-8">
                        {primaryNavLinks.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 font-medium border-b-2 transition-colors ${
                                    isActive ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-white'
                                    }`
                                }
                            >
                                {link.icon}
                                <span>{link.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
                <div key={location.pathname} className="animate-fade-in-down">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Nav for mobile */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg z-30">
                <div className="flex justify-around items-center h-16">
                    {primaryNavLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `flex flex-col items-center justify-center gap-1 w-full transition-colors ${
                                isActive ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-400'
                                }`
                            }
                        >
                            {link.icon}
                            <span className="text-xs font-medium">{link.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-sm animate-fade-in-down">
                        <h2 className="text-xl font-bold mb-4 text-center text-white">Confirm Logout</h2>
                        <p className="text-center text-gray-300 mb-6">Are you sure you want to logout?</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={cancelLogout} className="bg-gray-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-500 transition-colors">
                                Cancel
                            </button>
                            <button onClick={confirmLogout} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerLayout;