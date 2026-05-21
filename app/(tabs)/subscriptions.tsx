import SubscriptionCard from "@/components/SubscriptionCard";
import { useSubscriptions } from "@/context/SubscriptionsContext";
import { styled } from "nativewind";
import { useMemo, useState } from "react";
import {
    FlatList,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Subscriptions = () => {
    const { subscriptions } = useSubscriptions();
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return subscriptions;
        return subscriptions.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                s.category?.toLowerCase().includes(q) ||
                s.plan?.toLowerCase().includes(q) ||
                s.status?.toLowerCase().includes(q)
        );
    }, [query, subscriptions]);

    return (
        <SafeAreaView className="flex-1 bg-background px-5 pt-5">
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }}
                ItemSeparatorComponent={() => <View className="h-4" />}
                ListHeaderComponent={
                    <View className="subs-screen-header">
                        <Text className="subs-screen-title">Subscriptions</Text>

                        {/* Search bar */}
                        <View className="subs-search-wrap">
                            <Text className="subs-search-icon">🔍</Text>
                            <TextInput
                                className="subs-search-input"
                                placeholder="Search by name, category, status…"
                                placeholderTextColor="rgba(0,0,0,0.35)"
                                value={query}
                                onChangeText={setQuery}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="search"
                                clearButtonMode="never"
                            />
                            {query.length > 0 && (
                                <Pressable
                                    className="subs-search-clear"
                                    onPress={() => setQuery("")}
                                    accessibilityRole="button"
                                    accessibilityLabel="Clear search"
                                    hitSlop={8}
                                >
                                    <Text className="subs-search-clear-text">✕</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <SubscriptionCard
                        {...item}
                        expanded={expandedId === item.id}
                        onPress={() =>
                            setExpandedId((cur) => (cur === item.id ? null : item.id))
                        }
                    />
                )}
                extraData={expandedId}
                ListEmptyComponent={
                    <View className="subs-empty">
                        <Text className="subs-empty-title">No results found</Text>
                        <Text className="subs-empty-sub">
                            Try a different name, category, or status.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

export default Subscriptions;
