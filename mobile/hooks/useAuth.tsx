import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext,useMemo,useEffect, useState } from "react";

const AUTH_KEY = "citysync.userId.v1";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; userId: number };

type AuthContextType = {// for components
    auth: AuthState;
    login: (userId: number) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }){
    const [auth, setAuth] = useState<AuthState>({ status: "loading"});

    useEffect(() => {//to check if user logged in
        AsyncStorage.getItem(AUTH_KEY).then((val) => {
            if (val) {
                setAuth({ status: "authenticated", userId: Number(val) });
            } else {
                setAuth({ status: "unauthenticated" })
            }
           });
    }, []);

    async function login(userId: number) {
        await AsyncStorage.setItem(AUTH_KEY, String(userId));
        setAuth({ status: "authenticated", userId });
    }

    async function logout() {
        await AsyncStorage.removeItem(AUTH_KEY);
        setAuth({ status: "unauthenticated" });
    }

    const value = useMemo(() => ({ auth, login, logout}), [auth]);

    return <AuthContext.Provider value = {value}>{children}</AuthContext.Provider>;
    }

/**auth hook
 *on mount checks asyncStorage for a persisted userId
 *login(userId) saves to asyncstorage, updates state
 *logout() clears asyncStorage, resets state
 */
export function useAuth() {
    const ctx = useContext(AuthContext);

    if(!ctx){
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return ctx;
  };

