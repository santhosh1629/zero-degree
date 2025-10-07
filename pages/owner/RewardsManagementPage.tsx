import React, { useState, useEffect, useCallback } from 'react';
import { getAllRewardsForOwner, createReward, updateReward, deleteReward } from '../../services/mockApi';
import type { Reward } from '../../types';

type FormState = Omit<Reward, 'id'>;

const initialFormState: FormState = {
    title: '',
    description: '',
    pointsCost: 0,
    discount: { type: 'fixed', value: 0 },
    isActive: true,
    expiryDate: '',
};

const RewardsManagementPage: React.FC = () => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Reward | null>(null);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const [error, setError] = useState('');

    const fetchRewards = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllRewardsForOwner();
            setRewards(data);
        } catch (err) {
            console.error("Failed to fetch rewards", err);
            setError("Could not load rewards data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRewards();
    }, [fetchRewards]);

    const handleOpenModal = (reward: Reward | null = null) => {
        if (reward) {
            setEditingReward(reward);
            setFormData({
                title: reward.title,
                description: reward.description,
                pointsCost: reward.pointsCost,
                discount: reward.discount,
                isActive: reward.isActive,
                expiryDate: reward.expiryDate ? reward.expiryDate.split('T')[0] : '',
            });
        } else {
            setEditingReward(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingReward(null);
        setError('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'discountType' || name === 'discountValue') {
            setFormData(prev => ({ ...prev, discount: { ...prev.discount, [name === 'discountType' ? 'type' : 'value']: name === 'discountType' ? value : Number(value) } }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.title || formData.pointsCost <= 0 || formData.discount.value <= 0) {
            setError("Title, and positive point/discount values are required.");
            return;
        }
        const payload = { ...formData, pointsCost: Number(formData.pointsCost), expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined };
        try {
            if (editingReward) {
                await updateReward(editingReward.id, payload);
            } else {
                await createReward(payload);
            }
            fetchRewards();
            handleCloseModal();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleDelete = async (rewardId: string) => {
        if (window.confirm("Are you sure you want to delete this reward?")) {
            await deleteReward(rewardId);
            fetchRewards();
        }
    };

    const handleToggleStatus = async (reward: Reward) => {
        await updateReward(reward.id, { isActive: !reward.isActive });
        fetchRewards();
    };


    if(loading) return <p>Loading rewards...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-200">Manage Rewards 🏆</h1>
                <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
                    + Create Reward
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                         <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Points Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {rewards.map(reward => (
                                <tr key={reward.id}>
                                    <td className="px-6 py-4 font-medium text-gray-200">{reward.title}</td>
                                    <td className="px-6 py-4 text-gray-300">{reward.pointsCost}</td>
                                    <td className="px-6 py-4 text-gray-300">{reward.discount.type === 'fixed' ? `₹${reward.discount.value}` : `${reward.discount.value}%`} OFF</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleToggleStatus(reward)} className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${reward.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {reward.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleOpenModal(reward)} className="text-indigo-400 hover:text-indigo-300 font-semibold">Edit</button>
                                        <button onClick={() => handleDelete(reward.id)} className="text-red-500 hover:text-red-400 ml-4 font-semibold">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-lg animate-fade-in-down max-h-[90vh] overflow-y-auto scrollbar-thin">
                        <h2 className="text-2xl font-bold mb-6 text-white">{editingReward ? 'Edit Reward' : 'Create New Reward'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Title (e.g., Free Drink)" required className="w-full input"/>
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description" className="w-full input" rows={2}/>
                            <input type="number" name="pointsCost" value={formData.pointsCost} onChange={handleInputChange} placeholder="Points Cost (e.g., 100)" required className="w-full input"/>
                            <div className="grid grid-cols-2 gap-4">
                                <select name="discountType" value={formData.discount.type} onChange={handleInputChange} className="w-full input bg-gray-700">
                                    <option value="fixed">Fixed (₹)</option>
                                    <option value="percentage">Percentage (%)</option>
                                </select>
                                <input type="number" name="discountValue" value={formData.discount.value} onChange={handleInputChange} placeholder="Discount Value" required className="w-full input"/>
                            </div>
                            <div>
                                <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-300">Expiry Date (Optional)</label>
                                <input type="date" name="expiryDate" id="expiryDate" value={formData.expiryDate} onChange={handleInputChange} className="w-full input"/>
                            </div>
                            <label className="flex items-center text-gray-200">
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"/>
                                <span className="ml-2">Is Active</span>
                            </label>

                            {error && <p className="text-red-400 text-sm">{error}</p>}

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editingReward ? 'Save Changes' : 'Create Reward'}</button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
             <style>{`
                .input {
                    padding: 0.75rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #374151;
                    background-color: #1F2937;
                    color: white;
                    width: 100%;
                }
                .btn-primary {
                    background-color: #4F46E5; color: white; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background-color 0.2s;
                }
                .btn-primary:hover { background-color: #4338CA; }
                .btn-secondary {
                    background-color: #4B5563; color: white; font-weight: bold; padding: 0.5rem 1rem; border-radius: 0.5rem; transition: background-color 0.2s;
                }
                .btn-secondary:hover { background-color: #374151; }
            `}</style>
        </div>
    )
};

export default RewardsManagementPage;