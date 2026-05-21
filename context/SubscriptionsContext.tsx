import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { createContext, useContext, useState, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubscriptionsContextValue {
    subscriptions: Subscription[];
    addSubscription: (sub: Subscription) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SubscriptionsContext = createContext<SubscriptionsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>(HOME_SUBSCRIPTIONS);

    const addSubscription = (sub: Subscription) => {
        setSubscriptions((prev) => [sub, ...prev]);
    };

    return (
        <SubscriptionsContext.Provider value={{ subscriptions, addSubscription }}>
            {children}
        </SubscriptionsContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSubscriptions(): SubscriptionsContextValue {
    const ctx = useContext(SubscriptionsContext);
    if (!ctx) throw new Error("useSubscriptions must be used inside SubscriptionsProvider");
    return ctx;
}
