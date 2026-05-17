import { View,Text } from 'react-native'
import {Link} from 'expo-router'
import React from 'react'
const SignIn = () => {
    return (
        <View>
            <Text>Sign In</Text>
            <Link href="/(auth)/sign-up">Create Account</Link>
        </View>
    )
}
export default SignIn
