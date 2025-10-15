import React, { useState, useEffect, useCallback } from 'react';
import { getAllOffersForOwner, createOffer, updateOffer, deleteOffer } from '../../services/mockApi';
import type { Offer } from '../../types';

type FormState = Omit<Offer, 'id' | 'isUsed' | 'studentId' | 'isReward'>;

const initialFormState: FormState = { code: '', description: '', discountType: 'fixed', discountValue: 0, isActive: true };

const AddOfferCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <div className="flex items-center justify-center">
        <button
            onClick={onClick}
            className="group flex flex-col items-center justify-center w-full h-full min-h-[280px] bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-all duration-300 shadow-lg hover:shadow-indigo-500/20"
        >
            <svg className="w-12 h-12 mb-2 transition-transform group-hover:scale-110 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="font-bold text-lg">Create New Offer</span>
        </button>
    </div>
);

const OfferCard: React.FC<{ offer: Offer; onEdit: (offer: Offer) => void; onDelete: (offerId: string) => void; onToggleStatus: (offer: Offer) => void; }> = ({ offer, onEdit, onDelete, onToggleStatus }) => (
    <div className={`bg-gray-800 rounded-2xl shadow-md border border-gray-700 overflow-hidden flex flex-col transition-all duration-300 ${!offer.isActive ? 'opacity-60' : ''}`}>
        <div className="p-5 flex-grow">
             <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold font-mono text-indigo-400 bg-gray-700/50 px-3 py-1 rounded-md">{offer.code}</h3>
                 <div className={`text-xs font-bold px-2 py-1 rounded-full text-white ${offer.isActive ? 'bg-green-600/80' : 'bg-red-600/80'}`}>
                    {offer.isActive ? 'ACTIVE' : 'INACTIVE'}
                </div>
            </div>
            <p className="text-sm text-gray-400 mt-2 min-h-[40px]">{offer.description}</p>
             <div className="mt-4 flex justify-between items-center">
                <p className="font-bold text-amber-400 text-2xl">
                    {offer.discountType === 'fixed' ? `₹${offer.discountValue}` : `${offer.discountValue}%`} <span className="text-base">OFF</span>
                </p>
            </div>
        </div>
        <div className="bg-gray-700/50 p-2 flex justify-between items-center">
             <label className="flex items-center cursor-pointer px-2">
                <div className="relative">
                    <input type="checkbox" className="sr-only" checked={offer.isActive} onChange={() => onToggleStatus(offer)} />
                    <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${offer.isActive ? 'transform translate-x-4 bg-green-400' : ''}`}></div>
                </div>
                <div className="ml-2 text-xs font-semibold text-gray-300">
                    {offer.isActive ? 'Active' : 'Inactive'}
                </div>
            </label>
            <div className="flex gap-2">
                <button onClick={() => onEdit(offer)} className="text-sm bg-gray-600 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-gray-500 transition-colors">Edit</button>
                <button onClick={() => onDelete(offer.id)} className="text-sm bg-red-800 text-white font-semibold px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors">Delete</button>
            </div>
        </div>
    </div>
);


const OffersPage: React.FC = () => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    const [error, setError] = useState('');

    const fetchOffers = useCallback(async () => {
        try {
            const data = await getAllOffersForOwner();
            setOffers(data);
        } catch (err) {
            console.error("Failed to fetch offers", err);
            setError("Could not load offers data.");
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchOffers().finally(() => setLoading(false));
    }, [fetchOffers]);

    useEffect(() => {
        if (isModalOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            
            return () => {
                document.body.style.overflow = 'auto';
                document.body.style.paddingRight = '0';
            };
        }
    }, [isModalOpen]);

    const handleOpenModal = (offer: Offer | null = null) => {
        if (offer) {
            setEditingOffer(offer);
            setFormData({
                code: offer.code,
                description: offer.description,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                isActive: offer.isActive ?? true,
            });
        } else {
            setEditingOffer(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingOffer(null);
        setError('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({
            ...prev,
            [name]: isCheckbox
                ? checked
                : (name === 'discountValue')
                    ? Number(value)
                    : (name === 'code')
                        ? value.toUpperCase()
                        : value
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.code || !formData.description || formData.discountValue <= 0) {
            setError("Coupon code, description, and a positive discount value are required.");
            return;
        }
        const payload = { ...formData, discountValue: Number(formData.discountValue) };
        try {
            if (editingOffer) {
                await updateOffer(editingOffer.id, payload);
            } else {
                await createOffer(payload);
            }
            fetchOffers();
            handleCloseModal();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleDelete = async (offerId: string) => {
        if (window.confirm("Are you sure you want to delete this offer?")) {
            await deleteOffer(offerId);
            fetchOffers();
        }
    };

    const handleToggleStatus = async (offer: Offer) => {
        await updateOffer(offer.id, { isActive: !offer.isActive });
        fetchOffers();
    };
    
    if(loading) return <p className="text-gray-300">Loading offers...</p>

    return (
        <div>
            <h1 className="text-4xl font-bold text-gray-200 mb-6">Manage Offers 🎟️</h1>

             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <AddOfferCard onClick={() => handleOpenModal()} />
                {offers.map(offer => (
                    <OfferCard 
                        key={offer.id} 
                        offer={offer}
                        onEdit={handleOpenModal}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                    />
                ))}
            </div>
            
            {isModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-16 p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-lg animate-fade-in-down max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin">
                        <h2 className="text-2xl font-bold mb-6 text-white">{editingOffer ? 'Edit Offer' : 'Create New Offer'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="Coupon Code (e.g., SAVE10)" required className="w-full input" />
                            <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Description (e.g., Special discount for all customers)" required className="w-full input" rows={2}/>
                            <div className="grid grid-cols-2 gap-4">
                                <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="w-full input bg-gray-700">
                                    <option value="fixed">Fixed (₹)</option>
                                    <option value="percentage">Percentage (%)</option>
                                </select>
                                <input type="number" name="discountValue" value={formData.discountValue === 0 ? '' : formData.discountValue} onChange={handleInputChange} placeholder="Discount Value" required className="w-full input" min="0" />
                            </div>
                             <label className="flex items-center text-gray-200">
                                <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="form-checkbox h-5 w-5 bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"/>
                                <span className="ml-2">Is Active</span>
                            </label>
                            {error && <p className="text-red-400 text-sm">{error}</p>}
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary">{editingOffer ? 'Save Changes' : 'Create Offer'}</button>
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