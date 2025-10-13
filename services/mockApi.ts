
// This file now contains functions to interact with the Supabase backend.

import { supabase } from './supabase';
// FIX: Import renamed types
import type { User, MenuItem, Order, OrderStatus, SalesSummary, Feedback, Offer, CartItem, StudentProfile, Reward, StudentPoints, TodaysDashboardStats, TodaysDetailedReport, AdminStats, OwnerBankDetails, CanteenPhoto } from '../types';
import { Role as RoleEnum, OrderStatus as OrderStatusEnum } from '../types';

// NOTE: All auth-related functions (login, register, etc.) are now in context/AuthContext.tsx

// --- DATA MAPPERS (snake_case from DB to camelCase in App) ---

export const mapDbOrderToAppOrder = (dbOrder: any): Order => ({
    id: dbOrder.id,
    // FIX: Map to studentId and studentName
    studentId: dbOrder.student_id,
    studentName: dbOrder.users?.username || dbOrder.student_name || 'N/A',
    customerPhone: dbOrder.student_phone,
    items: dbOrder.items,
    totalAmount: dbOrder.total_amount,
    status: dbOrder.status,
    qrToken: dbOrder.qr_token,
    timestamp: new Date(dbOrder.timestamp),
    orderType: dbOrder.order_type,
    couponCode: dbOrder.coupon_code,
    discountAmount: dbOrder.discount_amount,
    refundAmount: dbOrder.refund_amount,
});

const mapDbUserToAppUser = (dbUser: any): User => ({
    id: dbUser.id,
    username: dbUser.username,
    role: dbUser.role,
    phone: dbUser.phone,
    email: dbUser.email,
    profileImageUrl: dbUser.profile_image_url,
    approvalStatus: dbUser.approval_status,
    approvalDate: dbUser.approval_date,
    isFirstLogin: dbUser.is_first_login,
    canteenName: dbUser.canteen_name,
    idProofUrl: dbUser.id_proof_url,
    loyaltyPoints: dbUser.loyalty_points,
});

const mapDbMenuToAppMenu = (dbMenu: any): MenuItem => ({
    id: dbMenu.id,
    name: dbMenu.name,
    price: dbMenu.price,
    isAvailable: dbMenu.is_available,
    imageUrl: dbMenu.image_url,
    description: dbMenu.description,
    emoji: dbMenu.emoji,
    averageRating: dbMenu.average_rating,
    favoriteCount: dbMenu.favorite_count,
    isCombo: dbMenu.is_combo,
    comboItems: dbMenu.combo_items,
});

const mapDbFeedbackToAppFeedback = (dbFeedback: any): Feedback => ({
    id: dbFeedback.id,
    // FIX: Map to studentId and studentName
    studentId: dbFeedback.student_id,
    studentName: dbFeedback.student_name,
    itemId: dbFeedback.item_id,
    itemName: dbFeedback.item_name,
    rating: dbFeedback.rating,
    comment: dbFeedback.comment,
    timestamp: new Date(dbFeedback.timestamp),
});

const mapDbOfferToAppOffer = (dbOffer: any): Offer => ({
    id: dbOffer.id,
    code: dbOffer.code,
    description: dbOffer.description,
    discountType: dbOffer.discount_type,
    discountValue: dbOffer.discount_value,
    isUsed: dbOffer.is_used,
    // FIX: Map to studentId
    studentId: dbOffer.student_id,
    isReward: dbOffer.is_reward,
    isActive: dbOffer.is_active,
});

const mapDbRewardToAppReward = (dbReward: any): Reward => ({
    id: dbReward.id,
    title: dbReward.title,
    description: dbReward.description,
    pointsCost: dbReward.points_cost,
    discount: dbReward.discount,
    isActive: dbReward.is_active,
    expiryDate: dbReward.expiry_date,
});


// --- DATA FETCHING & MUTATION FUNCTIONS ---
export const createPaymentRecord = async (paymentData: { order_id: string; student_id: string; amount: number; method: string; status: 'successful' | 'failed'; transaction_id?: string; }) => {
    const { error } = await supabase.from('payments').insert(paymentData);
    if (error) throw error;
};

export const getOwnerStatus = async (): Promise<{ isOnline: boolean }> => {
    // In a real app, this would query a specific table for the canteen's status
    return { isOnline: true };
}

