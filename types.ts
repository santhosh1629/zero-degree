
export enum Role {
  STUDENT = 'STUDENT',
  CANTEEN_OWNER = 'CANTEEN_OWNER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  username: string;
  role: Role;
  phone?: string;
  password?: string;
  email?: string;
  profileImageUrl?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvalDate?: string;
  isFirstLogin?: boolean;
  resetOtp?: string;
  resetOtpExpires?: Date;
  canteenName?: string;
  idProofUrl?: string;
  loyaltyPoints?: number;
}

export type DietaryTag = 'vegetarian' | 'vegan' | 'gluten-free';

export interface MenuItem {
  id:string;
  name: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string;
  description?: string; // For combo details
  emoji?: string;
  averageRating?: number;
  favoriteCount?: number;
  isFavorited?: boolean; // For customer-specific view
  dietaryTags?: DietaryTag[];
  nutrition?: {
    calories: number;
    protein: string;
    fat: string;
    carbs: string;
  };
  isCombo?: boolean;
  comboItems?: { id: string; name: string }[];
}

export interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
  isDemo?: boolean;
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARED = 'prepared',
  COLLECTED = 'collected',
  CANCELLED = 'cancelled',
}

export interface Order {
  id: string;
  studentId: string;
  studentName: string;
  customerPhone?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
    imageUrl: string;
  }[];
  totalAmount: number;
  status: OrderStatus;
  qrToken: string;
  timestamp: Date;
  orderType: 'demo' | 'real';
  couponCode?: string;
  discountAmount?: number;
  rewardCoupon?: Offer;
  canteenOwnerPhone?: string;
  pointsEarned?: number;
  pointsSpent?: number;
  refundAmount?: number;
}

export interface SalesSummary {
    daily: { date: string; total: number }[];
    weekly: { week: string; total: number }[];
}

export interface Feedback {
    id: string;
    studentId: string;
    studentName: string;
    itemId: string;
    itemName: string;
    rating: number;
    comment?: string;
    timestamp: Date;
}

export interface Offer {
    id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isUsed: boolean;
    studentId: string; // Every coupon belongs to a customer
    isReward?: boolean;
    isActive?: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  lifetimeSpend: number;
  milestoneRewardsUnlocked: number[]; // e.g., [200, 500] for unlocked milestones
  favoriteItemsCount: number;
  loyaltyPoints: number;
}

export interface Reward {
    id: string;
    title: string;
    description: string;
    pointsCost: number;
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
    };
    isActive: boolean;
    expiryDate?: string; // ISO string date format
}

export interface StudentPoints {
    studentId: string;
    studentName: string;
    points: number;
}

export interface TodaysDashboardStats {
  totalOrders: number;
  totalIncome: number;
  itemsSold: { name: string; quantity: number }[];
}

export interface TodaysDetailedReport {
  date: string;
  totalOrders: number;
  totalIncome: number;
  itemSales: {
    name: string;
    quantity: number;
    totalPrice: number;
  }[];
}

export interface OwnerBankDetails {
    accountNumber: string;
    bankName: string;
    ifscCode: string;
    upiId?: string;
    email: string;
    phone: string;
}

export interface CanteenPhoto {
    id: string;
    data: string; // can be URL or base64 data URL
    uploadedAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalCustomers: number;
  totalOwners: number;
  pendingApprovals: number;
  totalFeedbacks: number;
}