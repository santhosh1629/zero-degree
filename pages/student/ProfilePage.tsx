

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStudentProfile, updateStudentProfile } from '../../services/mockApi';
import type { StudentProfile } from '../../types';
import { Link } from 'react-router-dom';

const MILESTONES = [
    { spend: 200, value: 10 },
    { spend: 500, value: 30 },
    { spend: 1000, value: 50 },
];

const StatCard: React.FC<{ icon: string; label: string; value: string | number }> = ({ icon, label, value }) => (
    <div className="bg-black/40 backdrop-blur-lg border border-white/20 p-4 rounded-xl flex items-center gap-4 text-white">
        <div className="bg-primary text-white p-3 rounded-full text-2xl">
            {icon}
        </div>
        <div>
            <p className="text-sm text-white/80">{label}</p>
            <p className="text-2xl font-bold font-heading">{value}</p>
        </div>
    </div>
);

const MilestoneRewards: React.FC<{ profile: StudentProfile }> = ({ profile }) => {
    const nextMilestone = useMemo(() => {
        return MILESTONES.find(m => !profile.milestoneRewardsUnlocked.includes(m.spend));
    }, [profile.milestoneRewardsUnlocked]);

    const lastMilestoneSpend = useMemo(() => {
        if (!nextMilestone) return MILESTONES[MILESTONES.length - 1]?.spend || 0;
        const currentMilestoneIndex = MILESTONES.findIndex(m => m.spend === nextMilestone.spend);
        return currentMilestoneIndex > 0 ? MILESTONES[currentMilestoneIndex - 1].spend : 0;
    }, [nextMilestone]);

    const progressPercentage = useMemo(() => {
        if (!nextMilestone) return 100;
        const range = nextMilestone.spend - lastMilestoneSpend;
        const progressInRange = profile.lifetimeSpend - lastMilestoneSpend;
        return Math.max(0, Math.min(100, (progressInRange / range) * 100));
    }, [profile.lifetimeSpend, nextMilestone, lastMilestoneSpend]);

    return (
        <div className="bg-black/50 backdrop-blur-lg border border-white/20 p-6 rounded-2xl">
            <h2 className="text-xl font-bold font-heading mb-4">Milestone Rewards</h2>
            {nextMilestone ? (
                <>
                    <div className="flex justify-between items-end mb-2 text-sm">
                        <span className="font-semibold text-white/90">Lifetime Spent: ₹{profile.lifetimeSpend.toFixed(0)}</span>
                        <span className="font-bold text-primary">Next Reward at ₹{nextMilestone.spend}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-4 border border-gray-600">
                        <div className="bg-primary h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </>
            ) : (
                <p className="text-center text-green-400 font-semibold bg-green-500/20 p-3 rounded-md">🎉 You've unlocked all milestone rewards!</p>
            )}

            <div className="mt-6">
                <h3 className="font-semibold mb-3 text-white/90">Unlocked Rewards:</h3>
                {MILESTONES.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {MILESTONES.map(m => (
                             <span key={m.spend} className={`text-xs font-bold py-1 px-3 rounded-full border ${profile.milestoneRewardsUnlocked.includes(m.spend) ? 'bg-green-500/20 text-green-300 border-green-400/50' : 'bg-gray-700/50 text-gray-400 border-gray-600'}`}>
                                ₹{m.value} OFF {profile.milestoneRewardsUnlocked.includes(m.spend) ? '✅' : '🔒'}
                            </span>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-400">No milestone rewards available yet.</p>}
            </div>
        </div>
    );
};


const ProfilePage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });
    const [message, setMessage] = useState('');

    const fetchProfile = useCallback(async () => {
        if (user) {
            try {
                // setLoading(true); // Don't set loading on refetch to avoid flicker
                const profileData = await getStudentProfile(user.id);
                setProfile(profileData);
                setFormData({ name: profileData.name, phone: profileData.phone });
            } catch (error) {
                console.error("Failed to fetch profile:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        try {
            await updateStudentProfile(user.id, formData);
            if(profile) {
                setProfile({ ...profile, name: formData.name, phone: formData.phone });
            }
            updateUser({ username: formData.name, phone: formData.phone });
            setIsEditing(false);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
             setMessage('Failed to update profile.');
             console.error(error);
        }
    }

    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
                <div className="h-9 bg-black/50 rounded-lg w-1/2 mx-auto"></div>
                <div>
                    <div className="h-7 bg-black/50 rounded-lg w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="h-20 bg-black/50 rounded-xl"></div>
                        <div className="h-20 bg-black/50 rounded-xl"></div>
                        <div className="h-20 bg-black/50 rounded-xl"></div>
                    </div>
                </div>
                <div className="h-48 bg-black/50 rounded-xl"></div>
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center text-white">Could not load profile.</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 text-white">
            <h1 className="text-3xl font-bold font-heading text-center" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Your Profile 👤</h1>
            
            {/* Quick Stats Section */}
            <div>
                <h2 className="text-xl font-bold font-heading mb-4" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Quick Stats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard icon="🧾" label="Total Orders" value={profile.totalOrders} />
                    <StatCard icon="💸" label="Lifetime Spend" value={`₹${profile.lifetimeSpend.toFixed(0)}`} />
                    <StatCard icon="❤️" label="Favorites" value={profile.favoriteItemsCount} />
                    <div className="sm:col-span-2 lg:col-span-3">
                         <div className="bg-accent/40 backdrop-blur-lg border border-white/20 p-4 rounded-xl flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="bg-accent text-white p-3 rounded-full text-2xl">
                                    ⭐
                                </div>
                                <div>
                                    <p className="text-sm text-white/80">Loyalty Points</p>
                                    <p className="text-2xl font-bold font-heading text-white">{profile.loyaltyPoints}</p>
                                </div>
                            </div>
                            <Link to="/student/rewards" className="bg-accent text-white font-bold font-heading py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                                Redeem
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <MilestoneRewards profile={profile} />

            {/* Personal Info Section */}
            <div className="bg-black/50 backdrop-blur-lg border border-white/20 p-6 rounded-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold font-heading">Personal Information</h2>
                    <button onClick={() => setIsEditing(!isEditing)} className="text-sm font-semibold text-primary hover:underline">
                        {isEditing ? 'Cancel' : 'Edit'}
                    </button>
                </div>
                {isEditing ? (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">Name</label>
                            <input type="text" id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-white/30 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                         <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-1">Phone</label>
                            <input type="tel" id="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-white/30 bg-black/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <button type="submit" className="bg-primary text-white font-bold font-heading py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors">Save Changes</button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-white/80">Name</p>
                            <p className="text-lg">{profile.name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white/80">Phone</p>
                            <p className="text-lg">{profile.phone}</p>
                        </div>
                    </div>
                )}
                {message && <p className="mt-4 text-center text-sm text-green-400">{message}</p>}
            </div>
        </div>
    );
};

export default ProfilePage;