// FIX: Rename customerId to studentId
export const getMenu = async (studentId?: string): Promise<MenuItem[]> => {
    const { data: menuData, error: menuError } = await supabase.from('menu').select('*');
    if (menuError) throw menuError;

    const mappedMenu = menuData.map(mapDbMenuToAppMenu);

    if (!studentId) return mappedMenu;
    
    const { data: favoritesData, error: favoritesError } = await supabase
        .from('student_favorites')
        .select('item_id')
        .eq('student_id', studentId);

    if (favoritesError) {
        console.error("Error fetching favorites:", favoritesError);
        return mappedMenu;
    }

    const favoriteIds = new Set(favoritesData.map(f => f.item_id));
    
    return mappedMenu.map(item => ({
        ...item,
        isFavorited: favoriteIds.has(item.id)
    }));
};

// FIX: Rename customerId to studentId
export const getMenuItemById = async (itemId: string, studentId?: string): Promise<MenuItem | undefined> => {
    const { data, error } = await supabase.from('menu').select('*').eq('id', itemId).single();
    if (error) throw error;
    if (!data) return undefined;

    const item: MenuItem = mapDbMenuToAppMenu(data);
    
    if (studentId) {
        const { data: favorite, error: favError } = await supabase
            .from('student_favorites')
            .select('*')
            .eq('student_id', studentId)
            .eq('item_id', itemId)
            .maybeSingle();
        
        if (favError) console.error(favError);
        item.isFavorited = !!favorite;
    }
    
    return item;
};

// FIX: Rename customerId to studentId
export const toggleFavoriteItem = async (studentId: string, itemId: string): Promise<void> => {
    const { data: existing, error } = await supabase
        .from('student_favorites')
        .select('*')
        .eq('student_id', studentId)
        .eq('item_id', itemId)
        .maybeSingle();

    if (error) throw error;

    if (existing) {
        const { error: deleteError } = await supabase.from('student_favorites').delete().match({ student_id: studentId, item_id: itemId });
        if (deleteError) throw deleteError;
    } else {
        const { error: insertError } = await supabase.from('student_favorites').insert({ student_id: studentId, item_id: itemId });
        if (insertError) throw insertError;
    }
};

// FIX: Rename parameters to studentId/studentName
export const placeOrder = async (orderData: { studentId: string; studentName: string; items: any[]; totalAmount: number; couponCode?: string, discountAmount?: number }): Promise<Order> => {
    const qrToken = JSON.stringify({ orderId: `temp-id-${Date.now()}`}); // Temp token
    const { data, error } = await supabase.from('orders').insert([
        { 
            student_id: orderData.studentId,
            student_name: orderData.studentName,
            items: orderData.items, 
            total_amount: orderData.totalAmount,
            coupon_code: orderData.couponCode,
            discount_amount: orderData.discountAmount,
            status: OrderStatusEnum.PENDING,
            order_type: 'real',
            qr_token: qrToken,
        }
    ]).select().single();

    if (error) throw error;
    
    // Update QR token with real order ID
    const finalQrToken = JSON.stringify({ orderId: data.id });
    const { data: updatedData, error: updateError } = await supabase.from('orders').update({ qr_token: finalQrToken }).eq('id', data.id).select('*').single();

    if (updateError) throw updateError;
    
    return mapDbOrderToAppOrder(updatedData);
};

// FIX: Rename to cancelStudentOrder and use studentId
export const cancelStudentOrder = async (orderId: string, studentId: string): Promise<Order> => {
    const { data: order, error: fetchError } = await supabase.from('orders').select('total_amount').eq('id', orderId).single();
    if (fetchError || !order) throw new Error("Order not found");

    const refundAmount = order.total_amount * 0.5;

    const { data, error } = await supabase
        .from('orders')
        .update({ status: OrderStatusEnum.CANCELLED, refund_amount: refundAmount })
        .eq('id', orderId)
        .eq('student_id', studentId)
        .eq('status', OrderStatusEnum.PENDING)
        .select()
        .single();
    
    if (error || !data) throw new Error("Order cannot be cancelled. It might be already in preparation.");
    return mapDbOrderToAppOrder(data);
};

