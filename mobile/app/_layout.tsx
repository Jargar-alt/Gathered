import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { addNotificationResponseListener } from '@/lib/notifications';

export { ErrorBoundary } from 'expo-router';

function RootLayoutNav() {
  const { user, profile, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'onboarding';

    const hasGroups = Boolean(profile?.groupIds?.length || profile?.groupId);

    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && !hasGroups && segments[0] !== 'onboarding') {
      router.replace('/onboarding');
    } else if (user && hasGroups && inAuthGroup) {
      router.replace('/(tabs)/calendar');
    }
  }, [user, profile, loading, segments]);

  useEffect(() => {
    const sub = addNotificationResponseListener((screen) => {
      if (screen === 'prayers') router.push('/(tabs)/prayers');
    });
    return () => sub.remove();
  }, [router]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#78716c" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf9',
  },
});
