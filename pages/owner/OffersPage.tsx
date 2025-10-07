import React, { useState, useEffect, useCallback } from 'react';
// FIX: Imported the correct API functions for owner-side offer management.
import { getAllOffersForOwner, createOffer, updateOfferStatus } from '../../services/mockApi';
import type { Offer } from '../../types';

// FIX: FormState was missing required properties.
type FormState = Omit<Offer, 'id' | 'isUsed' | 'studentId' | 'isReward' | 'isActive'>;

// FIX: Initial form state was missing properties, causing type errors.
const initialFormState: FormState = { code: '', description: '', discountType: 'fixed', discountValue: 0 };

const OffersPage: React.FC = () => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const [error, setError] = useState('');

    const fetchOffers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAllOffersForOwner();
            setOffers(data);
        } catch (err) {
            console.error("Failed to fetch offers", err);
            setError("Could not load offers data.");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOffers(); }, [fetchOffers]);

    const handleOpenModal = () => { setFormData(initialFormState); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setError(''); };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'discountValue' ? Number(value) : value.toUpperCase() }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.code || !formData.description || formData.discountValue <= 0) {
            setError("Coupon code, description, and a positive discount value are required.");
            return;
        }
        try {
            await createOffer({ ...formData, isActive: true });
            fetchOffers(); handleCloseModal();
        } catch (err) { setError((err as Error).message); }
    };

    const handleToggleStatus = async (offer: Offer) => {
        try {
            // FIX: The property 'isActive' is now available on the Offer type.
            await updateOfferStatus(offer.id, !offer.isActive);
            fetchOffers();
        } catch (err) {
            console.error("Failed to toggle offer status", err);
            setError("Failed to update status. Please try again.");
        }
    };
    
    if(loading) return <p className="text-gray-300">Loading offers...</p>

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-200">Manage Offers 🎟️</h1>
                <button onClick={handleOpenModal} className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
                    + Create New Offer
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <p className="mb-4 text-gray-400">Create and manage promotional coupon codes for students.</p>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Discount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {offers.map(offer => (
                                <tr key={offer.id}>
                                    <td className="px-6 py-4 font-mono font-bold text-lg text-gray-200">{offer.code}</td>
                                    <td className="px-6 py-4 text-gray-300">{offer.discountType === 'fixed' ? `₹${offer.discountValue}` : `${offer.discountValue}%`} OFF</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${offer.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {offer.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleToggleStatus(offer)} className="text-indigo-400 hover:text-indigo-300 font-semibold">
                                            {offer.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {offers.length === 0 && <p className="text-center text-gray-400 py-4">No offers created yet.</p>}
                </div>
            </div>
            
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-md animate-fade-in-down">
                        <h2 className="text-2xl font-bold mb-6 text-white">Create New Offer</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="Coupon Code (e.g., SAVE10)" required className="w-full input" />
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description (e.g., Special discount for all students)" required className="w-full input" rows={2}/>
                            <div className="grid grid-cols-2 gap-4">
                                <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="w-full input bg-gray-700 text-white">
                                    <option value="fixed">Fixed (₹)</option>
                                    <option value="percentage">Percentage (%)</option>
                                </select>
                                <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} placeholder="Value" required className="w-full input" />
                            </div>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">Create Offer</button>
                            </div>
                        </form>
                    </div>
                 </div>
            )}
            
             <style>{`
                .input {
                    padding: 0.75rem 1rem; border-radius: 0.5rem; border: 1px solid #374151; background-color: #1F2937; color: white; width: 100%;
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

export default OffersPage;