export const verifyQrCodeAndCollectOrder = async (qrToken: string): Promise<Order> => {
    let tokenData;
    try {
        tokenData = JSON.parse(qrToken);
    } catch (e) {
        throw new Error('Invalid QR Code format.');
    }
    const { orderId } = tokenData;

    const { data: order, error: fetchError } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if(fetchError || !order) throw new Error('Order not found.');
    if (order.status === OrderStatusEnum.COLLECTED) throw new Error('Order has already been collected.');
    if (order.status !== OrderStatusEnum.PREPARED) throw new Error('Order is not yet ready for pickup.');
    
    const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ status: OrderStatusEnum.COLLECTED })
        .eq('id', orderId)
        .select('*')
        .single();
    
    if (updateError) throw updateError;
    return mapDbOrderToAppOrder(updatedOrder);
};

export const getOrderById = async(orderId: string): Promise<Order> => {
    const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (error) throw error;
    return mapDbOrderToAppOrder(data);
}

// FIX: Rename to getStudentOrders and use studentId
export const getStudentOrders = async (studentId: string): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*').eq('student_id', studentId).order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(mapDbOrderToAppOrder);
};

// FIX: Use studentId in parameter
export const submitFeedback = async (feedbackData: { studentId: string; itemId: string; rating: number; comment?: string; }): Promise<Feedback> => {
    const { data: itemData } = await supabase.from('menu').select('name').eq('id', feedbackData.itemId).single();
    const { data: customerData } = await supabase.from('users').select('username').eq('id', feedbackData.studentId).single();

    const { data, error } = await supabase.from('feedbacks').insert([
        {
            student_id: feedbackData.studentId,
            item_id: feedbackData.itemId,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            item_name: itemData?.name || 'Unknown Item',
            student_name: customerData?.username || 'Anonymous',
        }
    ]).select().single();

    if (error) throw error;
    return mapDbFeedbackToAppFeedback(data);
};

// ... Demo functions ...
export const getDemoMenu = async (): Promise<MenuItem[]> => {
    return [
        { id: 'demo-1', name: 'Demo Chicken Rice', price: 70, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1626385342111-a1bbb73706c8?q=80&w=800&auto=format&fit=crop', emoji: '🍗', description: 'This is a sample item to demonstrate the ordering process. It has no real value.' },
        { id: 'demo-2', name: 'Demo Juice', price: 30, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=800&auto=format&fit=crop', emoji: '🧃', description: 'A refreshing demo juice to complete your sample order.' }
    ];
};

// FIX: Use studentId and studentName
export const placeDemoOrder = async (orderData: { studentId: string; studentName: string; items: any[]; totalAmount: number; }): Promise<Order> => {
    const orderId = `demo-order-${Date.now()}`;
    const qrToken = JSON.stringify({ orderId, isDemo: true });
    return {
        id: orderId,
        studentId: orderData.studentId,
        studentName: orderData.studentName,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status: OrderStatusEnum.COLLECTED,
        qrToken: qrToken,
        timestamp: new Date(),
        orderType: 'demo',
    };
};

// --- ADMIN / OWNER FUNCTIONS ---

export const updateAllMenuItemsAvailability = async (ownerId: string, isAvailable: boolean): Promise<void> => {
    // The ownerId is unused as the schema does not link menu items to specific owners.
    // This query updates all menu items, assuming a single-canteen system.
    // A filter is required by Supabase, so we use one that matches all items.
    const { error } = await supabase
        .from('menu')
        .update({ is_available: isAvailable })
        .gte('price', 0);

    if (error) {
        console.error("Failed to update menu availability:", error);
        throw error;
    }
};

export const getPendingOwnerRequests = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').eq('role', RoleEnum.CANTEEN_OWNER).eq('approval_status', 'pending');
    if (error) throw error;
    return data.map(mapDbUserToAppUser);
};

export const getApprovedOwners = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').eq('role', RoleEnum.CANTEEN_OWNER).eq('approval_status', 'approved');
    if (error) throw error;
    if (!data) return [];
    return data.map(mapDbUserToAppUser);
};

export const getRejectedOwners = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*').eq('role', RoleEnum.CANTEEN_OWNER).eq('approval_status', 'rejected');
    if (error) throw error;
    return data.map(mapDbUserToAppUser);
};

export const updateOwnerApprovalStatus = async (userId: string, status: 'approved' | 'rejected'): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .update({ approval_status: status, approval_date: status === 'approved' ? new Date().toISOString() : null })
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return mapDbUserToAppUser(data);
};

