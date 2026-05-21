import { icons } from "@/constants/icons";
import clsx from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

type Frequency = "Monthly" | "Yearly";

const CATEGORIES = [
    "Entertainment",
    "AI Tools",
    "Developer Tools",
    "Design",
    "Productivity",
    "Cloud",
    "Music",
    "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

// One accent colour per category so new cards feel distinct
const CATEGORY_COLORS: Record<Category, string> = {
    Entertainment: "#f5c542",
    "AI Tools":     "#b8d4e3",
    "Developer Tools": "#e8def8",
    Design:         "#b8e8d0",
    Productivity:   "#fde8d8",
    Cloud:          "#d8eafd",
    Music:          "#8fd1bd",
    Other:          "#f6eecf",
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CreateSubscriptionModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (subscription: Subscription) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildSubscription = (
    name: string,
    priceStr: string,
    frequency: Frequency,
    category: Category
): Subscription => {
    const now = dayjs();
    const renewalDate =
        frequency === "Monthly"
            ? now.add(1, "month").toISOString()
            : now.add(1, "year").toISOString();

    return {
        id: `custom-${Date.now()}`,
        name: name.trim(),
        price: parseFloat(priceStr),
        currency: "INR",
        billing: frequency,
        category,
        status: "active",
        startDate: now.toISOString(),
        renewalDate,
        icon: icons.wallet,
        color: CATEGORY_COLORS[category],
    };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateSubscriptionModal({
    visible,
    onClose,
    onSubmit,
}: CreateSubscriptionModalProps) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [frequency, setFrequency] = useState<Frequency>("Monthly");
    const [category, setCategory] = useState<Category>("Other");

    const [nameError, setNameError] = useState("");
    const [priceError, setPriceError] = useState("");

    // ── Validation ────────────────────────────────────────────────────────────

    const validate = (): boolean => {
        let ok = true;
        if (!name.trim()) {
            setNameError("Name is required.");
            ok = false;
        } else {
            setNameError("");
        }
        const parsed = parseFloat(price);
        if (!price.trim()) {
            setPriceError("Price is required.");
            ok = false;
        } else if (isNaN(parsed) || parsed <= 0) {
            setPriceError("Enter a valid positive price.");
            ok = false;
        } else {
            setPriceError("");
        }
        return ok;
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit(buildSubscription(name, price, frequency, category));
        resetAndClose();
    };

    // ── Reset ─────────────────────────────────────────────────────────────────

    const resetAndClose = () => {
        setName("");
        setPrice("");
        setFrequency("Monthly");
        setCategory("Other");
        setNameError("");
        setPriceError("");
        onClose();
    };

    const canSubmit = name.trim().length > 0 && price.trim().length > 0;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={resetAndClose}
            statusBarTranslucent
        >
            <View className="modal-overlay">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="modal-container"
                >
                    {/* Header */}
                    <View className="modal-header">
                        <Text className="modal-title">New Subscription</Text>
                        <Pressable
                            className="modal-close"
                            onPress={resetAndClose}
                            accessibilityRole="button"
                            accessibilityLabel="Close modal"
                            hitSlop={8}
                        >
                            <Text className="modal-close-text">✕</Text>
                        </Pressable>
                    </View>

                    {/* Body */}
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 32 }}
                    >
                        <View className="modal-body">

                            {/* Name */}
                            <View className="auth-field">
                                <Text className="auth-label">Name</Text>
                                <TextInput
                                    className={clsx("auth-input", nameError && "auth-input-error")}
                                    placeholder="e.g. Netflix, Notion…"
                                    placeholderTextColor="rgba(0,0,0,0.35)"
                                    value={name}
                                    onChangeText={(v) => {
                                        setName(v);
                                        if (nameError) setNameError("");
                                    }}
                                    autoCapitalize="words"
                                    autoCorrect={false}
                                    returnKeyType="next"
                                />
                                {!!nameError && (
                                    <Text className="auth-error">{nameError}</Text>
                                )}
                            </View>

                            {/* Price */}
                            <View className="auth-field">
                                <Text className="auth-label">Price (₹)</Text>
                                <TextInput
                                    className={clsx("auth-input", priceError && "auth-input-error")}
                                    placeholder="0.00"
                                    placeholderTextColor="rgba(0,0,0,0.35)"
                                    value={price}
                                    onChangeText={(v) => {
                                        setPrice(v);
                                        if (priceError) setPriceError("");
                                    }}
                                    keyboardType="decimal-pad"
                                    returnKeyType="done"
                                />
                                {!!priceError && (
                                    <Text className="auth-error">{priceError}</Text>
                                )}
                            </View>

                            {/* Frequency */}
                            <View className="auth-field">
                                <Text className="auth-label">Billing frequency</Text>
                                <View className="picker-row">
                                    {(["Monthly", "Yearly"] as Frequency[]).map((f) => (
                                        <Pressable
                                            key={f}
                                            className={clsx(
                                                "picker-option",
                                                frequency === f && "picker-option-active"
                                            )}
                                            onPress={() => setFrequency(f)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ checked: frequency === f }}
                                        >
                                            <Text
                                                className={clsx(
                                                    "picker-option-text",
                                                    frequency === f && "picker-option-text-active"
                                                )}
                                            >
                                                {f}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Category */}
                            <View className="auth-field">
                                <Text className="auth-label">Category</Text>
                                <View className="category-scroll">
                                    {CATEGORIES.map((c) => (
                                        <Pressable
                                            key={c}
                                            className={clsx(
                                                "category-chip",
                                                category === c && "category-chip-active"
                                            )}
                                            onPress={() => setCategory(c)}
                                            accessibilityRole="radio"
                                            accessibilityState={{ checked: category === c }}
                                        >
                                            <Text
                                                className={clsx(
                                                    "category-chip-text",
                                                    category === c && "category-chip-text-active"
                                                )}
                                            >
                                                {c}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Submit */}
                            <Pressable
                                className={clsx(
                                    "auth-button",
                                    !canSubmit && "auth-button-disabled"
                                )}
                                onPress={handleSubmit}
                                disabled={!canSubmit}
                                accessibilityRole="button"
                                accessibilityLabel="Add subscription"
                            >
                                <Text className="auth-button-text">Add subscription</Text>
                            </Pressable>

                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}
