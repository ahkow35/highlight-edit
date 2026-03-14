import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string, inviteCode: string) => Promise<void>;
    logout: () => Promise<void>;
    upgrade: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user on startup — cookie is sent automatically, just call /me
    useEffect(() => {
        const loadUser = async () => {
            try {
                const profile = await authApi.getMe();
                setUser(profile);
            } catch {
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (email: string, pass: string) => {
        await authApi.login(email, pass);
        const profile = await authApi.getMe();
        setUser(profile);
    };

    const signup = async (email: string, pass: string, inviteCode: string) => {
        await authApi.signup(email, pass, inviteCode);
        await login(email, pass);
    };

    const logout = async () => {
        await authApi.logout();
        setUser(null);
    };

    const upgrade = async () => {
        if (!user) return;
        const updatedUser = await authApi.upgrade();
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            signup,
            logout,
            upgrade,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