export const removeOwnerAccount = async (userId: string): Promise<{ success: boolean }> => {
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
    return { success: true };
};

export const getOwnerOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*, users(username, phone)').order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(mapDbOrderToAppOrder);
};

export const getOwnerDemoOrders = async (): Promise<Order[]> => {
    // This can be used to simulate demo orders for owners to see.
    return [
        { id: 'demo-owner-1', studentId: 'demo-customer', studentName: 'Rohan Sharma', customerPhone: '9876543210', items: [{id: 'd1', name: 'Demo Biryani', quantity: 1, price: 100, imageUrl: ''}], totalAmount: 100, status: OrderStatusEnum.COLLECTED, qrToken: '{"isDemo":true}', timestamp: new Date(), orderType: 'demo' },
        { id: 'demo-owner-2', studentId: 'demo-customer-2', studentName: 'Priya Mehta', customerPhone: '9876543211', items: [{id: 'd2', name: 'Demo Noodles', quantity: 2, price: 60, imageUrl: ''}], totalAmount: 120, status: OrderStatusEnum.COLLECTED, qrToken: '{"isDemo":true}', timestamp: new Date(Date.now() - 3600000), orderType: 'demo' },
    ];
};


export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId).select('*').single();
    if (error) throw error;
    return mapDbOrderToAppOrder(data);
};

export const updateMenuAvailability = async (itemId: string, isAvailable: boolean): Promise<MenuItem> => {
    const { data, error } = await supabase.from('menu').update({ is_available: isAvailable }).eq('id', itemId).select().single();
    if (error) throw error;
    return mapDbMenuToAppMenu(data);
};

const getStartOfToday = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
}

export const getTodaysDashboardStats = async (): Promise<TodaysDashboardStats> => {
    const { data, error } = await supabase.from('orders').select('total_amount, items').gte('timestamp', getStartOfToday());
    if (error) throw error;

    const totalOrders = data.length;
    const totalIncome = data.reduce((sum, order) => sum + order.total_amount, 0);
    
    const itemCounts = new Map<string, number>();
    data.forEach(order => {
        order.items.forEach((item: any) => {
            itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity);
        });
    });
    
    const itemsSold = Array.from(itemCounts.entries()).map(([name, quantity]) => ({ name, quantity })).sort((a,b) => b.quantity - a.quantity);

    return { totalOrders, totalIncome, itemsSold };
};

export const getTodaysDetailedReport = async (): Promise<TodaysDetailedReport> => {
    const { data, error } = await supabase.from('orders').select('total_amount, items').gte('timestamp', getStartOfToday());
    if (error) throw error;
    
    const itemSalesMap = new Map<string, { quantity: number; totalPrice: number }>();
    data.forEach(order => {
        order.items.forEach((item: any) => {
            const existing = itemSalesMap.get(item.name) || { quantity: 0, totalPrice: 0 };
            existing.quantity += item.quantity;
            existing.totalPrice += item.quantity * item.price;
            itemSalesMap.set(item.name, existing);
        });
    });

    return {
        date: new Date().toISOString().split('T')[0],
        totalOrders: data.length,
        totalIncome: data.reduce((sum, order) => sum + order.total_amount, 0),
        itemSales: Array.from(itemSalesMap.entries()).map(([name, sales]) => ({ name, ...sales })),
    };
};

export const getSalesSummary = async (): Promise<SalesSummary> => {
     const { data, error } = await supabase.from('orders').select('timestamp, total_amount');
    if (error) throw error;
    // This is a simplified client-side aggregation. For production, use DB functions (RPC).
    const weeklySales = new Map<string, number>();
    data.forEach(order => {
        const date = new Date(order.timestamp);
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay())).toISOString().split('T')[0];
        weeklySales.set(weekStart, (weeklySales.get(weekStart) || 0) + order.total_amount);
    });

    const weekly = Array.from(weeklySales.entries()).map(([week, total]) => ({ week, total })).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime()).slice(-4);
    
    return { daily: [], weekly };
};

export const getUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data.map(mapDbUserToAppUser);
};
export const getFeedbacks = async (): Promise<Feedback[]> => {
    const { data, error } = await supabase.from('feedbacks').select('*').order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(mapDbFeedbackToAppFeedback);
};
export const getFoodPopularityStats = async (): Promise<MenuItem[]> => getMenu();

