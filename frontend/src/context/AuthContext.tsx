import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    signup: (email: string, pass: string, inviteCode: string) => Promise<void>;
    logout: () => void;
    upgrade: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user on startup if token exists
    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const profile = await authApi.getMe();
                    setUser(profile);
                } catch (error) {
                    console.error("Failed to load user profile", error);
                    localStorage.removeItem('token');
                }
            }
            setIsLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email: string, pass: string) => {
        const { access_token } = await authApi.login(email, pass);
        localStorage.setItem('token', access_token);
        const profile = await authApi.getMe();
        setUser(profile);
    };

    const signup = async (email: string, pass: string, inviteCode: string) => {
        await authApi.signup(email, pass, inviteCode);
        // Auto login after signup
        await login(email, pass);
    };

    const logout = () => {
        localStorage.removeItem('token');
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
            upgrade
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
