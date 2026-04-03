// Polyfills
import "./src/polyfills";
import { useState } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConnectionProvider } from "./src/utils/ConnectionProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import {
  PaperProvider,
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
} from "react-native-paper";
import { AppNavigator } from "./src/navigators/AppNavigator";
import { ClusterProvider } from "./src/components/cluster/cluster-data-access";
import { LanguageProvider } from "./src/context/LanguageContext";
import { SplashScreen } from "./src/screens/SplashScreen";

const queryClient = new QueryClient();

export default function App() {
  const colorScheme = useColorScheme();
  const [splashDone, setSplashDone] = useState(false);

  const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });
  const CombinedDefaultTheme = {
    ...MD3LightTheme,
    ...LightTheme,
    colors: { ...MD3LightTheme.colors, ...LightTheme.colors },
  };
  const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: { ...MD3DarkTheme.colors, ...DarkTheme.colors },
  };

  if (!splashDone) {
    return <SplashScreen onFinish={() => setSplashDone(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClusterProvider>
        <ConnectionProvider config={{ commitment: "processed" }}>
          <LanguageProvider>
            <SafeAreaView
              style={[
                styles.shell,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? MD3DarkTheme.colors.background
                      : MD3LightTheme.colors.background,
                },
              ]}
            >
              <PaperProvider
                theme={colorScheme === "dark" ? CombinedDarkTheme : CombinedDefaultTheme}
              >
                <AppNavigator />
              </PaperProvider>
            </SafeAreaView>
          </LanguageProvider>
        </ConnectionProvider>
      </ClusterProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1 },
});
