import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { updateAllMenuItemsAvailability } from '../services/mockApi';
import type { User } from '../types';
import { Role } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<User>;
  // Fix: Add register method for student registration.
  register: (name: string, phone: string, password: string) => Promise<User>;
  registerOwner: (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string) => Promise<User>;
  registerStaffUser: (name: string, phone: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  // Fix: Add password reset methods.
  requestPasswordReset: (phone: string) => Promise<{ message: string }>;
  verifyOtpAndResetPassword: (phone: string, otp: string, newPassword: string) => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async (isSilent = false) => {
    if (user && user.role === Role.CANTEEN_OWNER) {
        await updateAllMenuItemsAvailability(user.id, false);
        if (!isSilent) {
             window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: 'Canteen closed. All items set to unavailable.' } }));
        }
    }
    localStorage.removeItem('user');
    setUser(null);
  }, [user]);


  useEffect(() => {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
    }
    setLoading(false);
  }, []);
  
    useEffect(() => {
        let inactivityTimer: ReturnType<typeof setTimeout>;
        const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

        const resetTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            if (user && user.role === Role.CANTEEN_OWNER) {
                inactivityTimer = setTimeout(() => {
                    console.log("Owner inactive for 15 minutes, logging out and closing canteen.");
                    logout(true).catch(err => console.error("Silent logout failed:", err));
                }, INACTIVITY_TIMEOUT);
            }
        };

        const handleActivity = () => resetTimer();

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        
        resetTimer();

        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [user, logout]);


  const handleAuthSuccess = (appUser: User): User => {
    localStorage.setItem('user', JSON.stringify(appUser));
    setUser(appUser);
    return appUser;
  };

  const login = useCallback(async (phoneOrEmail: string, password: string): Promise<User> => {
    // Special hardcoded admin login
    if (phoneOrEmail === '9344328498') {
        if (password === 'Santhosh@1629') {
            const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
            const adminUser = users.find(u => u.role === Role.ADMIN);
            if (!adminUser) {
                throw new Error('Admin account not found in the system. Please contact support.');
            }
            return handleAuthSuccess(adminUser);
        } else {
            throw new Error('Invalid Admin Credentials');
        }
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const foundUser = users.find(u => (u.phone === phoneOrEmail || u.email === phoneOrEmail) && u.password === password);
    
    if (!foundUser) throw new Error('Invalid credentials. Please try again.');

    if (foundUser.role === Role.STUDENT) {
      throw new Error('Customer login has been disabled. Please proceed directly to the menu.');
    }
    
    if (foundUser.role === Role.CANTEEN_OWNER && foundUser.approvalStatus === 'approved') {
        await updateAllMenuItemsAvailability(foundUser.id, true);
        setTimeout(() => window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: 'Canteen reopened! All items are now available.' } })), 500);
    }

    return handleAuthSuccess(foundUser);
  }, []);

  // Fix: Add register function for students.
  const register = useCallback(async (name: string, phone: string, password: string): Promise<User> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    if (users.some(u => u.phone === phone)) {
        throw new Error('This phone number is already registered.');
    }
    
    const newStudent: User = {
        id: crypto.randomUUID(),
        username: name,
        phone,
        password,
        role: Role.STUDENT,
        approvalStatus: 'approved',
        loyaltyPoints: 0,
        isFirstLogin: true,
    };

    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Log in student automatically after registration
    return handleAuthSuccess(newStudent);
  }, []);

  const registerOwner = useCallback(async (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string): Promise<User> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    if (users.some(u => u.phone === phone || u.email === email)) {
        throw new Error('This phone number or email is already registered.');
    }
    
    const newOwner: User = {
        id: crypto.randomUUID(),
        username: name,
        email,
        phone,
        password,
        canteenName,
        idProofUrl,
        role: Role.CANTEEN_OWNER,
        approvalStatus: 'pending',
        isFirstLogin: true,
    };

    users.push(newOwner);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Don't log in owner until approved
    return newOwner;
  }, []);
  
  const registerStaffUser = useCallback(async (name: string, phone: string, password: string): Promise<User> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    if (users.some(u => u.phone === phone)) {
        throw new Error('This phone number is already registered.');
    }
    
    const newStaff: User = {
        id: crypto.randomUUID(),
        username: name,
        phone,
        password,
        role: Role.CANTEEN_OWNER, // Staff are owners without a canteen name
        approvalStatus: 'approved',
        isFirstLogin: true,
    };
    
    users.push(newStaff);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Don't log in automatically, just confirm registration
    return newStaff;
  }, []);

  // Fix: Add password reset request function.
  const requestPasswordReset = useCallback(async (phone: string): Promise<{ message: string }> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const userIndex = users.findIndex(u => u.phone === phone);

    if (userIndex === -1) {
        throw new Error("No account found with this phone number.");
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(new Date().getTime() + 5 * 60000); // 5 minutes expiry

    users[userIndex].resetOtp = otp;
    users[userIndex].resetOtpExpires = expiry;
    localStorage.setItem('users', JSON.stringify(users));
    
    console.log(`Password reset OTP for ${phone}: ${otp}`);
    
    return { message: `An OTP has been sent to your phone (check console). The OTP is ${otp}.` };
  }, []);

  // Fix: Add password reset verification function.
  const verifyOtpAndResetPassword = useCallback(async (phone: string, otp: string, newPassword: string): Promise<{ message: string }> => {
    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const userIndex = users.findIndex(u => u.phone === phone);

    if (userIndex === -1) {
        throw new Error("User not found.");
    }

    const user = users[userIndex];
    if (user.resetOtp !== otp || !user.resetOtpExpires || new Date() > new Date(user.resetOtpExpires)) {
        throw new Error("Invalid or expired OTP.");
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    users[userIndex] = user;
    localStorage.setItem('users', JSON.stringify(users));

    return { message: "Your password has been reset successfully." };
  }, []);


  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error("No user is logged in.");
    
    const users = JSON.parse(localStorage.getItem('users') || '[]') as User[];
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex === -1) throw new Error("User not found in database.");

    const updatedUser = { ...users[userIndex], ...data };
    users[userIndex] = updatedUser;
    localStorage.setItem('users', JSON.stringify(users));

    handleAuthSuccess(updatedUser);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerOwner, registerStaffUser, logout, updateUser, requestPasswordReset, verifyOtpAndResetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
