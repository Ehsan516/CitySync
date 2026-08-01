import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/hooks/useAuth';
import LoginScreen from '@/components/LoginScreen';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
  //^tab group is main navigation anch
};

SplashScreen.preventAutoHideAsync();

function AppGate() {
  const { auth, login } = useAuth();
  const { scheme, colors } = useTheme();

  useEffect(() => {SplashScreen.hideAsync();}, []);//hides once layout has mounted


  if (auth.status === 'loading'){//loading spinner while onboarding checked
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (auth.status === 'unauthenticated') {
    return <LoginScreen onLogin={login} />;//login screen if not logged in
  }

  return (//shows app if logged in
    <NavThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/*main tab app screen*/}
        <Stack.Screen name = "onboarding" options ={{ headerShown: false}}/>
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="+not-found" />
        {/*fallback screen for any other outes*/}
      </Stack>

    </NavThemeProvider>
  );
}

  export default function RootLayout() {//making auth global by wrapping on app
    const [fontsLoaded] = useFonts({
      PlusJakartaSans_400Regular,
      PlusJakartaSans_500Medium,
      PlusJakartaSans_600SemiBold,
      PlusJakartaSans_700Bold,
      PlusJakartaSans_800ExtraBold,
    });

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider>
                <AuthProvider>
                    {fontsLoaded ? <AppGate /> : null}
                </AuthProvider>
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
