import { View,Text } from 'react-native'
import {Link} from 'expo-router'
import React from 'react'
const SignUp = () => {
    return (
        <View>
            <Text>Create Account</Text>
            <Link href="/(auth)/sign-in">Sign In</Link>
        </View>
    )
}
export default SignUp;