export const getMostSellingItems = async (): Promise<{ name: string; count: number }[]> => {
    const { data, error } = await supabase.from('orders').select('items');
    if (error) throw error;
    const itemCounts = new Map<string, number>();
    data.forEach(order => {
        order.items.forEach((item: any) => {
            itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity);
        });
    });
    return Array.from(itemCounts.entries()).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 10);
};

export const getOrderStatusSummary = async (): Promise<{ name: string; value: number }[]> => {
    const { data, error } = await supabase.from('orders').select('status');
    if (error) throw error;
    const statusCounts = new Map<string, number>();
    data.forEach(order => {
        statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
    });
    return Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value }));
};

// FIX: Rename to getStudentPointsList and map to StudentPoints type
export const getStudentPointsList = async (): Promise<StudentPoints[]> => {
    const { data, error } = await supabase.from('users').select('id, username, loyalty_points').eq('role', 'CUSTOMER').order('loyalty_points', { ascending: false }).limit(20);
    if (error) throw error;
    return data.map(u => ({ studentId: u.id, studentName: u.username, points: u.loyalty_points }));
};

export const getAllOffersForOwner = async (): Promise<Offer[]> => {
    const { data, error } = await supabase.from('offers').select('*').eq('is_reward', false);
    if (error) throw error;
    return data.map(mapDbOfferToAppOffer);
};
export const createOffer = async (offerData: Partial<Offer>): Promise<void> => {
    const dbPayload = {
        code: offerData.code,
        description: offerData.description,
        discount_type: offerData.discountType,
        discount_value: offerData.discountValue,
        is_active: offerData.isActive,
    };
    const { error } = await supabase.from('offers').insert(dbPayload);
    if (error) throw error;
};
export const updateOfferStatus = async (offerId: string, isActive: boolean): Promise<void> => {
    const { error } = await supabase.from('offers').update({ is_active: isActive }).eq('id', offerId);
    if (error) throw error;
};

// FIX: Rename param to studentId
export const getOffers = async (studentId: string): Promise<Offer[]> => {
    const { data, error } = await supabase.from('offers').select('*').eq('student_id', studentId);
    if (error) throw error;
    return data.map(mapDbOfferToAppOffer);
};

// FIX: Rename to getAllStudentCoupons and use studentId
export const getAllStudentCoupons = async (studentId: string): Promise<Offer[]> => {
    const { data, error } = await supabase.from('offers').select('*').eq('student_id', studentId);
    if (error) throw error;
    return data.map(mapDbOfferToAppOffer);
};

// FIX: Rename to getStudentProfile, use studentId, and return StudentProfile
export const getStudentProfile = async (studentId: string): Promise<StudentProfile> => {
    const { data: userData, error: userError } = await supabase.from('users').select('username, phone, loyalty_points').eq('id', studentId).single();
    if (userError) throw userError;

    const { data: orders, error: ordersError } = await supabase.from('orders').select('total_amount').eq('student_id', studentId).not('status', 'eq', 'cancelled');
    if (ordersError) throw ordersError;

    const { count: favoritesCount, error: favoritesError } = await supabase.from('student_favorites').select('*', { count: 'exact', head: true }).eq('student_id', studentId);
    if (favoritesError) throw favoritesError;

    const totalOrders = orders.length;
    const lifetimeSpend = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

    const MILESTONES = [200, 500, 1000];
    const milestoneRewardsUnlocked = MILESTONES.filter(m => lifetimeSpend >= m);

    return {
        id: studentId,
        name: userData.username,
        phone: userData.phone,
        loyaltyPoints: userData.loyalty_points,
        totalOrders,
        lifetimeSpend,
        favoriteItemsCount: favoritesCount ?? 0,
        milestoneRewardsUnlocked,
    };
};

