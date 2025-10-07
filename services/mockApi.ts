// fix: Import CanteenPhoto to support gallery features.
import type { User, Role, MenuItem, Order, OrderStatus, SalesSummary, Feedback, Offer, CartItem, StudentProfile, Reward, StudentPoints, TodaysDashboardStats, TodaysDetailedReport, OwnerBankDetails, CanteenPhoto } from '../types';
import { Role as RoleEnum, OrderStatus as OrderStatusEnum } from '../types';

// --- MOCK DATABASE ---
let users: User[] = [
  { id: 'user-1', username: 'student', role: RoleEnum.STUDENT, token: 'jwt-token-student', phone: '9876543210', password: 'password123', email: 'student@example.com', isFirstLogin: false },
  { id: 'user-2', username: 'Initial Owner', role: RoleEnum.CANTEEN_OWNER, token: 'jwt-token-owner', phone: '8765432109', password: 'password123', approvalStatus: 'approved', email: 'owner@example.com', approvalDate: new Date().toISOString(), profileImageUrl: '', canteenName: 'Zeon Food Court' },
  { id: 'user-3', username: 'Santhosh', role: RoleEnum.ADMIN, token: 'jwt-token-admin', phone: '1234567890', password: 'Santhosh@1629', email: 'santhosh.ap1612@gmail.com' },
  { id: 'user-4', username: 'Pending Owner 1', role: RoleEnum.CANTEEN_OWNER, token: 'jwt-token-pending1', phone: '1112223334', password: 'password123', approvalStatus: 'pending', email: 'pending1@example.com', canteenName: 'Tasty Bites', idProofUrl: 'https://images.unsplash.com/photo-1586511925558-a4c6376fe658' },
  { id: 'user-5', username: 'Pending Owner 2', role: RoleEnum.CANTEEN_OWNER, token: 'jwt-token-pending2', phone: '4445556667', password: 'password123', approvalStatus: 'pending', email: 'pending2@example.com', canteenName: 'Quick Eats', idProofUrl: 'https://images.unsplash.com/photo-1606169103689-d1c27c3f8588' },
  { id: 'user-6', username: 'Rejected Owner', role: RoleEnum.CANTEEN_OWNER, token: 'jwt-token-rejected', phone: '7778889990', password: 'password123', approvalStatus: 'rejected', email: 'rejected@example.com', canteenName: 'Old Snacks', idProofUrl: 'https://images.unsplash.com/photo-1559059699-0856a2b8e343' },
];

