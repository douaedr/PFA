import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'
import HomeScreen from '../screens/HomeScreen'
import ProfileScreen from '../screens/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1e3a8a' },
        headerTintColor: 'white',
        headerTitleStyle: { fontWeight: '800', fontSize: 17 },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: { borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 4 },
      }}>
      <Tab.Screen name="Accueil" component={HomeScreen}
        options={{ tabBarIcon: ({color}) => <Text style={{fontSize:22, color}}>🏠</Text>,
          headerTitle: '🏥 MedSys — Tableau de bord' }} />
      <Tab.Screen name="Profil" component={ProfileScreen}
        options={{ tabBarIcon: ({color}) => <Text style={{fontSize:22, color}}>👤</Text>,
          headerTitle: '👤 Mon profil' }} />
    </Tab.Navigator>
  )
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}
