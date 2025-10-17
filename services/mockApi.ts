// This file now contains functions to interact with the Supabase backend.

import { supabase } from './supabase';
import type { User, MenuItem, Order, OrderStatus, SalesSummary, Feedback, Offer, CartItem, StudentProfile, Reward, StudentPoints, TodaysDashboardStats, TodaysDetailedReport, AdminStats, OwnerBankDetails, CanteenPhoto } from '../types';
import { Role as RoleEnum, OrderStatus as OrderStatusEnum } from '../types';

// NOTE: All auth-related functions (login, register, etc.) are now in context/AuthContext.tsx

// --- DATA MAPPERS (snake_case from DB to camelCase in App) ---

export const mapDbOrderToAppOrder = (dbOrder: any): Order => {
    const studentNameFromDb = dbOrder.student_name || dbOrder.users?.username || 'N/A';
    const seatNumberMatch = studentNameFromDb.match(/\(Seat: (.*?)\)/);
    const seatNumber = seatNumberMatch ? seatNumberMatch[1] : undefined;
    const studentName = studentNameFromDb.split(' (Seat:')[0];

    return {
        id: dbOrder.id,
        orderNumber: dbOrder.order_number,
        studentId: dbOrder.student_id,
        studentName: studentName,
        customerPhone: dbOrder.users?.phone || dbOrder.student_phone,
        items: dbOrder.items,
        totalAmount: dbOrder.total_amount,
        status: dbOrder.status,
        qrToken: dbOrder.qr_token,
        timestamp: new Date(dbOrder.timestamp),
        orderType: dbOrder.order_type,
        couponCode: dbOrder.coupon_code,
        discountAmount: dbOrder.discount_amount,
        refundAmount: dbOrder.refund_amount,
        collectedByStaffId: dbOrder.collected_by_staff_id,
        seatNumber: seatNumber,
    };
};

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

export const getMenu = async (studentId?: string): Promise<MenuItem[]> => {
    const { data: menuData, error: menuError } = await supabase.from('menu').select('*');
    if (menuError) throw menuError;
    if (!menuData) return []; // Defensive check for null data

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
    
    if (!favoritesData) {
        // Handle case where data is null but no error, to prevent crash on .map
        return mappedMenu;
    }

    const favoriteIds = new Set(favoritesData.map(f => f.item_id));
    
    return mappedMenu.map(item => ({
        ...item,
        isFavorited: favoriteIds.has(item.id)
    }));
};

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

export const placeOrder = async (orderData: { studentId: string; studentName: string; items: any[]; totalAmount: number; couponCode?: string, discountAmount?: number }): Promise<Order> => {
    const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', getStartOfToday());

    if (countError) throw countError;

    const orderNumber = (count || 0) + 1;

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
            order_number: orderNumber,
        }
    ]).select().single();

    if (error) throw error;
    
    // Update QR token with real order ID
    const finalQrToken = JSON.stringify({ orderId: data.id });
    const { data: updatedData, error: updateError } = await supabase.from('orders').update({ qr_token: finalQrToken }).eq('id', data.id).select('*').single();

    if (updateError) throw updateError;
    
    return mapDbOrderToAppOrder(updatedData);
};

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

