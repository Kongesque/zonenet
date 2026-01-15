"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    setupComplete: boolean | null;
    login: (password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    setup: (password: string, confirmPassword: string) => Promise<{ success: boolean; error?: string }>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [setupComplete, setSetupComplete] = useState<boolean | null>(null);
    const router = useRouter();

    const checkSetupStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/status`, {
                credentials: "include",
            });
            if (response.ok) {
                const data = await response.json();
                setSetupComplete(data.setup_complete);
                return data.setup_complete;
            }
        } catch {
            console.error("Failed to check setup status");
        }
        return null;
    };

    const checkAuth = async () => {
        try {
            // Run both requests in parallel to eliminate waterfall
            const [statusResponse, authResponse] = await Promise.all([
                fetch(`${API_URL}/api/auth/status`, { credentials: "include" }),
                fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
            ]);

            // Process setup status
            if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                setSetupComplete(statusData.setup_complete);

                if (!statusData.setup_complete) {
                    setIsAuthenticated(false);
                    setIsLoading(false);
                    return;
                }
            } else {
                setSetupComplete(null);
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            // Process auth status (only if setup is complete)
            setIsAuthenticated(authResponse.ok);
        } catch {
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (password: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password }),
            });

            if (response.ok) {
                setIsAuthenticated(true);
                return { success: true };
            }

            const data = await response.json();
            return { success: false, error: data.detail || "Invalid password" };
        } catch {
            return { success: false, error: "Connection error" };
        }
    };

    const setup = async (password: string, confirmPassword: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/setup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ password, confirm_password: confirmPassword }),
            });

            if (response.ok) {
                setIsAuthenticated(true);
                setSetupComplete(true);
                return { success: true };
            }

            const data = await response.json();
            return { success: false, error: data.detail || "Setup failed" };
        } catch {
            return { success: false, error: "Connection error" };
        }
    };

    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } finally {
            setIsAuthenticated(false);
            router.push("/login");
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isLoading,
            setupComplete,
            login,
            logout,
            setup,
            checkAuth
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
