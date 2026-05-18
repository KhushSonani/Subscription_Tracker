import { View, Text } from 'react-native';
import { Link, useLocalSearchParams } from "expo-router";

const SubscriptionsDetails = () => {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <View>
            <Text>Subscriptions Details: {id}</Text>

            <Link href="/"> Go Back </Link>
        </View>
    );
};

export default SubscriptionsDetails;