export const verifyQrCodeAndCollectOrder = async (qrToken: string, staffId: string): Promise<Order> => {
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
    if (order.status !== OrderStatusEnum.PREPARED && order.status !== OrderStatusEnum.PENDING) {
        throw new Error('Order cannot be collected (it may have been cancelled).');
    }
    
    const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({ status: OrderStatusEnum.COLLECTED, collected_by_staff_id: staffId })
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

export const updateOrderSeatNumber = async (orderId: string, seatNumber: string): Promise<Order> => {
    // 1. Fetch current student_name
    const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('student_name')
        .eq('id', orderId)
        .single();
    if (fetchError || !currentOrder) throw new Error("Order not found");

    const baseName = currentOrder.student_name.split(' (Seat:')[0]; // Remove old seat number if present
    const newStudentName = `${baseName} (Seat: ${seatNumber})`;

    const { data, error } = await supabase
        .from('orders')
        .update({ student_name: newStudentName })
        .eq('id', orderId)
        .select('*, users(username, phone)')
        .single();

    if (error) throw error;
    return mapDbOrderToAppOrder(data);
};

export const getStudentOrders = async (studentId: string): Promise<Order[]> => {
    const { data, error } = await supabase.from('orders').select('*').eq('student_id', studentId).order('timestamp', { ascending: false });
    if (error) throw error;
    return data.map(mapDbOrderToAppOrder);
};

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

// --- ADMIN / OWNER FUNCTIONS ---

// Fix: Add getAdminDashboardStats function
export const getAdminDashboardStats = async (): Promise<AdminStats> => {
    const { count: totalUsers, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    const { count: totalCustomers, error: customersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', RoleEnum.STUDENT);
    
    const { count: totalOwners, error: ownersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', RoleEnum.CANTEEN_OWNER);
        
    const { count: pendingApprovals, error: pendingError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', RoleEnum.CANTEEN_OWNER)
        .eq('approval_status', 'pending');

    const { count: totalFeedbacks, error: feedbacksError } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact', head: true });

    if (usersError || customersError || ownersError || pendingError || feedbacksError) {
        console.error('Error fetching admin stats:', usersError || customersError || ownersError || pendingError || feedbacksError);
        throw new Error('Could not fetch admin dashboard stats.');
    }

    return {
        totalUsers: totalUsers ?? 0,
        totalCustomers: totalCustomers ?? 0,
        totalOwners: totalOwners ?? 0,
        pendingApprovals: pendingApprovals ?? 0,
        totalFeedbacks: totalFeedbacks ?? 0,
    };
};

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

export const updateOwnerApprovalStatus = async (userId: string, status: 'approved' | 'rejected' | 'pending'): Promise<User> => {
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

export const getStudentPointsList = async (): Promise<StudentPoints[]> => {
    const { data, error } = await supabase.from('users').select('id, username, loyalty_points').eq('role', RoleEnum.STUDENT).order('loyalty_points', { ascending: false }).limit(20);
    if (error) throw error;
    return data.map(u => ({ studentId: u.id, studentName: u.username, points: u.loyalty_points }));
};

export const getScanTerminalStaff = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', RoleEnum.CANTEEN_OWNER)
        .is('canteen_name', null);
    
    if (error) throw error;
    if (!data) return [];

    return data.map(mapDbUserToAppUser);
};

export const deleteScanTerminalStaff = async (userId: string): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
    
    if (error) throw error;
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

export const updateOffer = async (offerId: string, updatedData: Partial<Omit<Offer, 'id'>>): Promise<void> => {
    const dbPayload: Record<string, any> = {};
    if (updatedData.code !== undefined) dbPayload.code = updatedData.code;
    if (updatedData.description !== undefined) dbPayload.description = updatedData.description;
    if (updatedData.discountType !== undefined) dbPayload.discount_type = updatedData.discountType;
    if (updatedData.discountValue !== undefined) dbPayload.discount_value = updatedData.discountValue;
    if (updatedData.isActive !== undefined) dbPayload.is_active = updatedData.isActive;

    const { error } = await supabase
        .from('offers')
        .update(dbPayload)
        .eq('id', offerId);
    
    if (error) throw error;
};

export const deleteOffer = async (offerId: string): Promise<void> => {
    const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);
    
    if (error) throw error;
};

export const getOffers = async (studentId: string): Promise<Offer[]> => {
    const { data, error } = await supabase.from('offers').select('*').eq('student_id', studentId);
    if (error) throw error;
    return data.map(mapDbOfferToAppOffer);
};

export const getAllStudentCoupons = async (studentId: string): Promise<Offer[]> => {
    const { data, error } = await supabase.from('offers').select('*').eq('student_id', studentId);
    if (error) throw error;
    return data.map(mapDbOfferToAppOffer);
};

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

    // Fix: Complete the function to handle error and return a value
    if (offerError) throw new Error('Failed to create coupon from reward.');
    
    return mapDbOfferToAppOffer(newOffer);
};

// Fix: Add missing functions for Bank Details, Menu Management, and Canteen Gallery
export const getOwnerBankDetails = async (ownerId: string): Promise<OwnerBankDetails> => {
    const { data, error } = await supabase.from('owner_bank_details').select('*').eq('owner_id', ownerId).maybeSingle();
    if (error) throw error;
    return data || { accountNumber: '', bankName: '', ifscCode: '', upiId: '', email: '', phone: '' };
};

export const requestSaveBankDetailsOtp = async (details: OwnerBankDetails): Promise<{ message: string }> => {
    // Mock OTP logic
    console.log(`OTP for bank details update: 123456`);
    return { message: "OTP sent to your registered phone and email." };
};

export const verifyOtpAndSaveBankDetails = async (details: OwnerBankDetails, otp: string, ownerId: string): Promise<OwnerBankDetails> => {
    if (otp !== '123456') { // Mock OTP check
        throw new Error('Invalid OTP. Please try again.');
    }
    const payload = {
        owner_id: ownerId,
        account_number: details.accountNumber,
        bank_name: details.bankName,
        ifsc_code: details.ifscCode,
        upi_id: details.upiId,
        email: details.email,
        phone: details.phone,
    };
    const { data, error } = await supabase
        .from('owner_bank_details')
        .upsert(payload, { onConflict: 'owner_id' })
        .select()
        .single();
        
    if (error) throw error;

    return {
        accountNumber: data.account_number,
        bankName: data.bank_name,
        ifscCode: data.ifsc_code,
        upiId: data.upi_id,
        email: data.email,
        phone: data.phone,
    };
};

export const addMenuItem = async (itemData: Partial<MenuItem> & { price: number }, ownerId: string): Promise<MenuItem> => {
    const payload = {
        name: itemData.name,
        price: itemData.price,
        image_url: itemData.imageUrl,
        is_available: itemData.isAvailable,
        emoji: itemData.emoji,
        description: itemData.description,
        is_combo: itemData.isCombo,
        combo_items: itemData.comboItems,
    };
    const { data, error } = await supabase.from('menu').insert(payload).select().single();
    if (error) throw error;
    return mapDbMenuToAppMenu(data);
};

export const updateMenuItem = async (itemId: string, itemData: Partial<MenuItem>): Promise<MenuItem> => {
    const payload: Record<string, any> = {};
    if(itemData.name) payload.name = itemData.name;
    if(itemData.price) payload.price = itemData.price;
    if(itemData.imageUrl) payload.image_url = itemData.imageUrl;
    if(itemData.isAvailable !== undefined) payload.is_available = itemData.isAvailable;
    if(itemData.emoji) payload.emoji = itemData.emoji;
    if(itemData.description) payload.description = itemData.description;
    if(itemData.isCombo !== undefined) payload.is_combo = itemData.isCombo;
    if(itemData.comboItems) payload.combo_items = itemData.comboItems;
    
    const { data, error } = await supabase.from('menu').update(payload).eq('id', itemId).select().single();
    if (error) throw error;
    return mapDbMenuToAppMenu(data);
};

export const removeMenuItem = async (itemId: string): Promise<void> => {
    const { error } = await supabase.from('menu').delete().eq('id', itemId);
    if (error) throw error;
};

const processImageForUpload = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const getCanteenPhotos = async (): Promise<CanteenPhoto[]> => {
    const { data, error } = await supabase.from('canteen_photos').select('*').order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data.map(p => ({
        id: p.id,
        data: p.data,
        uploadedAt: new Date(p.uploaded_at),
    }));
};

export const addCanteenPhoto = async (file: File): Promise<CanteenPhoto> => {
    const dataUrl = await processImageForUpload(file);
    const { data, error } = await supabase.from('canteen_photos').insert({ data: dataUrl }).select().single();
    if (error) throw error;
    return {
        id: data.id,
        data: data.data,
        uploadedAt: new Date(data.uploaded_at),
    };
};

export const deleteCanteenPhoto = async (photoId: string): Promise<void> => {
    const { error } = await supabase.from('canteen_photos').delete().eq('id', photoId);
    if (error) throw error;
};

export const updateCanteenPhoto = async (photoId: string, file: File): Promise<CanteenPhoto> => {
    const dataUrl = await processImageForUpload(file);
    const { data, error } = await supabase.from('canteen_photos').update({ data: dataUrl }).eq('id', photoId).select().single();
    if (error) throw error;
    return {
        id: data.id,
        data: data.data,
        uploadedAt: new Date(data.uploaded_at),
    };
};