let menu: Omit<MenuItem, 'isFavorited'>[] = [
    { id: 'item-1', name: 'Chicken Rice', price: 70, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1626385342111-a1bbb73706c8?q=80&w=800&auto=format&fit=crop', emoji: '🍗', averageRating: 4.5, favoriteCount: 15, nutrition: { calories: 550, protein: '30g', fat: '20g', carbs: '60g' }, description: 'A classic and flavorful dish featuring succulent chicken and fragrant rice. A true canteen favorite.' },
    { id: 'item-2', name: 'Noodles', price: 70, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?q=80&w=800&auto=format&fit=crop', emoji: '🍜', averageRating: 4.8, favoriteCount: 25, dietaryTags: ['vegetarian'], nutrition: { calories: 450, protein: '15g', fat: '18g', carbs: '55g' }, description: 'Hot and delicious noodles tossed in a savory sauce with fresh vegetables. Quick, simple, and satisfying.' },
    { id: 'item-3', name: 'Egg Rice', price: 65, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1597321813438-d93e1cf3a812?q=80&w=800&auto=format&fit=crop', emoji: '🍳', averageRating: 4.0, favoriteCount: 8, dietaryTags: ['vegetarian'], nutrition: { calories: 480, protein: '18g', fat: '22g', carbs: '50g' }, description: 'Fluffy fried rice with scrambled eggs and a mix of light spices. A comforting and filling meal.' },
    { id: 'item-4', name: 'Gobi Rice', price: 65, isAvailable: false, imageUrl: 'https://images.unsplash.com/photo-1592442593457-fe9109594d64?q=80&w=800&auto=format&fit=crop', emoji: '🍚', averageRating: 3.8, favoriteCount: 5, dietaryTags: ['vegetarian', 'vegan'], nutrition: { calories: 420, protein: '10g', fat: '15g', carbs: '60g' }, description: 'A delightful combination of cauliflower florets and rice, cooked with aromatic spices.' },
    { id: 'item-5', name: 'Parotta', price: 15, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1606491956392-5e6024745033?q=80&w=800&auto=format&fit=crop', emoji: '🫓', averageRating: 4.6, favoriteCount: 18, dietaryTags: ['vegetarian'], nutrition: { calories: 250, protein: '5g', fat: '10g', carbs: '35g' }, description: 'A layered flatbread that is crispy on the outside and soft on the inside. Perfect with any curry.' },
    { id: 'item-6', name: 'Variety Rice', price: 40, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop', emoji: '🍛', averageRating: 3.9, favoriteCount: 4, dietaryTags: ['vegetarian'], nutrition: { calories: 400, protein: '8g', fat: '12g', carbs: '65g' }, description: 'Today\'s special variety rice, check at the counter for the current flavor (e.g., Lemon, Tomato, Tamarind).' },
    {
      id: 'combo-1',
      name: 'Lunch Special Combo',
      price: 80,
      description: 'A perfect lunch deal with our popular noodles and a fresh parotta.',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800&auto=format&fit=crop',
      emoji: '🎉',
      isCombo: true,
      comboItems: [
        { id: 'item-2', name: 'Noodles' },
        { id: 'item-5', name: 'Parotta' }
      ],
      averageRating: 4.7,
      favoriteCount: 30,
    },
    { id: 'item-7', name: 'Juice', price: 30, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=800&auto=format&fit=crop', emoji: '🧃', averageRating: 4.3, favoriteCount: 9, dietaryTags: ['vegetarian', 'vegan', 'gluten-free'], nutrition: { calories: 120, protein: '1g', fat: '0g', carbs: '30g' }, description: 'Freshly prepared juice. Ask for available fruit options for the day.' },
    { id: 'item-9', name: 'Ice Cream', price: 10, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800&auto=format&fit=crop', emoji: '🍦', averageRating: 4.9, favoriteCount: 20, dietaryTags: ['vegetarian'], nutrition: { calories: 200, protein: '4g', fat: '12g', carbs: '25g' }, description: 'A scoop of creamy and delicious ice cream. The perfect treat to beat the heat.' },
    { id: 'item-10', name: 'Snacks', price: 25, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b83d8e483d?q=80&w=800&auto=format&fit=crop', emoji: '🥨', averageRating: 4.1, favoriteCount: 7, dietaryTags: ['vegetarian'], nutrition: { calories: 300, protein: '6g', fat: '15g', carbs: '35g' }, description: 'A variety of savory snacks available. Please check the counter for today\'s selection.' },
];

let orders: Order[] = [
    { 
        id: 'order-1', 
        studentId: 'user-1',
        studentName: 'student',
        studentPhone: '9876543210',
        canteenOwnerPhone: '8765432109',
        items: [
            { id: 'item-1', name: 'Chicken Rice', quantity: 1, price: 70, imageUrl: 'https://images.unsplash.com/photo-1626385342111-a1bbb73706c8?q=80&w=800&auto=format&fit=crop' },
            { id: 'item-7', name: 'Juice', quantity: 2, price: 30, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=800&auto=format&fit=crop' },
        ],
        totalAmount: 130,
        status: OrderStatusEnum.PENDING,
        qrToken: JSON.stringify({ orderId: 'order-1', studentId: 'user-1' }),
        timestamp: new Date(), // Set to today for dashboard testing
        orderType: 'real',
        pointsEarned: 5,
    },
    { 
        id: 'order-2', 
        studentId: 'user-1',
        studentName: 'student',
        studentPhone: '9876543210',
        canteenOwnerPhone: '8765432109',
        items: [
            { id: 'item-2', name: 'Noodles', quantity: 1, price: 70, imageUrl: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?q=80&w=800&auto=format&fit=crop' },
        ],
        totalAmount: 70,
        status: OrderStatusEnum.PREPARED,
        qrToken: JSON.stringify({ orderId: 'order-2', studentId: 'user-1' }),
        timestamp: new Date(), // Set to today for dashboard testing
        orderType: 'real',
        pointsEarned: 5
    },
    { 
        id: 'order-3', 
        studentId: 'user-1',
        studentName: 'student',
        studentPhone: '9876543210',
        canteenOwnerPhone: '8765432109',
        items: [
            { id: 'item-5', name: 'Parotta', quantity: 4, price: 15, imageUrl: 'https://images.unsplash.com/photo-1606491956392-5e6024745033?q=80&w=800&auto=format&fit=crop' },
        ],
        totalAmount: 60,
        status: OrderStatusEnum.COLLECTED,
        qrToken: JSON.stringify({ orderId: 'order-3', studentId: 'user-1' }),
        timestamp: new Date(Date.now() - 86400000), // Yesterday
        orderType: 'real',
        pointsEarned: 5
    }
];

let feedbacks: Feedback[] = [
    { id: 'fb-1', studentId: 'user-1', studentName: 'student', itemId: 'item-1', itemName: 'Chicken Rice', rating: 4, comment: 'The chicken rice was great!', timestamp: new Date() },
    { id: 'fb-2', studentId: 'user-1', studentName: 'student', itemId: 'item-2', itemName: 'Noodles', rating: 5, comment: 'Best noodles ever!', timestamp: new Date() },
];

let studentFavorites: { [studentId: string]: Set<string> } = {
    'user-1': new Set(['item-1', 'item-2', 'item-5', 'item-9', 'combo-1'])
};

let studentProfiles: { [studentId: string]: { loyaltyPoints: number; lifetimeSpend: number; milestoneRewardsUnlocked: number[] } } = {
    'user-1': { loyaltyPoints: 15, lifetimeSpend: 190, milestoneRewardsUnlocked: [] }
};

const getRewardsFromStorage = (): Reward[] => {
    const stored = localStorage.getItem('canteenRewards');
    if (stored) {
        return JSON.parse(stored);
    }
    // Default rewards
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    return [
        { id: 'reward-1', title: '₹20 OFF Coupon', description: 'Get a flat ₹20 discount on your next order.', pointsCost: 50, discount: { type: 'fixed', value: 20 }, isActive: true, expiryDate: expiry.toISOString() },
        { id: 'reward-2', title: 'Free Juice', description: 'Redeem for a free juice (up to ₹30).', pointsCost: 75, discount: { type: 'fixed', value: 30 }, isActive: true, expiryDate: expiry.toISOString() },
        { id: 'reward-3', title: '15% OFF Your Order', description: 'Get 15% off your entire next order.', pointsCost: 100, discount: { type: 'percentage', value: 15 }, isActive: false, expiryDate: expiry.toISOString() },
    ];
};

const saveRewardsToStorage = (rewards: Reward[]) => {
    localStorage.setItem('canteenRewards', JSON.stringify(rewards));
};

let rewards: Reward[] = getRewardsFromStorage();

let userCoupons: Offer[] = [
    // FIX: Added isActive property to align with the new Offer type definition.
    { id: 'uc-1', studentId: 'user-1', code: 'WELCOME10', description: 'Welcome offer: ₹10 off!', discountType: 'fixed', discountValue: 10, isUsed: false, isActive: true },
    { id: 'uc-2', studentId: 'user-1', code: 'SPECIAL50', description: 'Special one-time offer: 15% off', discountType: 'percentage', discountValue: 15, isUsed: false, isActive: true },
    { id: 'uc-3', studentId: 'user-1', code: 'USED20', description: 'A past offer: ₹20 off', discountType: 'fixed', discountValue: 20, isUsed: true, isActive: false },
    { id: 'uc-4', studentId: 'user-1', code: 'REWARD123', description: 'Reward: Flat ₹15 off', discountType: 'fixed', discountValue: 15, isUsed: true, isReward: true, isActive: false },
];

let ownerBankDetails: OwnerBankDetails = {
    accountNumber: '123456789012',
    bankName: 'Mock Bank of India',
    ifscCode: 'MOCK0001234',
    upiId: 'owner-upi@ybl',
    email: 'owner@zeonfoodcourt.com',
    phone: '8765432109',
};

// FIX: Add state for canteen photos to support gallery feature.
let canteenPhotos: CanteenPhoto[] = [];


// --- NEW STATE FOR OWNER ONLINE STATUS ---
let previouslyAvailableItemIds: Set<string> = new Set();
// Initialize based on whether an approved owner exists
let isOwnerOnline = users.some(u => u.role === RoleEnum.CANTEEN_OWNER && u.approvalStatus === 'approved');

// --- MOCK API FUNCTIONS ---
const SECRET_KEY = 'zeon-food-court-secret';
const QR_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const getOwnerStatus = async (): Promise<{ isOnline: boolean }> => {
    await delay(50);
    return { isOnline: isOwnerOnline };
}

export const mockLogin = async (phoneOrEmail: string, password: string): Promise<User> => {
  await delay(500);
  const user = users.find(u => u.phone === phoneOrEmail || u.email === phoneOrEmail);
  // In a real app, you would compare a hashed password.
  if (user && user.password === password) {
    if (user.role === RoleEnum.CANTEEN_OWNER) {
        // First, check if admin has approved the account
        if (user.approvalStatus !== 'approved') {
            return user; // Return user object to let UI show 'pending' or 'rejected' status
        }
        // Restore menu availability on login
        isOwnerOnline = true;
        menu.forEach(item => {
            if (previouslyAvailableItemIds.has(item.id)) {
                item.isAvailable = true;
            }
        });
        previouslyAvailableItemIds.clear(); // Clear after restoring
    }
    return user;
  }
  throw new Error('Invalid credentials');
};

export const mockRegisterStudent = async (name: string, phone: string, password: string): Promise<User> => {
  await delay(500);
  if (users.find(u => u.phone === phone)) {
    throw new Error('A user with this phone number already exists.');
  }
  const newUser: User = {
    id: `user-${Date.now()}`,
    username: name,
    phone,
    password, // Store the password
    role: RoleEnum.STUDENT,
    token: `jwt-token-student-${Date.now()}`,
    isFirstLogin: true,
  };
  users.push(newUser);
  // Also initialize their profile and favorites
  studentProfiles[newUser.id] = { loyaltyPoints: 0, lifetimeSpend: 0, milestoneRewardsUnlocked: [] };
  studentFavorites[newUser.id] = new Set();
  return newUser;
};

export const mockRegisterOwner = async (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string): Promise<User> => {
  await delay(700);
  if (users.some(u => u.phone === phone || u.email === email)) {
    throw new Error('A user with this phone number or email already exists.');
  }
  const newOwner: User = {
    id: `user-${Date.now()}`,
    username: name,
    email,
    phone,
    password,
    role: RoleEnum.CANTEEN_OWNER,
    token: `jwt-token-owner-${Date.now()}`,
    approvalStatus: 'pending',
    canteenName,
    idProofUrl,
  };
  users.push(newOwner);
  return newOwner;
};

export const requestPasswordReset = async (phone: string): Promise<{ message: string }> => {
    await delay(500);
    const user = users.find(u => u.phone === phone);
    if (!user) {
        // To prevent user enumeration, we return a generic success message even if the user doesn't exist.
        console.log(`Password reset requested for non-existent phone: ${phone}. Responding with generic success message.`);
        return { message: "If an account with this phone number exists, an OTP has been sent." };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    user.resetOtp = otp;
    user.resetOtpExpires = expiry;

    // In a real app, this would send an SMS. Here, we log it for the developer/user to see.
    console.log(`[MOCK SMS] OTP for ${user.username} (${phone}): ${otp}`);
    
    return { message: "If an account with this phone number exists, an OTP has been sent." };
};

export const verifyOtpAndResetPassword = async (phone: string, otp: string, newPassword: string): Promise<{ message: string }> => {
    await delay(1000);
    const user = users.find(u => u.phone === phone);

    if (!user || !user.resetOtp || !user.resetOtpExpires) {
        throw new Error("Invalid OTP or reset request. Please try again.");
    }

    if (new Date() > user.resetOtpExpires) {
        // Clear expired OTP
        delete user.resetOtp;
        delete user.resetOtpExpires;
        throw new Error("OTP has expired. Please request a new one.");
    }

    if (user.resetOtp !== otp) {
        throw new Error("The OTP you entered is incorrect.");
    }
    
    // Success! Reset password and clear OTP fields.
    user.password = newPassword;
    delete user.resetOtp;
    delete user.resetOtpExpires;
    
    return { message: "Your password has been reset successfully." };
};


export const approveOwnerLogin = async (userId: string): Promise<User> => {
    await delay(1000);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error("User not found.");
    }
    const user = users[userIndex];
    user.approvalStatus = 'approved';
    return user;
};

export const getPendingOwnerRequests = async (): Promise<User[]> => {
    await delay(500);
    return users.filter(u => u.role === RoleEnum.CANTEEN_OWNER && u.approvalStatus === 'pending');
};

export const getApprovedOwners = async (): Promise<User[]> => {
    await delay(500);
    return users.filter(u => u.role === RoleEnum.CANTEEN_OWNER && u.approvalStatus === 'approved');
};

export const getRejectedOwners = async (): Promise<User[]> => {
    await delay(500);
    return users.filter(u => u.role === RoleEnum.CANTEEN_OWNER && u.approvalStatus === 'rejected');
};

export const updateOwnerApprovalStatus = async (userId: string, status: 'approved' | 'rejected'): Promise<User> => {
    await delay(300);
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    users[userIndex].approvalStatus = status;
    if (status === 'approved') {
        users[userIndex].approvalDate = new Date().toISOString();
    } else {
        delete users[userIndex].approvalDate;
    }
    return users[userIndex];
};

export const removeOwnerAccount = async (userId: string): Promise<{ success: boolean }> => {
    await delay(500);
    const initialLength = users.length;
    users = users.filter(u => u.id !== userId);
    
    if (users.length === initialLength) {
        throw new Error("User not found for removal.");
    }
    return { success: true };
};

export const mockOwnerLogout = async (userId: string): Promise<void> => {
    await delay(200);
    const user = users.find(u => u.id === userId);
    if (user && user.role === RoleEnum.CANTEEN_OWNER) {
        isOwnerOnline = false;
        // Store which items were available
        previouslyAvailableItemIds.clear();
        menu.forEach(item => {
            if (item.isAvailable) {
                previouslyAvailableItemIds.add(item.id);
            }
            item.isAvailable = false;
        });
    }
    return;
};

export const getMenu = async (studentId?: string): Promise<MenuItem[]> => {
    await delay(300);
    const menuCopy: MenuItem[] = JSON.parse(JSON.stringify(menu));
    if (studentId) {
        const favorites = studentFavorites[studentId] || new Set();
        return menuCopy.map(item => ({
            ...item,
            isFavorited: favorites.has(item.id)
        }));
    }
    return menuCopy;
};

export const getMenuItemById = async (itemId: string, studentId?: string): Promise<MenuItem | undefined> => {
    await delay(200);
    const item = menu.find(i => i.id === itemId);
    if (!item) return undefined;
    
    const itemCopy: MenuItem = JSON.parse(JSON.stringify(item));
    if (studentId) {
        const favorites = studentFavorites[studentId] || new Set();
        itemCopy.isFavorited = favorites.has(itemId);
    }
    return itemCopy;
}

export const toggleFavoriteItem = async (studentId: string, itemId: string): Promise<void> => {
    await delay(200);
    if (!studentFavorites[studentId]) {
        studentFavorites[studentId] = new Set();
    }
    
    const menuItem = menu.find(item => item.id === itemId);
    if (!menuItem) throw new Error("Item not found");

    if (studentFavorites[studentId].has(itemId)) {
        studentFavorites[studentId].delete(itemId);
        if(menuItem.favoriteCount !== undefined) menuItem.favoriteCount--;
    } else {
        studentFavorites[studentId].add(itemId);
        if(menuItem.favoriteCount !== undefined) menuItem.favoriteCount++;
    }
    return;
};

const MILESTONE_REWARDS = [
    { spend: 200, value: 10 },
    { spend: 500, value: 30 },
    { spend: 1000, value: 50 },
];

export const placeOrder = async (orderData: { studentId: string; items: any[]; totalAmount: number; couponCode?: string, discountAmount?: number }): Promise<Order> => {
    await delay(1000);
    const student = users.find(u => u.id === orderData.studentId);
    if (!student) throw new Error("Student not found");

    if (orderData.couponCode) {
        const couponIndex = userCoupons.findIndex(c => c.studentId === orderData.studentId && c.code === orderData.couponCode && !c.isUsed);
        if (couponIndex > -1) {
            userCoupons[couponIndex].isUsed = true;
        }
    }

    const owner = users.find(u => u.role === RoleEnum.CANTEEN_OWNER);
    const orderId = `order-${Date.now()}`;
    const timestamp = Date.now();
    const hash = `${orderId}-${timestamp}-${SECRET_KEY}`; 
    const qrToken = JSON.stringify({ orderId, timestamp, hash });
    
    // --- Loyalty & Milestone Logic ---
    const profile = studentProfiles[orderData.studentId];
    let unlockedMilestoneCoupon: Offer | undefined = undefined;

    if (profile) {
        // 1. Update Lifetime Spend
        const previousSpend = profile.lifetimeSpend;
        profile.lifetimeSpend += orderData.totalAmount;
        const newSpend = profile.lifetimeSpend;

        // 2. Check for new milestone rewards
        for (const milestone of MILESTONE_REWARDS) {
            if (previousSpend < milestone.spend && newSpend >= milestone.spend && !profile.milestoneRewardsUnlocked.includes(milestone.spend)) {
                
                const newCoupon: Offer = {
                    id: `uc-milestone-${milestone.spend}-${orderData.studentId}`,
                    studentId: orderData.studentId,
                    code: `SPEND${milestone.spend}`,
                    description: `Reward for spending over ₹${milestone.spend}!`,
                    discountType: 'fixed',
                    discountValue: milestone.value,
                    isUsed: false,
                    isReward: true,
                    isActive: true,
                };
                
                userCoupons.push(newCoupon);
                profile.milestoneRewardsUnlocked.push(milestone.spend);
                unlockedMilestoneCoupon = newCoupon; // To show on success page
                console.log(`User ${orderData.studentId} unlocked milestone reward: ₹${milestone.value} OFF`);
                break; // Award one milestone per order for simplicity
            }
        }
    }
    
    const pointsEarned = 5; // Fixed 5 points per order
    if(profile) {
        profile.loyaltyPoints += pointsEarned;
    }

    const newOrder: Order = {
        id: orderId,
        studentId: orderData.studentId,
        studentName: student.username,
        studentPhone: student.phone,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status: OrderStatusEnum.PENDING,
        qrToken: qrToken,
        timestamp: new Date(),
        orderType: 'real',
        couponCode: orderData.couponCode,
        discountAmount: orderData.discountAmount,
        canteenOwnerPhone: owner?.phone,
        pointsEarned,
        rewardCoupon: unlockedMilestoneCoupon, // Attach the newly unlocked coupon
    };
    orders.unshift(newOrder);
    return newOrder;
};

export const cancelStudentOrder = async (orderId: string, studentId: string): Promise<Order> => {
    await delay(500);
    const orderIndex = orders.findIndex(o => o.id === orderId);

    if (orderIndex === -1) {
        throw new Error("Order not found.");
    }

    const order = orders[orderIndex];

    if (order.studentId !== studentId) {
        // In a real app, this check might not even be necessary if the API is secured,
        // but it's good practice for mock APIs.
        throw new Error("You are not authorized to cancel this order.");
    }

    if (order.status !== OrderStatusEnum.PENDING) {
        throw new Error("This order cannot be cancelled as it is already being prepared or has been completed.");
    }

    // Update the order status and calculate refund
    order.status = OrderStatusEnum.CANCELLED;
    order.refundAmount = order.totalAmount * 0.5;

    orders[orderIndex] = order;
    return order;
};

export const verifyQrCodeAndCollectOrder = async (qrToken: string): Promise<Order> => {
    await delay(1000);
    let tokenData;
    try {
        tokenData = JSON.parse(qrToken);
    } catch (e) {
        throw new Error('Invalid QR Code format.');
    }

    const { orderId, timestamp, hash, isDemo } = tokenData;
    if (isDemo) {
        throw new Error('This is a demo QR code and cannot be used for real orders.');
    }
    if (!orderId || !timestamp || !hash) {
        throw new Error('QR Code is missing required data.');
    }
    const expectedHash = `${orderId}-${timestamp}-${SECRET_KEY}`;
    if (hash !== expectedHash) {
        throw new Error('Invalid or tampered QR Code.');
    }
    if (Date.now() - timestamp > QR_EXPIRATION_MS) {
        throw new Error('QR Code has expired.');
    }
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        throw new Error('Order not found.');
    }
    const order = orders[orderIndex];
    if (order.status === OrderStatusEnum.COLLECTED) {
        throw new Error('This order has already been collected.');
    }
    orders[orderIndex].status = OrderStatusEnum.COLLECTED;
    return orders[orderIndex];
};

export const getOrderById = async(orderId: string): Promise<Order> => {
    await delay(200);
    const order = orders.find(o => o.id === orderId);
    if (!order) throw new Error("Order not found");
    return order;
}

export const getStudentOrders = async (studentId: string): Promise<Order[]> => {
    await delay(400);
    return orders.filter(o => o.studentId === studentId).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

export const getStudentPastRewardCoupons = async (studentId: string): Promise<(Offer & { awardedDate: Date })[]> => {
    await delay(300);
    const rewardOrders = orders.filter(o => o.studentId === studentId && o.rewardCoupon);
    return rewardOrders.map(o => ({
        ...o.rewardCoupon!,
        awardedDate: o.timestamp
    })).sort((a, b) => b.awardedDate.getTime() - a.awardedDate.getTime());
};

const recalculateAverageRating = (itemId: string) => {
    const itemFeedbacks = feedbacks.filter(fb => fb.itemId === itemId);
    const menuItem = menu.find(item => item.id === itemId);
    
    if (menuItem && itemFeedbacks.length > 0 && menuItem.averageRating !== undefined) {
        const totalRating = itemFeedbacks.reduce((sum, fb) => sum + fb.rating, 0);
        menuItem.averageRating = totalRating / itemFeedbacks.length;
    } else if (menuItem && menuItem.averageRating !== undefined) {
        menuItem.averageRating = 0;
    }
};

export const submitFeedback = async (feedbackData: { studentId: string; itemId: string; rating: number; comment?: string; }): Promise<Feedback> => {
    await delay(600);
    const student = users.find(u => u.id === feedbackData.studentId);
    if (!student) throw new Error("Student not found");
    const menuItem = menu.find(i => i.id === feedbackData.itemId);
    if (!menuItem) throw new Error("Menu item not found");

    const newFeedback: Feedback = {
        id: `fb-${Date.now()}`,
        studentId: feedbackData.studentId,
        studentName: student.username,
        itemId: feedbackData.itemId,
        itemName: menuItem.name,
        rating: feedbackData.rating,
        comment: feedbackData.comment,
        timestamp: new Date(),
    };
    feedbacks.push(newFeedback);
    recalculateAverageRating(feedbackData.itemId);
    return newFeedback;
};

// --- DEMO-SPECIFIC FUNCTIONS ---

export const updateFirstLoginStatus = async (userId: string): Promise<User> => {
    await delay(200);
    const user = users.find(u => u.id === userId);
    if (user) {
        user.isFirstLogin = false;
    } else {
        throw new Error("User not found");
    }
    return user;
};

export const getDemoMenu = async (): Promise<MenuItem[]> => {
    await delay(100);
    return [
        { id: 'demo-1', name: 'Demo Chicken Rice', price: 70, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1626385342111-a1bbb73706c8?q=80&w=800&auto=format&fit=crop', emoji: '🍗', description: 'This is a sample item to demonstrate the ordering process. It has no real value.' },
        { id: 'demo-2', name: 'Demo Juice', price: 30, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=800&auto=format&fit=crop', emoji: '🧃', description: 'A refreshing demo juice to complete your sample order.' }
    ];
};

export const placeDemoOrder = async (orderData: { studentId: string; items: any[]; totalAmount: number; }): Promise<Order> => {
    await delay(1000);
    const student = users.find(u => u.id === orderData.studentId);
    if (!student) throw new Error("Student not found");

    student.isFirstLogin = false; // Set the flag to false

    const orderId = `demo-order-${Date.now()}`;
    const timestamp = Date.now();
    const hash = `${orderId}-${timestamp}-${SECRET_KEY}`; 
    const qrToken = JSON.stringify({ orderId, timestamp, hash, isDemo: true });

    const newOrder: Order = {
        id: orderId,
        studentId: orderData.studentId,
        studentName: student.username,
        studentPhone: student.phone,
        items: orderData.items,
        totalAmount: orderData.totalAmount,
        status: OrderStatusEnum.COLLECTED, // Demo orders are instantly "collected"
        qrToken: qrToken,
        timestamp: new Date(),
        orderType: 'demo',
    };
    orders.unshift(newOrder); // Add to history for user to see
    return newOrder;
};

// --- OWNER-SPECIFIC FUNCTIONS ---

export const updateOwnerProfileImage = async (userId: string, imageUrl: string): Promise<User> => {
    await delay(1000); // simulate upload
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found");
    users[userIndex].profileImageUrl = imageUrl;

    // also update localStorage if the logged in user is the one being updated
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const loggedInUser = JSON.parse(storedUser);
        if (loggedInUser.id === userId) {
            loggedInUser.profileImageUrl = imageUrl;
            localStorage.setItem('user', JSON.stringify(loggedInUser));
        }
    }
    
    return users[userIndex];
};


export const getOwnerOrders = async (): Promise<Order[]> => {
    await delay(500);
    return orders.filter(o => o.orderType === 'real').sort((a, b) => {
        const statusOrder = { [OrderStatusEnum.PENDING]: 1, [OrderStatusEnum.PREPARED]: 2, [OrderStatusEnum.COLLECTED]: 3, [OrderStatusEnum.CANCELLED]: 4 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
    });
};

export const getOwnerDemoOrders = async (): Promise<Order[]> => {
    await delay(400);
    return orders.filter(o => o.orderType === 'demo').sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};


export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<Order> => {
    await delay(300);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) throw new Error("Order not found");
    orders[orderIndex].status = status;
    return orders[orderIndex];
};

export const updateMenuAvailability = async (itemId: string, isAvailable: boolean): Promise<MenuItem> => {
    await delay(200);
    const itemIndex = menu.findIndex(i => i.id === itemId);
    if (itemIndex === -1) throw new Error("Menu item not found");
    menu[itemIndex].isAvailable = isAvailable;
    return menu[itemIndex];
};

// --- MENU MANAGEMENT FUNCTIONS ---
export const addMenuItem = async (itemData: Partial<Omit<MenuItem, 'id' | 'averageRating' | 'favoriteCount' | 'isFavorited'>>): Promise<MenuItem> => {
    await delay(400);
    const newItem: Omit<MenuItem, 'isFavorited'> = {
        id: `item-${Date.now()}`,
        name: itemData.name!,
        price: itemData.price!,
        imageUrl: itemData.imageUrl!,
        isAvailable: itemData.isAvailable ?? true,
        description: itemData.description,
        isCombo: itemData.isCombo ?? false,
        comboItems: itemData.comboItems ?? [],
        emoji: itemData.emoji || '🍽️',
        averageRating: 0,
        favoriteCount: 0,
    };
    menu.push(newItem);
    return newItem as MenuItem;
};

export const updateMenuItem = async (itemId: string, dataToUpdate: Partial<Omit<MenuItem, 'id'>>): Promise<MenuItem> => {
    await delay(300);
    const itemIndex = menu.findIndex(s => s.id === itemId);
    if (itemIndex === -1) throw new Error("Item not found");
    const existingItem = menu[itemIndex];
    menu[itemIndex] = { ...existingItem, ...dataToUpdate };
    return menu[itemIndex] as MenuItem;
};

export const removeMenuItem = async (itemId: string): Promise<void> => {
    await delay(300);
    menu = menu.filter(s => s.id !== itemId);
    return;
};

// --- SALES & STATS FUNCTIONS ---
export const getTodaysDashboardStats = async (): Promise<TodaysDashboardStats> => {
  await delay(400); // Simulate network delay

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return order.orderType === 'real' && orderDate >= startOfToday && orderDate <= endOfToday && order.status !== OrderStatusEnum.CANCELLED;
  });

  const totalOrders = todaysOrders.length;

  const totalIncome = todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const itemsSoldMap = new Map<string, number>();
  todaysOrders.forEach(order => {
    order.items.forEach(item => {
      const currentQuantity = itemsSoldMap.get(item.name) || 0;
      itemsSoldMap.set(item.name, currentQuantity + item.quantity);
    });
  });

  const itemsSold = Array.from(itemsSoldMap.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity);

  return {
    totalOrders,
    totalIncome,
    itemsSold,
  };
};

export const getTodaysDetailedReport = async (): Promise<TodaysDetailedReport> => {
  await delay(600); 

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return order.orderType === 'real' && orderDate >= startOfToday && orderDate <= endOfToday && order.status !== OrderStatusEnum.CANCELLED;
  });

  const totalOrders = todaysOrders.length;
  const totalIncome = todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  const itemsSoldMap = new Map<string, { name: string; quantity: number; totalPrice: number }>();
  todaysOrders.forEach(order => {
    order.items.forEach(item => {
      const existingEntry = itemsSoldMap.get(item.name);
      const itemTotalPrice = item.quantity * item.price;
      if (existingEntry) {
        existingEntry.quantity += item.quantity;
        existingEntry.totalPrice += itemTotalPrice;
      } else {
        itemsSoldMap.set(item.name, {
          name: item.name,
          quantity: item.quantity,
          totalPrice: itemTotalPrice,
        });
      }
    });
  });
  
  const itemSales = Array.from(itemsSoldMap.values())
    .sort((a, b) => b.quantity - a.quantity);

  return {
    date: now.toISOString().split('T')[0], // YYYY-MM-DD format
    totalOrders,
    totalIncome,
    itemSales,
  };
};

export const getSalesSummary = async (): Promise<SalesSummary> => {
    await delay(800);
    const today = new Date();
    const dailyData = [...Array(7)].map((_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        return {
            date: d.toLocaleDateString('en-US', { weekday: 'short' }),
            total: Math.floor(Math.random() * (5000 - 1000 + 1) + 1000)
        };
    }).reverse();
    const weeklyData = [...Array(4)].map((_, i) => ({
        week: `Week ${i + 1}`,
        total: Math.floor(Math.random() * (35000 - 10000 + 1) + 10000)
    }));
    return { daily: dailyData, weekly: weeklyData };
};

export const getUsers = async (): Promise<User[]> => {
    await delay(100);
    return users;
};

export const getFeedbacks = async (): Promise<Feedback[]> => {
    await delay(100);
    return feedbacks;
};

export const getFoodPopularityStats = async (): Promise<MenuItem[]> => {
    await delay(400);
    return JSON.parse(JSON.stringify(menu));
};

export const getMostSellingItems = async (): Promise<{ name: string; count: number }[]> => {
    await delay(200);
    const itemCounts: { [key: string]: number } = {};
    orders.filter(o => o.orderType === 'real').forEach(order => {
        order.items.forEach(item => {
            if (itemCounts[item.name]) {
                itemCounts[item.name] += item.quantity;
            } else {
                itemCounts[item.name] = item.quantity;
            }
        });
    });
    return Object.entries(itemCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
};

export const getOrderStatusSummary = async (): Promise<{ name: string; value: number }[]> => {
    await delay(200);
    const statusCounts = { 'Pending': 0, 'Prepared': 0, 'Completed': 0 };
    orders.filter(o => o.orderType === 'real').forEach(order => {
        if (order.status === OrderStatusEnum.PENDING) statusCounts.Pending++;
        else if (order.status === OrderStatusEnum.PREPARED) statusCounts.Prepared++;
        else if (order.status === OrderStatusEnum.COLLECTED) statusCounts.Completed++;
    });
    return [
        { name: 'Pending', value: statusCounts.Pending },
        { name: 'Ready', value: statusCounts.Prepared },
        { name: 'Completed', value: statusCounts.Completed },
    ];
};

export const getStudentPointsList = async (): Promise<StudentPoints[]> => {
    await delay(300);
    const studentUsers = users.filter(u => u.role === RoleEnum.STUDENT);
    return studentUsers.map(student => {
        const profile = studentProfiles[student.id];
        return {
            studentId: student.id,
            studentName: student.username,
            points: profile ? profile.loyaltyPoints : 0,
        };
    }).sort((a,b) => b.points - a.points);
}

// --- BANK DETAILS FUNCTIONS (with OTP) ---

export const getOwnerBankDetails = async (): Promise<OwnerBankDetails> => {
    await delay(300);
    if (!ownerBankDetails) throw new Error("Bank details not found.");
    return JSON.parse(JSON.stringify(ownerBankDetails));
};

export const requestSaveBankDetailsOtp = async (details: OwnerBankDetails): Promise<{ success: boolean; message: string }> => {
    await delay(1000); // Simulate network latency for sending OTP
    console.log("Simulating OTP request for details:", details);
    // In a real app, this would trigger a backend service to send an SMS/email.
    return { success: true, message: "OTP sent successfully to your registered contact." };
};

export const verifyOtpAndSaveBankDetails = async (details: OwnerBankDetails, otp: string): Promise<OwnerBankDetails> => {
    await delay(1500); // Simulate network latency for verification
    const MOCK_OTP = '123456';
    if (otp !== MOCK_OTP) {
        throw new Error("Invalid OTP. Please try again.");
    }
    // In a real backend, you would encrypt this sensitive data before saving it to the database.
    console.log("OTP verified. Saving bank details:", details);
    ownerBankDetails = { ...details };
    return JSON.parse(JSON.stringify(ownerBankDetails));
};

// --- OFFERS & COUPONS FUNCTIONS ---

// FIX: Added function for owner to see a unique list of all offers.
export const getAllOffersForOwner = async (): Promise<Offer[]> => {
    await delay(300);
    // Return a unique list of offers based on the code.
    const uniqueOffers = new Map<string, Offer>();
    userCoupons.forEach(coupon => {
        const existing = uniqueOffers.get(coupon.code);
        if (!existing || (existing.isUsed && !coupon.isUsed)) {
             uniqueOffers.set(coupon.code, coupon);
        }
    });
    return Array.from(uniqueOffers.values()).sort((a,b) => a.code.localeCompare(b.code));
};

// FIX: Added function for owner to create a new offer for all students.
export const createOffer = async (offerData: Partial<Offer>): Promise<void> => {
    await delay(400);
    if (!offerData.code || !offerData.description) {
        throw new Error("Offer code and description are required.");
    }
    const studentUsers = users.filter(u => u.role === RoleEnum.STUDENT);
    studentUsers.forEach(student => {
        const existingCoupon = userCoupons.find(c => c.studentId === student.id && c.code === offerData.code);
        if (!existingCoupon) {
            const newCoupon: Offer = {
                id: `uc-${Date.now()}-${Math.random()}`,
                studentId: student.id,
                code: offerData.code!,
                description: offerData.description!,
                discountType: offerData.discountType || 'fixed',
                discountValue: offerData.discountValue || 0,
                isUsed: false,
                isReward: false,
                isActive: offerData.isActive ?? true,
            };
            userCoupons.push(newCoupon);
        }
    });
};

// FIX: Added function for owner to activate/deactivate an offer.
export const updateOfferStatus = async (offerId: string, isActive: boolean): Promise<void> => {
    await delay(200);
    const targetOffer = userCoupons.find(c => c.id === offerId);
    if (!targetOffer) {
        console.warn(`Offer with id ${offerId} not found to update status.`);
        return;
    }
    userCoupons.forEach(coupon => {
        if (coupon.code === targetOffer.code) {
            coupon.isActive = isActive;
        }
    });
};

export const getOffers = async (studentId: string): Promise<Offer[]> => {
    await delay(300);
    // Return only available (not used) coupons from the student's wallet
    return JSON.parse(JSON.stringify(userCoupons.filter(c => c.studentId === studentId && !c.isUsed)));
};

export const getAllUserCoupons = async (studentId: string): Promise<Offer[]> => {
    await delay(300);
    // Return all coupons for a student, used or not, for the history page
    return JSON.parse(JSON.stringify(
        userCoupons
            .filter(c => c.studentId === studentId)
            .sort((a, b) => (a.isUsed === b.isUsed) ? a.code.localeCompare(b.code) : a.isUsed ? 1 : -1)
    ));
};

export const applyCoupon = async (code: string, subtotal: number, studentId: string): Promise<number> => {
    await delay(400);
    const coupon = userCoupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.studentId === studentId);

    if (!coupon) {
        throw new Error("Invalid Coupon");
    }
    
    if (coupon.isUsed) {
        throw new Error("Coupon has already been used.");
    }
    
    let discount = 0;
    if (coupon.discountType === 'fixed') {
        discount = coupon.discountValue;
    } else { // percentage
        discount = subtotal * (coupon.discountValue / 100);
    }
    
    return Math.min(discount, subtotal);
};

// --- STUDENT PROFILE & REWARDS FUNCTIONS ---

export const getStudentProfile = async (studentId: string): Promise<StudentProfile> => {
  await delay(400);
  const student = users.find(u => u.id === studentId);
  if (!student) throw new Error("Student not found");
  
  const studentOrders = orders.filter(o => o.studentId === studentId && o.orderType === 'real' && o.status === OrderStatusEnum.COLLECTED);
  const favorites = studentFavorites[studentId] || new Set();
  const profileData = studentProfiles[studentId] || { loyaltyPoints: 0, lifetimeSpend: 0, milestoneRewardsUnlocked: [] };

  // This ensures lifetimeSpend is always up-to-date if it was somehow not persisted correctly.
  const calculatedSpend = studentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  if (profileData.lifetimeSpend < calculatedSpend) {
      profileData.lifetimeSpend = calculatedSpend;
  }
  
  return {
    id: student.id,
    name: student.username,
    phone: student.phone || '',
    totalOrders: studentOrders.length,
    lifetimeSpend: profileData.lifetimeSpend,
    milestoneRewardsUnlocked: profileData.milestoneRewardsUnlocked,
    favoriteItemsCount: favorites.size,
    loyaltyPoints: profileData.loyaltyPoints,
  };
};

export const updateStudentProfile = async (studentId: string, data: { name: string; phone: string }): Promise<User> => {
    await delay(500);
    const userIndex = users.findIndex(u => u.id === studentId);
    if (userIndex === -1) throw new Error("User not found");
    users[userIndex].username = data.name;
    users[userIndex].phone = data.phone;
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.id === studentId) {
            user.username = data.name;
            user.phone = data.phone;
            localStorage.setItem('user', JSON.stringify(user));
        }
    }
    return users[userIndex];
};

// --- REWARDS MANAGEMENT (OWNER & STUDENT) ---

export const getRewards = async (): Promise<Reward[]> => {
    await delay(200);
    // Students should only see active rewards
    return JSON.parse(JSON.stringify(rewards.filter(r => r.isActive)));
};

export const getAllRewardsForOwner = async (): Promise<Reward[]> => {
    await delay(200);
    // Owner sees all rewards, active or not
    return JSON.parse(JSON.stringify(rewards));
}

export const createReward = async (rewardData: Omit<Reward, 'id'>): Promise<Reward> => {
    await delay(400);
    const newReward: Reward = {
        id: `reward-${Date.now()}`,
        ...rewardData
    };
    rewards.push(newReward);
    saveRewardsToStorage(rewards);
    return newReward;
};

export const updateReward = async (rewardId: string, updatedData: Partial<Omit<Reward, 'id'>>): Promise<Reward> => {
    await delay(300);
    const rewardIndex = rewards.findIndex(r => r.id === rewardId);
    if(rewardIndex === -1) throw new Error("Reward not found");
    rewards[rewardIndex] = { ...rewards[rewardIndex], ...updatedData };
    saveRewardsToStorage(rewards);
    return rewards[rewardIndex];
};

export const deleteReward = async (rewardId: string): Promise<void> => {
    await delay(300);
    rewards = rewards.filter(r => r.id !== rewardId);
    saveRewardsToStorage(rewards);
};

// --- GALLERY MANAGEMENT ---
// FIX: Add functions for managing canteen photo gallery.
const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const getCanteenPhotos = async (): Promise<CanteenPhoto[]> => {
    await delay(300);
    return JSON.parse(JSON.stringify(canteenPhotos));
};

export const addCanteenPhoto = async (file: File): Promise<CanteenPhoto> => {
    await delay(500);
    const dataUrl = await fileToDataUrl(file);
    const newPhoto: CanteenPhoto = {
        id: `photo-${Date.now()}`,
        data: dataUrl,
    };
    canteenPhotos.push(newPhoto);
    return newPhoto;
};

export const deleteCanteenPhoto = async (photoId: string): Promise<void> => {
    await delay(300);
    canteenPhotos = canteenPhotos.filter(p => p.id !== photoId);
};

export const updateCanteenPhoto = async (photoId: string, file: File): Promise<CanteenPhoto> => {
    await delay(500);
    const photoIndex = canteenPhotos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) throw new Error("Photo not found");
    const dataUrl = await fileToDataUrl(file);
    canteenPhotos[photoIndex].data = dataUrl;
    return canteenPhotos[photoIndex];
};


export const redeemReward = async (studentId: string, rewardId: string): Promise<Offer> => {
    await delay(600);
    const profile = studentProfiles[studentId];
    const reward = rewards.find(r => r.id === rewardId);
    if (!profile) throw new Error("Student profile not found.");
    if (!reward) throw new Error("Reward not found.");
    if (!reward.isActive) throw new Error("This reward is currently not active.");
    if (reward.expiryDate && new Date(reward.expiryDate) < new Date()) throw new Error("This reward has expired.");
    if (profile.loyaltyPoints < reward.pointsCost) throw new Error("Not enough points to redeem this reward.");

    profile.loyaltyPoints -= reward.pointsCost;

    const newCoupon: Offer = {
        id: `uc-${Date.now()}`,
        studentId: studentId,
        code: `REWARD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        description: reward.title,
        discountType: reward.discount.type,
        discountValue: reward.discount.value,
        isUsed: false,
        isReward: true,
        isActive: true,
    };
    userCoupons.push(newCoupon);
    return newCoupon;
};