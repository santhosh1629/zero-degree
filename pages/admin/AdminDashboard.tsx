import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/common/Header';
import type { User } from '../../types';
import { getUsers, getFeedbacks } from '../../services/mockApi';
import type { Feedback } from '../../types';

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const usersData = await getUsers();
                const feedbacksData = await getFeedbacks();
                setUsers(usersData);
                setFeedbacks(feedbacksData);
            } catch (error) {
                console.error("Error fetching admin data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="bg-gray-900 min-h-screen text-white">
                <Header />
                <main className="container mx-auto p-4 sm:p-6 lg:p-8 animate-pulse">
                    <div className="h-10 bg-gray-700 rounded w-1/3 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-gray-800 p-6 rounded-lg h-48"></div>
                        <div className="bg-gray-800 p-6 rounded-lg h-96"></div>
                        <div className="bg-gray-800 p-6 rounded-lg h-96"></div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 min-h-screen text-white">
            <Header />
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-4xl font-bold text-white mb-6 animate-fade-in-down">Admin Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Owner Approvals */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md animate-pop-in" style={{ animationDelay: '100ms' }}>
                        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Owner Approvals</h2>
                        <p className="text-gray-300 mb-4">Review and approve new canteen owner registrations.</p>
                        <Link to="/admin/approvals" className="inline-block bg-indigo-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-indigo-700 transition-colors">
                            Manage Requests
                        </Link>
                    </div>

                    {/* User Management */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md animate-pop-in" style={{ animationDelay: '200ms' }}>
                        <h2 className="text-2xl font-bold mb-4 text-indigo-400">User Management</h2>
                        <div className="overflow-x-auto max-h-96 scrollbar-thin">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700/50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Role</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-200">{user.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">{user.role}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Feedback Viewer */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-md animate-pop-in" style={{ animationDelay: '300ms' }}>
                         <h2 className="text-2xl font-bold mb-4 text-indigo-400">Student Feedback</h2>
                         <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin pr-2">
                            {feedbacks.map(fb => (
                                <div key={fb.id} className="p-3 bg-gray-700/50 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-200">{fb.studentName}</p>
                                        <div className="flex items-center">
                                            {[...Array(fb.rating)].map((_, i) => (
                                                <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 mt-1 italic">"{fb.comment}"</p>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;