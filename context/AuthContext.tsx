import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { updateAllMenuItemsAvailability } from '../services/mockApi';
import type { User } from '../types';
import { Role } from '../types';

export interface PhoneLoginModalInfo {
  isOpen: boolean;
  onSuccess?: () => void;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneOrEmail: string, password: string) => Promise<User>;
  register: (name: string, phone: string, password: string) => Promise<User>;
  registerOwner: (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string) => Promise<User>;
  registerStaffUser: (name: string, phone: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  requestPasswordReset: (phone: string) => Promise<{ message: string }>;
  verifyOtpAndResetPassword: (phone: string, otp: string, newPassword: string) => Promise<{ message: string }>;
  promptForPhone: (onSuccess?: () => void) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mapDbUserToAppUser = (dbUser: any): User | null => {
    if (!dbUser) return null;
    return {
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
    };
}

const PhoneLoginModal: React.FC<{ onLogin: (phone: string) => Promise<void>, onClose: () => void }> = ({ onLogin, onClose }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onLogin(phone);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 animate-fade-in-down">
        <div className="bg-energetic-gradient p-1 rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="bg-background rounded-xl p-8 text-center relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl">&times;</button>
                <h2 className="text-2xl font-bold font-heading text-textPrimary mb-2">Login or Sign Up</h2>
                <p className="text-textSecondary mb-6">Enter your phone number to continue.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-center px-4 py-3 bg-black/30 border-b-2 border-white/20 text-textPrimary rounded-lg focus:outline-none focus:border-primary transition-all placeholder:text-white/40 focus:shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                    placeholder="10-digit phone number"
                    required
                    autoFocus
                  />
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <button type="submit" disabled={isLoading} className="w-full bg-primary text-background font-bold py-2 px-6 rounded-lg transition-colors hover:bg-primary-dark disabled:bg-primary/50">
                      {isLoading ? 'Verifying...' : 'Continue'}
                  </button>
                </form>
            </div>
        </div>
    </div>
  );
};


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalInfo, setModalInfo] = useState<PhoneLoginModalInfo>({ isOpen: false });

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
            // Only set the timer for logged-in canteen owners
            if (user && user.role === Role.CANTEEN_OWNER) {
                inactivityTimer = setTimeout(() => {
                    console.log("Owner inactive for 15 minutes, logging out and closing canteen.");
                    logout(true).catch(err => console.error("Silent logout failed:", err)); // Silent logout with error handling
                }, INACTIVITY_TIMEOUT);
            }
        };

        const handleActivity = () => resetTimer();

        // Listen for user activity
        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        
        resetTimer(); // Initial call

        return () => {
            clearTimeout(inactivityTimer);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [user, logout]);


  const handleAuthSuccess = (dbUser: any): User => {
    const appUser = mapDbUserToAppUser(dbUser);
    if (!appUser) throw new Error("Authentication failed.");
    localStorage.setItem('user', JSON.stringify(appUser));
    setUser(appUser);
    return appUser;
  };
  
  const loginOrRegisterWithPhone = async (phone: string) => {
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .eq('role', Role.STUDENT)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is 'exact one row not found'
      throw checkError;
    }
    
    if (existingUser) {
      handleAuthSuccess(existingUser);
    } else {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username: `Student ${phone.slice(-4)}`,
          phone: phone,
          password: phone, // Insecure, for demo purposes
          role: Role.STUDENT,
          approval_status: 'approved',
          is_first_login: true,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      handleAuthSuccess(newUser);
    }
    
    window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'You are now logged in automatically!', type: 'coupon-success' } }));
    
    if (modalInfo.onSuccess) {
      modalInfo.onSuccess();
    }
    setModalInfo({ isOpen: false });
  };
  
  const promptForPhone = (onSuccess?: () => void) => {
    setModalInfo({ isOpen: true, onSuccess });
  };


  const login = useCallback(async (phoneOrEmail: string, password: string): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq.${phoneOrEmail},email.eq.${phoneOrEmail}`)
        .eq('password', password) // Insecure: for demonstration only
        .single();

    if (error || !data) throw new Error('Invalid credentials. Please try again.');
    
    if (data.role === Role.CANTEEN_OWNER && data.approval_status === 'approved') {
        await updateAllMenuItemsAvailability(data.id, true);
        setTimeout(() => window.dispatchEvent(new CustomEvent('show-owner-toast', { detail: { message: 'Canteen reopened! All items are now available.' } })), 500);
    }

    return handleAuthSuccess(data);
  }, []);

  const register = useCallback(async (name: string, phone: string, password: string): Promise<User> => {
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .limit(1);

    if (checkError) throw checkError;

    if (existingUser && existingUser.length > 0) {
        throw new Error('This phone number is already registered. Please try logging in or use a different number.');
    }

    const { data, error } = await supabase
        .from('users')
        .insert({
            username: name,
            phone,
            password,
            role: Role.STUDENT,
            is_first_login: true,
            approval_status: 'approved',
        })
        .select()
        .single();
    
    if (error) {
        if (error.message.includes("duplicate key")) {
            throw new Error('This phone number is already registered. Please try logging in or use a different number.');
        }
        throw new Error(error.message);
    }
    return handleAuthSuccess(data);
  }, []);

  const registerOwner = useCallback(async (name: string, email: string, phone: string, password: string, canteenName: string, idProofUrl: string): Promise<User> => {
    const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('phone, email')
        .or(`phone.eq.${phone},email.eq.${email}`);

    if (checkError) throw checkError;

    if (existingUsers && existingUsers.length > 0) {
        if (existingUsers.some(u => u.phone === phone)) {
            throw new Error('This phone number is already registered.');
        }
        if (existingUsers.some(u => u.email === email)) {
            throw new Error('This email address is already registered.');
        }
    }
    
    const { data, error } = await supabase
        .from('users')
        .insert({
            username: name,
            email,
            phone,
            password,
            canteen_name: canteenName,
            id_proof_url: idProofUrl,
            role: Role.CANTEEN_OWNER,
            approval_status: 'pending',
            is_first_login: true,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    
    const appUser = mapDbUserToAppUser(data);
    if (!appUser) throw new Error('Registration failed.');
    
    return appUser;
  }, []);
  
  const registerStaffUser = useCallback(async (name: string, phone: string, password: string): Promise<User> => {
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .limit(1);

    if (checkError) throw checkError;

    if (existingUser && existingUser.length > 0) {
        throw new Error('This phone number is already registered.');
    }
    
    const { data, error } = await supabase
        .from('users')
        .insert({
            username: name,
            phone,
            password,
            role: Role.CANTEEN_OWNER,
            approval_status: 'approved', // Immediately active
            is_first_login: true,
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    
    const appUser = mapDbUserToAppUser(data);
    if (!appUser) throw new Error('Registration failed.');
    
    return appUser;
  }, []);

  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) throw new Error("No user is logged in.");

    const dbPayload: Record<string, any> = {};
    if (data.username !== undefined) dbPayload.username = data.username;
    if (data.phone !== undefined) dbPayload.phone = data.phone;
    if (data.isFirstLogin !== undefined) dbPayload.is_first_login = data.isFirstLogin;
    if (data.profileImageUrl !== undefined) dbPayload.profile_image_url = data.profileImageUrl;

    if (Object.keys(dbPayload).length === 0) return;

    const { data: updatedUser, error } = await supabase
        .from('users')
        .update(dbPayload)
        .eq('id', user.id)
        .select()
        .single();

    if (error) throw error;
    handleAuthSuccess(updatedUser);
  }, [user]);

  const requestPasswordReset = async (phone: string): Promise<{ message: string }> => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { error } = await supabase
        .from('users')
        .update({ reset_otp: otp, reset_otp_expires: expires.toISOString() })
        .eq('phone', phone);
    
    if (error) throw error;
    console.log(`Password reset OTP for ${phone} is: ${otp}`);
    return { message: "An OTP has been sent to your phone number. (Check console for mock OTP)" };
  };

  const verifyOtpAndResetPassword = async (phone: string, otp: string, newPassword: string): Promise<{ message: string }> => {
    const { data, error } = await supabase
        .from('users')
        .select('id, reset_otp_expires')
        .eq('phone', phone)
        .eq('reset_otp', otp)
        .single();

    if (error || !data) throw new Error("Invalid OTP.");
    if (new Date(data.reset_otp_expires) < new Date()) throw new Error("OTP has expired.");

    const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword, reset_otp: null, reset_otp_expires: null })
        .eq('id', data.id);
    
    if (updateError) throw updateError;
    
    return { message: "Your password has been reset successfully." };
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerOwner, registerStaffUser, logout, updateUser, requestPasswordReset, verifyOtpAndResetPassword, promptForPhone }}>
      {children}
      {modalInfo.isOpen && <PhoneLoginModal onLogin={loginOrRegisterWithPhone} onClose={() => setModalInfo({ isOpen: false })} />}
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
