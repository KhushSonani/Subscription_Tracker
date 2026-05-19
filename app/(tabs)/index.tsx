import "@/global.css"
import {Text, View, Image, FlatList} from "react-native";
import {Link} from "expo-router";
import images from '@/constants/images'
import {icons} from '@/constants/icons'
import {SafeAreaView as RNSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import {HOME_BALANCE, HOME_SUBSCRIPTIONS, HOME_USER, UPCOMING_SUBSCRIPTIONS} from "@/constants/data";
import {formatCurrency} from "@/lib/utils";
import dayjs from "dayjs";
import SubscriptionCard from "@/components/SubscriptionCard";
import ListHeading from "@/components/ListHeading";
import UpcomingSubscriptionCard from "@/components/UpcomingSubscriptionCard";
import {useState} from "react";
const SafeAreaView  = styled(RNSafeAreaView);

export default function App() {
    const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);
    return (
        <SafeAreaView className="flex-1 bg-background p-5">

            {/*<View className="flex-1">*/}
                <FlatList
                    ListHeaderComponent={() => (
                        <>
                            <View className="home-header">
                                <View className="home-user">
                                    <Image source={images.avatar} className="home-avatar" />
                                    <Text className="home-user-name">{HOME_USER.name}</Text>
                                </View>

                                <Image source={icons.add} className="home-add-icon" />
                            </View>

                            <View className="home-balance-card">
                                <Text className="home-balance-label"> Balance </Text>
                                <View className="home-balance-row">
                                    <Text className="home-balance-amount">
                                        {formatCurrency(HOME_BALANCE.amount)}
                                    </Text>
                                    <Text className="home-balance-date">
                                        {dayjs(HOME_BALANCE.nextRenewalDate).format('DD/MM')}
                                    </Text>
                                </View>
                            </View>

                            <View className="mb-5">
                                <ListHeading title="Upcoming"/>
                                <FlatList
                                    data={UPCOMING_SUBSCRIPTIONS}
                                    renderItem={({item}) => (<UpcomingSubscriptionCard {...item} />)}
                                    keyExtractor={(item) => item.id}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    ListEmptyComponent={<Text className="home-empty-state">No Upcoming renewals yet.</Text>}
                                />
                            </View>
                            <ListHeading title="All Subscription"/>
                        </>
                    )}
                    data={HOME_SUBSCRIPTIONS}
                    keyExtractor={(item) => item.id}
                    renderItem={({item}) => (
                        <SubscriptionCard
                            {...item}
                            expanded={expandedSubscriptionId === item.id}
                            onPress={() => setExpandedSubscriptionId((currentId) =>
                                (currentId === item.id ? null : item.id))}
                        />
                    )}
                    extraData={expandedSubscriptionId}
                    ItemSeparatorComponent={()=> <View className="h-4" />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <Text className="home-empty-state">No subscriptions yet. </Text>
                    }
                    contentContainerClassName="pb-30"
                />
            {/*</View>*/}
        </SafeAreaView>
    );
}