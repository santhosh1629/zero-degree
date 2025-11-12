// This file now contains functions to interact with a mock database in localStorage.

import { Role as RoleEnum, OrderStatus as OrderStatusEnum } from '../types';
import type { User, MenuItem, Order, OrderStatus, SalesSummary, Feedback, Offer, Reward, StudentPoints, TodaysDashboardStats, TodaysDetailedReport, AdminStats, OwnerBankDetails, CanteenPhoto, StudentProfile } from '../types';

// --- MOCK DATABASE HELPER ---
const getFromStorage = <T>(key: string): T[] => {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
};
const saveToStorage = <T>(key: string, data: T[]): void => localStorage.setItem(key, JSON.stringify(data));

// --- SEED DATA ---
const seedData = {
  users: [
    { id: 'admin-1', username: 'Admin', email: 'admin@sangeetha.com', password: 'password', role: RoleEnum.ADMIN, approvalStatus: 'approved' },
    { id: 'owner-1-approved', username: 'Suresh Kumar', email: 'suresh@cinema.com', phone: '1111111111', password: 'password', role: RoleEnum.CANTEEN_OWNER, canteenName: 'Sangeetha Screen 1 Snacks', approvalStatus: 'approved', approvalDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'owner-2-pending', username: 'Ramesh Jain', email: 'ramesh@cinema.com', phone: '2222222222', password: 'password', role: RoleEnum.CANTEEN_OWNER, canteenName: 'RJ Cinemas Food Court', approvalStatus: 'pending', idProofUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=' },
    { id: 'customer-1', username: 'Priya Sharma', phone: '9999999999', password: 'password', role: RoleEnum.STUDENT, approvalStatus: 'approved', loyaltyPoints: 250 },
    { id: 'staff-1', username: 'Scan Staff 1', phone: '7777777777', password: 'password', role: RoleEnum.CANTEEN_OWNER, approvalStatus: 'approved' } // Staff has no canteenName
  ],
  menu: [
    { id: '1', name: 'Popcorn Tub', price: 150, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1578849224429-f38b2c5826f4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', emoji: '🍿', averageRating: 4.5 },
    { id: '2', name: 'Veg Samosa (2 pcs)', price: 60, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1601050690597-0b2ff9245148?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', emoji: '🥟', averageRating: 4.8 },
    { id: '3', name: 'Cold Coffee', price: 120, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1517701552120-f6d5b481a5c6?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', emoji: '🥤', averageRating: 4.2 },
    { id: '4', name: 'Nachos with Cheese', price: 180, isAvailable: false, imageUrl: 'https://images.unsplash.com/photo-1598514983318-2f64f113fb83?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', emoji: '🧀', averageRating: 4.0 },
    { id: '5', name: 'Movie Combo', price: 300, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1620177082603-75d3a52c3664?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600', emoji: '🎬', isCombo: true, description: '1 Popcorn Tub and 1 Cold Coffee', comboItems: [{ id: '1', name: 'Popcorn Tub' }, { id: '3', name: 'Cold Coffee' }], averageRating: 4.6 }
  ],
  orders: [], feedbacks: [],
  offers: [ { id: 'offer-1', code: 'WELCOME10', description: '10% off your first order', discountType: 'percentage', discountValue: 10, isUsed: false, studentId: 'customer-1', usageCount: 1, redeemedCount: 0, isActive: true },],
  rewards: [ { id: 'reward-1', title: 'Free Small Popcorn', description: 'Get a small popcorn on us!', pointsCost: 100, discount: { type: 'fixed', value: 80 }, isActive: true }, { id: 'reward-2', title: '₹50 Off Coupon', description: 'Get a flat ₹50 off on your next order.', pointsCost: 200, discount: { type: 'fixed', value: 50 }, isActive: true } ],
  student_favorites: [ { student_id: 'customer-1', item_id: '3' } ],
  owner_bank_details: [], canteen_photos: [], payments: [],
};

// --- INITIALIZE MOCK DB in localStorage ---
(() => {
    Object.entries(seedData).forEach(([key, value]) => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    });
})();

// --- MOCK API FUNCTIONS ---

// --- FAVOURITES FUNCTIONS ---
export const getFavourites = (): string[] => {
    try {
        const favs = localStorage.getItem('favourites');
        return favs ? JSON.parse(favs) : [];
    } catch {
        return [];
    }
};

const saveFavourites = (favourites: string[]): void => {
    localStorage.setItem('favourites', JSON.stringify(favourites));
};

export const isFavourited = (itemId: string): boolean => {
    const favourites = getFavourites();
    return favourites.includes(itemId);
};

export const toggleFavourite = (itemId: string): boolean => {
    let favourites = getFavourites();
    const isFav = favourites.includes(itemId);
    if (isFav) {
        favourites = favourites.filter(id => id !== itemId);
    } else {
        favourites.push(itemId);
    }
    saveFavourites(favourites);
    // Return the new state
    return !isFav;
};

export const getFavouriteItems = async (): Promise<MenuItem[]> => {
    const menu = await getMenu();
    const favouriteIds = getFavourites();
    return menu.filter(item => favouriteIds.includes(item.id));
};

export const removeFromFavourites = (itemId: string): void => {
    let favourites = getFavourites();
    favourites = favourites.filter(id => id !== itemId);
    saveFavourites(favourites);
};


export const createPaymentRecord = async (paymentData: any) => {
    const payments = getFromStorage('payments');
    payments.push({ ...paymentData, id: crypto.randomUUID() });
    saveToStorage('payments', payments);
};

export const getOwnerStatus = async (): Promise<{ isOnline: boolean }> => ({ isOnline: true });

export const getMenu = async (): Promise<MenuItem[]> => {
    return getFromStorage<MenuItem>('menu');
};

// Fix: Update getMenuItemById to accept an optional studentId and fix argument mismatch error.
export const getMenuItemById = async (itemId: string, studentId?: string): Promise<MenuItem | undefined> => {
    const menu = await getMenu();
    let item = menu.find(item => item.id === itemId);

    if (item && studentId) {
        const favorites = getFromStorage<{ student_id: string, item_id: string }>('student_favorites');
        const isFavorited = favorites.some(f => f.student_id === studentId && f.item_id === itemId);
        item = { ...item, isFavorited };
    }

    return item;
};

export const placeOrder = async (orderData: { items: any[]; totalAmount: number; phone: string, seatNumber: string }): Promise<Order> => {
    const orders = getFromStorage<Order>('orders');
    const localHistory = getFromStorage<Order>('orderHistory');
    
    const newId = crypto.randomUUID();
    const newOrder: Order = {
        id: newId,
        studentName: 'Guest', // Set a default name
        customerPhone: orderData.phone,
        seatNumber: orderData.seatNumber,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status: OrderStatusEnum.PENDING,
        qrToken: newId, // Use the order ID as the QR token
        timestamp: new Date(),
        orderType: 'real',
    };
    
    // Save to owner's order list
    orders.push(newOrder);
    saveToStorage('orders', orders);
    
    // Save to customer's local history
    localHistory.push(newOrder);
    saveToStorage('orderHistory', localHistory);

    return newOrder;
};

export const verifyQrCodeAndCollectOrder = async (qrToken: string, staffId: string): Promise<Order> => {
    let orders = getFromStorage<Order>('orders');
    const orderIndex = orders.findIndex(o => o.qrToken === qrToken);
    if (orderIndex === -1) throw new Error('Invalid or expired QR code.');
    if (orders[orderIndex].status === OrderStatusEnum.COLLECTED) throw new Error('This order has already been collected.');
    if (orders[orderIndex].status === OrderStatusEnum.CANCELLED) throw new Error('This order was cancelled.');
    
    orders[orderIndex].status = OrderStatusEnum.COLLECTED;
    orders[orderIndex].collectedByStaffId = staffId;
    saveToStorage('orders', orders);

    // Also update the status in local history if it exists
    let localHistory = getFromStorage<Order>('orderHistory');
    const historyIndex = localHistory.findIndex(o => o.qrToken === qrToken);
    if (historyIndex > -1) {
        localHistory[historyIndex].status = OrderStatusEnum.COLLECTED;
        saveToStorage('orderHistory', localHistory);
    }
    
    return orders[orderIndex];
};

export const getOrderById = async (orderId: string): Promise<Order> => {
    // Check both main orders (for owner) and local history (for customer)
    const orders = getFromStorage<Order>('orders');
    let order = orders.find(o => o.id === orderId);
    if (!order) {
        const localHistory = getFromStorage<Order>('orderHistory');
        order = localHistory.find(o => o.id === orderId);
    }
    if (!order) throw new Error('Order not found');
    return { ...order, timestamp: new Date(order.timestamp) };
};

export const getLocalOrderHistory = async (): Promise<Order[]> => {
    const orders = getFromStorage<Order>('orderHistory');
    return orders.map(o => ({...o, timestamp: new Date(o.timestamp)})).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

// Fix: Add getStudentProfile function to fix missing export error.
export const getStudentProfile = async (studentId: string): Promise<StudentProfile> => {
    const users = getFromStorage<User>('users');
    const user = users.find(u => u.id === studentId);
    if (!user) throw new Error('User not found');

    // This is mocked data as orders are not linked to students in this simplified version.
    return {
        id: user.id,
        name: user.username,
        phone: user.phone || 'N/A',
        loyaltyPoints: user.loyaltyPoints || 0,
        totalOrders: 5,
        lifetimeSpend: 1250.50,
        favoriteItemsCount: 3,
        milestoneRewardsUnlocked: [200, 500, 1000]
    };
};

// Fix: Add getRewards function to fix missing export error.
export const getRewards = async (): Promise<Reward[]> => getFromStorage<Reward>('rewards');

// Fix: Add redeemReward function to fix missing export error.
export const redeemReward = async (studentId: string, rewardId: string): Promise<Offer> => {
    const users = getFromStorage<User>('users');
    const rewards = getFromStorage<Reward>('rewards');
    const offers = getFromStorage<Offer>('offers');

    const userIndex = users.findIndex(u => u.id === studentId);
    if (userIndex === -1) throw new Error("User not found");

    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) throw new Error("Reward not found");

    const user = users[userIndex];
    if ((user.loyaltyPoints || 0) < reward.pointsCost) {
        throw new Error("Not enough points to redeem this reward.");
    }

    user.loyaltyPoints = (user.loyaltyPoints || 0) - reward.pointsCost;
    users[userIndex] = user;
    saveToStorage('users', users);

    const newCoupon: Offer = {
        id: `REWARD-${crypto.randomUUID().slice(0, 8)}`,
        code: `${reward.title.replace(/\s+/g, '').toUpperCase().slice(0, 6)}${Math.floor(Math.random() * 1000)}`,
        description: `Redeemed: ${reward.title}`,
        discountType: reward.discount.type,
        discountValue: reward.discount.value,
        isUsed: false,
        studentId: studentId,
        isReward: true,
        usageCount: 1,
        redeemedCount: 0,
        isActive: true,
    };
    
    offers.push(newCoupon);
    saveToStorage('offers', offers);

    // Update the user in localStorage if they are the current logged-in user
    const loggedInUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (loggedInUser && loggedInUser.id === studentId) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    return newCoupon;
};


// --- ADMIN / OWNER FUNCTIONS (largely unchanged) ---
export const getAdminDashboardStats = async (): Promise<AdminStats> => {
    const users = getFromStorage<User>('users');
    const feedbacks = getFromStorage<Feedback>('feedbacks');
    return {
        totalUsers: users.length,
        totalCustomers: users.filter(u => u.role === RoleEnum.STUDENT).length,
        totalOwners: users.filter(u => u.role === RoleEnum.CANTEEN_OWNER).length,
        pendingApprovals: users.filter(u => u.role === RoleEnum.CANTEEN_OWNER && u.approvalStatus === 'pending').length,
        totalFeedbacks: feedbacks.length,
    };
};

export const updateAllMenuItemsAvailability = async (ownerId: string, isAvailable: boolean): Promise<void> => {
    const menu = getFromStorage<MenuItem>('menu').map(item => ({ ...item, isAvailable }));
    saveToStorage('menu', menu);
};

export const getPendingOwnerRequests = async (): Promise<User[]> => getFromStorage<User>('users').filter(u => u.role === RoleEnum.CANTEEN_OWNER && u.approvalStatus === 'pending');
export const getApprovedOwners = async (): Promise<User[]> => getFromStorage<User>('users').filter(u => u.role === RoleEnum.CANTEEN_OWNER && u.approvalStatus === 'approved');
export const getRejectedOwners = async (): Promise<User[]> => getFromStorage<User>('users').filter(u => u.role === RoleEnum.CANTEEN_OWNER && u.approvalStatus === 'rejected');

export const updateOwnerApprovalStatus = async (userId: string, status: 'approved' | 'rejected' | 'pending'): Promise<User> => {
    const users = getFromStorage<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    users[userIndex].approvalStatus = status;
    if (status === 'approved') users[userIndex].approvalDate = new Date().toISOString();
    saveToStorage('users', users);
    return users[userIndex];
};

export const removeOwnerAccount = async (userId: string): Promise<{ success: boolean }> => {
    const users = getFromStorage<User>('users').filter(u => u.id !== userId);
    saveToStorage('users', users);
    return { success: true };
};

export const getOwnerOrders = async (): Promise<Order[]> => getFromStorage<Order>('orders').map(o => ({...o, timestamp: new Date(o.timestamp)})).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
    const orders = getFromStorage<Order>('orders');
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    orders[orderIndex].status = status;
    saveToStorage('orders', orders);
    return orders[orderIndex];
};

export const updateMenuAvailability = async (itemId: string, isAvailable: boolean): Promise<MenuItem> => {
    const menu = getFromStorage<MenuItem>('menu');
    const itemIndex = menu.findIndex(i => i.id === itemId);
    if (itemIndex === -1) throw new Error("Item not found");
    menu[itemIndex].isAvailable = isAvailable;
    saveToStorage('menu', menu);
    return menu[itemIndex];
};

export const getTodaysDashboardStats = async (): Promise<TodaysDashboardStats> => ({ totalOrders: 0, totalIncome: 0, itemsSold: [] });
export const getTodaysDetailedReport = async (): Promise<TodaysDetailedReport> => ({ date: new Date().toISOString().split('T')[0], totalOrders: 0, totalIncome: 0, itemSales: [] });
export const getSalesSummary = async (): Promise<SalesSummary> => ({ daily: [], weekly: [] });
export const getUsers = async (): Promise<User[]> => getFromStorage<User>('users');
export const getFeedbacks = async (): Promise<Feedback[]> => getFromStorage<Feedback>('feedbacks').map(f => ({...f, timestamp: new Date(f.timestamp)})).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

export const getFoodPopularityStats = async (): Promise<MenuItem[]> => {
    const menu = getFromStorage<MenuItem>('menu');
    return menu.map(item => ({
        ...item,
        averageRating: item.averageRating || Math.random() * 2 + 3,
        favoriteCount: Math.floor(Math.random() * 50)
    }));
};

export const getMostSellingItems = async (): Promise<{ name: string; count: number }[]> => ([]);
export const getOrderStatusSummary = async (): Promise<{ name: string; value: number }[]> => ([]);
export const getStudentPointsList = async (): Promise<StudentPoints[]> => getFromStorage<User>('users').filter(u => u.role === RoleEnum.STUDENT).map(u => ({ studentId: u.id, studentName: u.username, points: u.loyaltyPoints || 0 }));

export const getScanTerminalStaff = async (): Promise<User[]> => getFromStorage<User>('users').filter(u => u.role === RoleEnum.CANTEEN_OWNER && !u.canteenName);

export const deleteScanTerminalStaff = async (userId: string): Promise<void> => {
    const users = getFromStorage<User>('users').filter(u => u.id !== userId);
    saveToStorage('users', users);
};

export const getAllOffersForOwner = async (): Promise<Offer[]> => getFromStorage<Offer>('offers').filter(o => !o.isReward);
export const createOffer = async (offerData: Partial<Offer>): Promise<void> => {
    const offers = getFromStorage<Offer>('offers');
    offers.push({ ...offerData, id: crypto.randomUUID(), isUsed: false, redeemedCount: 0 } as Offer);
    saveToStorage('offers', offers);
};
export const updateOffer = async (offerId: string, updatedData: Partial<Omit<Offer, 'id'>>): Promise<void> => {
    const offers = getFromStorage<Offer>('offers');
    const index = offers.findIndex(o => o.id === offerId);
    if (index !== -1) {
        offers[index] = { ...offers[index], ...updatedData };
        saveToStorage('offers', offers);
    }
};
export const deleteOffer = async (offerId: string): Promise<void> => {
    const offers = getFromStorage<Offer>('offers').filter(o => o.id !== offerId);
    saveToStorage('offers', offers);
};

export const getAllRewardsForOwner = async (): Promise<Reward[]> => getFromStorage<Reward>('rewards');
export const createReward = async (rewardData: Omit<Reward, 'id'>): Promise<Reward> => {
    const rewards = getFromStorage<Reward>('rewards');
    const newReward = { ...rewardData, id: crypto.randomUUID() };
    rewards.push(newReward);
    saveToStorage('rewards', rewards);
    return newReward;
};
export const updateReward = async (rewardId: string, updatedData: Partial<Omit<Reward, 'id'>>): Promise<Reward> => {
    const rewards = getFromStorage<Reward>('rewards');
    const index = rewards.findIndex(r => r.id === rewardId);
    if(index === -1) throw new Error("Reward not found");
    rewards[index] = { ...rewards[index], ...updatedData };
    saveToStorage('rewards', rewards);
    return rewards[index];
};
export const deleteReward = async (rewardId: string): Promise<void> => {
    const rewards = getFromStorage<Reward>('rewards').filter(r => r.id !== rewardId);
    saveToStorage('rewards', rewards);
};

// Dummy functions for unimplemented features
export const getOwnerBankDetails = async (ownerId: string): Promise<OwnerBankDetails> => ({ accountNumber: '', bankName: '', ifscCode: '', upiId: '', email: '', phone: '' });
export const requestSaveBankDetailsOtp = async (details: OwnerBankDetails): Promise<{ message: string }> => ({ message: "OTP sent (mock)" });
export const verifyOtpAndSaveBankDetails = async (details: OwnerBankDetails, otp: string, ownerId: string): Promise<OwnerBankDetails> => (details);
export const addMenuItem = async (itemData: Partial<MenuItem> & { price: number }, ownerId: string): Promise<MenuItem> => {
    const menu = getFromStorage<MenuItem>('menu');
    const newItem = { ...itemData, id: crypto.randomUUID() } as MenuItem;
    menu.push(newItem);
    saveToStorage('menu', menu);
    return newItem;
};
export const updateMenuItem = async (itemId: string, itemData: Partial<MenuItem>): Promise<MenuItem> => {
    const menu = getFromStorage<MenuItem>('menu');
    const index = menu.findIndex(i => i.id === itemId);
    if(index === -1) throw new Error("Item not found");
    menu[index] = { ...menu[index], ...itemData };
    saveToStorage('menu', menu);
    return menu[index];
};
export const removeMenuItem = async (itemId: string): Promise<void> => {
    const menu = getFromStorage<MenuItem>('menu').filter(i => i.id !== itemId);
    saveToStorage('menu', menu);
};
export const getCanteenPhotos = async (): Promise<CanteenPhoto[]> => getFromStorage<CanteenPhoto>('canteen_photos');
export const addCanteenPhoto = async (file: File): Promise<CanteenPhoto> => {throw new Error("Not implemented in mock API")};
export const deleteCanteenPhoto = async (photoId: string): Promise<void> => {};
export const updateCanteenPhoto = async (photoId: string, file: File): Promise<CanteenPhoto> => {throw new Error("Not implemented in mock API")};

// DEPRECATED/REMOVED CUSTOMER FUNCTIONS
export const submitFeedback = async (feedbackData: { studentId: string; studentName: string; itemId: string; rating: number; comment?: string; }): Promise<Feedback> => {
    const feedbacks = getFromStorage<Feedback>('feedbacks');
    const menu = getFromStorage<MenuItem>('menu');

    const item = menu.find(i => i.id === feedbackData.itemId);
    if (!item) throw new Error("Item not found");
    
    const newFeedback: Feedback = {
        id: crypto.randomUUID(),
        studentId: feedbackData.studentId, // can be a guestId
        studentName: feedbackData.studentName,
        itemId: feedbackData.itemId,
        itemName: item.name,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        timestamp: new Date(),
    };

    feedbacks.push(newFeedback);
    saveToStorage('feedbacks', feedbacks);
    return newFeedback;
};
export const getOffers = async (studentId: string): Promise<Offer[]> => {
    return [];
};
export const getAllStudentCoupons = async (studentId: string): Promise<Offer[]> => {
    return [];
};