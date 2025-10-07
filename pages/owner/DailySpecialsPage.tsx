import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getMenu, addMenuItem, updateMenuItem, removeMenuItem } from '../../services/mockApi';
import type { MenuItem } from '../../types';

type FormState = {
    name: string;
    price: number | '';
    imageUrl: string;
    isAvailable: boolean;
    emoji: string;
    description: string;
    isCombo: boolean;
    comboItemIds: string[];
};

const initialFormState: FormState = {
    name: '', price: '', imageUrl: '', isAvailable: true, emoji: '', description: '', isCombo: false, comboItemIds: [],
};

const processAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 250;
                
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error('Canvas context failed'));

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Use a reasonable quality for compression to keep file size low
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7); 
                resolve(dataUrl);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
};


const DailySpecialsPage: React.FC = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [formData, setFormData] = useState<FormState>(initialFormState);
    
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageError, setImageError] = useState('');


    const fetchMenu = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMenu();
            setMenuItems(data);
        } catch (error) { console.error("Failed to fetch menu", error); } 
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchMenu(); }, [fetchMenu]);
    
    const regularMenuItems = useMemo(() => menuItems.filter(item => !item.isCombo), [menuItems]);

    const handleOpenModal = (item: MenuItem | null = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name, price: item.price, imageUrl: item.imageUrl, isAvailable: item.isAvailable,
                emoji: item.emoji || '', description: item.description || '', isCombo: item.isCombo || false,
                comboItemIds: item.comboItems?.map(ci => ci.id) || [],
            });
            setImagePreview(item.imageUrl);
        } else {
            setEditingItem(null);
            setFormData(initialFormState);
            setImagePreview(null);
        }
        setImageError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { 
        setIsModalOpen(false); 
        setEditingItem(null); 
        setFormData(initialFormState);
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImagePreview(null);
        setImageError('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: isCheckbox ? checked : (name === 'price' ? (value === '' ? '' : parseFloat(value)) : value) }));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setImageError('File too large (max 5MB)');
            return;
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setImageError('Invalid file type (JPG, PNG, WEBP only)');
            return;
        }

        setImageError('');
        setIsProcessingImage(true);
        
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);

        try {
            const compressedDataUrl = await processAndCompressImage(file);
            setFormData(prev => ({...prev, imageUrl: compressedDataUrl}));
        } catch (err) {
            setImageError('Could not process image.');
            setImagePreview(null);
        } finally {
            setIsProcessingImage(false);
            URL.revokeObjectURL(previewUrl); // Clean up blob URL after processing
        }
    };


    const handleComboItemChange = (itemId: string) => {
        setFormData(prev => {
            const newComboItemIds = new Set(prev.comboItemIds);
            newComboItemIds.has(itemId) ? newComboItemIds.delete(itemId) : newComboItemIds.add(itemId);
            return { ...prev, comboItemIds: Array.from(newComboItemIds) };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.price === '' || !formData.imageUrl) {
            // Add a check for imageUrl to ensure processing is complete or an image was loaded
            return;
        }
        const comboItems = formData.isCombo ? formData.comboItemIds.map(id => ({ id, name: regularMenuItems.find(i => i.id === id)?.name || 'Unknown' })) : undefined;
        const itemData: Partial<MenuItem> = { ...formData, price: formData.price, comboItems };

        try {
            if (editingItem) await updateMenuItem(editingItem.id, itemData);
            else await addMenuItem(itemData);
            fetchMenu(); handleCloseModal();
        } catch (error) { console.error("Failed to save menu item", error); }
    };
    
    const handleDelete = async (itemId: string) => {
        if (window.confirm("Are you sure you want to delete this menu item?")) {
            try { await removeMenuItem(itemId); fetchMenu(); } 
            catch (error) { console.error("Failed to delete menu item", error); }
        }
    }
    
    if (loading) return <p className="text-gray-300">Loading menu...</p>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-gray-200">Manage Menu 📋</h1>
                <button onClick={() => handleOpenModal()} className="bg-indigo-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
                    + Add New Item
                </button>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {menuItems.map(item => (
                                <tr key={item.id} className="hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-200">
                                        {item.emoji} {item.name}
                                        {item.isCombo && <span className="ml-2 text-xs font-semibold bg-indigo-500 text-white px-2 py-1 rounded-full">COMBO</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">₹{item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isAvailable ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {item.isAvailable ? 'Available' : 'Unavailable'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(item)} className="text-indigo-400 hover:text-indigo-300 font-semibold">Edit</button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-400 ml-4 font-semibold">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {menuItems.length === 0 && <p className="text-center text-gray-400 py-4">No menu items found. Add one to get started!</p>}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
                    <div className="bg-gray-800 border border-gray-700 p-8 rounded-lg shadow-xl w-full max-w-lg animate-fade-in-down max-h-[90vh] overflow-y-auto scrollbar-thin">
                        <h2 className="text-2xl font-bold mb-6 text-white">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4 text-gray-300">
                            <InputField label="Name" name="name" value={formData.name} onChange={handleInputChange} required />
                            <InputField label="Emoji" name="emoji" value={formData.emoji} placeholder="e.g., 🍔" onChange={handleInputChange} />
                            <InputField label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleInputChange} required step="0.01" min="0" />
                            
                             <div>
                                <label className="block text-gray-300 font-semibold mb-2">Item Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 flex-shrink-0 bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden border border-gray-600">
                                        {isProcessingImage ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                                        ) : imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-gray-500 text-xs text-center">No Image</span>
                                        )}
                                    </div>
                                    <div className="flex-grow">
                                        <input id="image-upload" type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/webp" className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700" />
                                        {imageError && <p className="text-red-400 text-xs mt-1">{imageError}</p>}
                                    </div>
                                </div>
                            </div>

                            <CheckboxField label="Item is available for ordering" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} />
                            <CheckboxField label="This is a Combo Deal" name="isCombo" checked={formData.isCombo} onChange={handleInputChange} />
                            
                            {formData.isCombo && (
                                <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 space-y-4">
                                    <TextAreaField label="Combo Description" name="description" value={formData.description} onChange={handleInputChange} />
                                    <div>
                                        <label className="block font-semibold mb-2">Select Items for Combo</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded-lg bg-gray-800 border-gray-600">
                                            {regularMenuItems.map(item => (
                                                <label key={item.id} className="flex items-center p-2 rounded-md hover:bg-gray-700">
                                                    <input type="checkbox" checked={formData.comboItemIds.includes(item.id)} onChange={() => handleComboItemChange(item.id)} className="form-checkbox h-4 w-4 bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500"/>
                                                    <span className="ml-2 text-sm">{item.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={handleCloseModal} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">{editingItem ? 'Save Changes' : 'Add Item'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
// Reusable form components for dark theme
const InputField: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-gray-300 font-semibold mb-2">{label}</label>
        <input id={props.name} {...props} className="w-full px-4 py-2 border border-gray-600 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
);
const TextAreaField: React.FC<any> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-gray-300 font-semibold mb-2">{label}</label>
        <textarea id={props.name} rows={2} {...props} className="w-full px-4 py-2 border border-gray-600 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
    </div>
);
const CheckboxField: React.FC<any> = ({ label, ...props }) => (
    <label className="flex items-center">
        <input type="checkbox" {...props} className="form-checkbox h-5 w-5 bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-500 rounded"/>
        <span className="ml-3 font-medium">{label}</span>
    </label>
);

export default DailySpecialsPage;