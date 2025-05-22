// DashboardContext.js
import { useAuth } from "@/providers/AuthProvider";
import { sleep } from "@/utils/process";
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";


const DashboardContext = createContext({
  profile: null,
  isLoading: false,
  selectedReceive: "",
  refreshSelectedReceiveAddress: () => { },
  balances: null,
  activities: null,
});

let lastRefreshTime = 0;

export function DashboardProvider({ children }) {
  const { accessToken, me, walletChainId } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState(null);
  const [activities, setActivities] = useState(null);

  const handleGetBalances = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/user/balances`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            chain: walletChainId
          }
        }
      );

      setBalances(data);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const handleGetActivities = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/user/activities`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            chain: walletChainId
          },
        }
      );

      setActivities(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    // Initial fetch of both balances and activities
    handleGetBalances();
    handleGetActivities();

    // Refresh balances every 15 seconds
    const balancesInterval = setInterval(handleGetBalances, 5000);

    // Refresh activities every 5 seconds
    const activitiesInterval = setInterval(handleGetActivities, 5000);

    return () => {
      clearInterval(balancesInterval);
      clearInterval(activitiesInterval);
    };
  }, [accessToken]);

  const value = {
    profile,
    isLoading,
    balances,
    activities,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
