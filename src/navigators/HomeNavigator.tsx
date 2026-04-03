import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { TopBar } from "../components/top-bar/top-bar-feature";
import { GameScreen } from "../screens/GameScreen";
import { LeaderboardScreen } from "../screens/LeaderboardScreen";
import { ProgressScreen } from "../screens/ProgressScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { RecordsScreen } from "../screens/RecordsScreen";
import { useGameStats } from "../hooks/useGameStats";
import { usePlayerProgress } from "../hooks/usePlayerProgress";
import { useAuthorization } from "../utils/useAuthorization";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";

const Tab = createBottomTabNavigator();

export function HomeNavigator() {
  const { selectedAccount } = useAuthorization();
  const walletAddress = selectedAccount?.publicKey.toBase58() ?? null;
  const { stats } = useGameStats(walletAddress);
  const { progress } = usePlayerProgress(walletAddress);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <TopBar />,
        tabBarActiveTintColor: '#9945FF',
        tabBarInactiveTintColor: '#444',
        tabBarStyle: { backgroundColor: '#0a0a0f', borderTopColor: '#1a1a2e' },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarIcon: ({ focused, color, size }) => {
          switch (route.name) {
            case "Game":
              return <MaterialCommunityIcon name={focused ? "dice-6" : "dice-6-outline"} size={size} color={color} />;
            case "Leaderboard":
              return <MaterialCommunityIcon name={focused ? "trophy" : "trophy-outline"} size={size} color={color} />;
            case "Records":
              return <MaterialCommunityIcon name={focused ? "medal" : "medal-outline"} size={size} color={color} />;
            case "Progress":
              return <MaterialCommunityIcon name={focused ? "star-circle" : "star-circle-outline"} size={size} color={color} />;
            case "Profile":
              return <MaterialCommunityIcon name={focused ? "account-circle" : "account-circle-outline"} size={size} color={color} />;
            case "Settings":
              return <MaterialCommunityIcon name={focused ? "cog" : "cog-outline"} size={size} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Game" component={GameScreen} />
      <Tab.Screen name="Leaderboard">
        {() => <LeaderboardScreen stats={stats} walletAddress={walletAddress} />}
      </Tab.Screen>
      <Tab.Screen name="Records">
        {() => <RecordsScreen walletAddress={walletAddress} />}
      </Tab.Screen>
      <Tab.Screen name="Progress">
        {() => <ProgressScreen progress={progress} walletAddress={walletAddress} />}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