export const getRewards = async (): Promise<Reward[]> => {
    const { data, error } = await supabase.from('rewards').select('*').eq('is_active', true);
    if (error) throw error;
    return data.map(mapDbRewardToAppReward);
};
export const getAllRewardsForOwner = async (): Promise<Reward[]> => {
    const { data, error } = await supabase.from('rewards').select('*');
    if (error) throw error;
    return data.map(mapDbRewardToAppReward);
};
export const createReward = async (rewardData: Omit<Reward, 'id'>): Promise<Reward> => {
    const { data, error } = await supabase.from('rewards').insert({
        title: rewardData.title,
        description: rewardData.description,
        points_cost: rewardData.pointsCost,
        discount: rewardData.discount,
        is_active: rewardData.isActive,
        expiry_date: rewardData.expiryDate,
    }).select().single();
    if (error) throw error;
    return mapDbRewardToAppReward(data);
};
export const updateReward = async (rewardId: string, updatedData: Partial<Omit<Reward, 'id'>>): Promise<Reward> => {
    const dbPayload: Record<string, any> = {};
    if (updatedData.title !== undefined) dbPayload.title = updatedData.title;
    if (updatedData.description !== undefined) dbPayload.description = updatedData.description;
    if (updatedData.pointsCost !== undefined) dbPayload.points_cost = updatedData.pointsCost;
    if (updatedData.discount !== undefined) dbPayload.discount = updatedData.discount;
    if (updatedData.isActive !== undefined) dbPayload.is_active = updatedData.isActive;
    if (updatedData.expiryDate !== undefined) dbPayload.expiry_date = updatedData.expiryDate;

    const { data, error } = await supabase.from('rewards').update(dbPayload).eq('id', rewardId).select().single();
    if (error) throw error;
    return mapDbRewardToAppReward(data);
};
export const deleteReward = async (rewardId: string): Promise<void> => {
    const { error } = await supabase.from('rewards').delete().eq('id', rewardId);
    if (error) throw error;
};

// FIX: Rename param to studentId
export const redeemReward = async (studentId: string, rewardId: string): Promise<Offer> => {
    const { data: reward, error: rewardError } = await supabase.from('rewards').select('*').eq('id', rewardId).single();
    if (rewardError || !reward) throw new Error('Reward not found.');

    const { data: user, error: userError } = await supabase.from('users').select('loyalty_points').eq('id', studentId).single();
    if (userError || !user) throw new Error('User not found.');
    
    if (user.loyalty_points < reward.points_cost) throw new Error('Not enough points to redeem this reward.');

    const newPoints = user.loyalty_points - reward.points_cost;
    const { error: updatePointsError } = await supabase.from('users').update({ loyalty_points: newPoints }).eq('id', studentId);
    if (updatePointsError) throw new Error('Failed to update points. Please try again.');

    const newCouponCode = `${reward.title.substring(0, 4).toUpperCase()}${Date.now().toString().slice(-5)}`;
    const { data: newOffer, error: offerError } = await supabase.from('offers').insert({
        code: newCouponCode,
        description: `Redeemed: ${reward.title}`,
        discount_type: reward.discount.type,
        discount_value: reward.discount.value,
        is_used: false,
        student_id: studentId,
        is_reward: true,
        is_active: true,
    }).select().single();

    if (offerError) {
        await supabase.from('users').update({ loyalty_points: user.loyalty_points }).eq('id', studentId);
        throw new Error('Failed to create coupon. Your points have not been deducted.');
    }
    
    return mapDbOfferToAppOffer(newOffer);
};

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}


export const addMenuItem = async (itemData: any, ownerId: string): Promise<MenuItem> => {
    const dbPayload = {
        name: itemData.name,
        price: itemData.price,
        image_url: itemData.imageUrl,
        is_available: itemData.isAvailable,
        emoji: itemData.emoji,
        description: itemData.description,
        is_combo: itemData.isCombo,
        combo_items: itemData.comboItems,
    };
    const { data, error } = await supabase.from('menu').insert(dbPayload).select().single();
    if (error) throw error;
    return mapDbMenuToAppMenu(data);
};
export const updateMenuItem = async (itemId: string, itemData: any): Promise<MenuItem> => {
    const dbPayload: Record<string, any> = {};
    if (itemData.name !== undefined) dbPayload.name = itemData.name;
    if (itemData.price !== undefined) dbPayload.price = itemData.price;
    if (itemData.imageUrl !== undefined) dbPayload.image_url = itemData.imageUrl;
    if (itemData.isAvailable !== undefined) dbPayload.is_available = itemData.isAvailable;
    if (itemData.emoji !== undefined) dbPayload.emoji = itemData.emoji;
    if (itemData.description !== undefined) dbPayload.description = itemData.description;
    if (itemData.isCombo !== undefined) dbPayload.is_combo = itemData.isCombo;
    if (itemData.comboItems !== undefined) dbPayload.combo_items = itemData.comboItems;

    const { data, error } = await supabase.from('menu').update(dbPayload).eq('id', itemId).select().single();
    if (error) throw error;
    return mapDbMenuToAppMenu(data);
};
export const removeMenuItem = async (itemId: string): Promise<void> => {
    const { error } = await supabase.from('menu').delete().eq('id', itemId);
    if (error) throw error;
};
// FIX: Rename param to studentId
export const getStudentPastRewardCoupons = async (studentId: string): Promise<(Offer & { awardedDate: Date; })[]> => ([]);

