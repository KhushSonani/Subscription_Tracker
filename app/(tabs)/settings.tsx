import { useClerk } from "@clerk/expo";
import { useRouter } from "expo-router";
import { styled } from "nativewind";
import { Pressable, Text } from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
    const { signOut } = useClerk();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.replace("/(auth)/sign-in");
    };

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <Text className="text-2xl font-sans-bold text-primary mb-8">Settings</Text>

            <Pressable
                onPress={handleSignOut}
                className="items-center rounded-2xl bg-accent py-4"
                accessibilityRole="button"
                accessibilityLabel="Sign out"
            >
                <Text className="text-base font-sans-bold text-background">Sign out</Text>
            </Pressable>
        </SafeAreaView>
    );
};

export default Settings;