// FIX: Add mock implementations for Bank Details and Canteen Gallery pages to resolve build errors.
// --- Bank Details Mocks ---
let ownerBankDetails: OwnerBankDetails = {
    accountNumber: '123456789012',
    bankName: 'Mock Bank',
    ifscCode: 'MOCK0001234',
    upiId: 'mock.owner@upi',
    email: 'owner@example.com',
    phone: '9988776655',
};

export const getOwnerBankDetails = async (ownerId: string): Promise<OwnerBankDetails> => {
    console.log(`Fetching bank details for owner ${ownerId}`);
    return Promise.resolve(ownerBankDetails);
};

export const requestSaveBankDetailsOtp = async (details: OwnerBankDetails): Promise<void> => {
    console.log('OTP requested for saving bank details:', details);
    // Mock OTP is '123456'
    return Promise.resolve();
};

export const verifyOtpAndSaveBankDetails = async (details: OwnerBankDetails, otp: string, ownerId: string): Promise<OwnerBankDetails> => {
    console.log(`Verifying OTP ${otp} for owner ${ownerId}`);
    if (otp !== '123456') {
        throw new Error('Invalid OTP. Please try again.');
    }
    ownerBankDetails = { ...details };
    return Promise.resolve(ownerBankDetails);
};

// --- Canteen Gallery Mocks ---
let canteenPhotos: CanteenPhoto[] = [
    { id: 'photo1', data: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop', uploadedAt: new Date() },
    { id: 'photo2', data: 'https://images.unsplash.com/photo-1592861956120-e524fc739696?q=80&w=800&auto=format&fit=crop', uploadedAt: new Date() },
];

export const getCanteenPhotos = async (): Promise<CanteenPhoto[]> => {
    return Promise.resolve([...canteenPhotos]);
};

export const addCanteenPhoto = async (file: File): Promise<CanteenPhoto> => {
    const dataUrl = await fileToBase64(file);
    const newPhoto: CanteenPhoto = {
        id: `photo${Date.now()}`,
        data: dataUrl,
        uploadedAt: new Date(),
    };
    canteenPhotos.unshift(newPhoto);
    return Promise.resolve(newPhoto);
};

export const deleteCanteenPhoto = async (photoId: string): Promise<void> => {
    canteenPhotos = canteenPhotos.filter(p => p.id !== photoId);
    return Promise.resolve();
};

export const updateCanteenPhoto = async (photoId: string, file: File): Promise<CanteenPhoto> => {
    const dataUrl = await fileToBase64(file);
    const photoIndex = canteenPhotos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) throw new Error("Photo not found");
    canteenPhotos[photoIndex].data = dataUrl;
    return Promise.resolve(canteenPhotos[photoIndex]);
};

// FIX: Rename param to studentId
export const applyCoupon = async (code: string, subtotal: number, studentId: string): Promise<number> => (0);

export const getAdminDashboardStats = async (): Promise<AdminStats> => {
    const { count: totalUsers, error: e1 } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalCustomers, error: e2 } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'CUSTOMER');
    const { count: totalOwners, error: e3 } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'CANTEEN_OWNER');
    const { count: pendingApprovals, error: e4 } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending');
    const { count: totalFeedbacks, error: e5 } = await supabase.from('feedbacks').select('*', { count: 'exact', head: true });

    if (e1 || e2 || e3 || e4 || e5) {
        console.error(e1, e2, e3, e4, e5);
        throw new Error("Failed to fetch admin stats.");
    }
    
    return {
        totalUsers: totalUsers || 0,
        totalCustomers: totalCustomers || 0,
        totalOwners: totalOwners || 0,
        pendingApprovals: pendingApprovals || 0,
        totalFeedbacks: totalFeedbacks || 0,
    }
}