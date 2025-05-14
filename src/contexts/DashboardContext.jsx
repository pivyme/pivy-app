// DashboardContext.js
import { useAuth } from "@/providers/AuthProvider";
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";


const DashboardContext = createContext({
  profile: null,
  isLoading: false,
  selectedReceive: "",
  refreshSelectedReceiveAddress: () => {},
  balances: null,
  histories: null ,
});

let lastRefreshTime = 0;

export function DashboardProvider({ children }) {
  const { accessToken, me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState(null);
  const [histories, setHistories] = useState(null);
  const [selectedReceive, setSelectedReceive] = useState("");
  const [isLoadingSelectedReceive, setIsLoadingSelectedReceive] = useState(false);

  // Add function to fetch address
  const fetchAddress = async () => {
    if (!me?.username || !accessToken) return;

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/address/get-address/${me.username}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSelectedReceive(data.address);
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  // Initial fetch of address
  useEffect(() => {
    fetchAddress();
  }, [me?.username, accessToken]);

  const refreshSelectedReceiveAddress = async () => {
    const now = Date.now();
    if (now - lastRefreshTime < 2000) {
      return;
    }

    try {
      setIsLoadingSelectedReceive(true);
      lastRefreshTime = now;
      await fetchAddress();
    } catch (error) {
      console.error("Error refreshing selected receive address:", error);
    } finally {
      setIsLoadingSelectedReceive(false);
    }
  };

  const handleGetBalances = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/user/wallet/balances`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Balances response:", data);
      setBalances(data);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  const handleGetHistories = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/user/wallet/transactions`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            limit: 20,
            offset: 0,
          },
        }
      );

      setHistories(data.transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    // Initial fetch of both balances and histories
    handleGetBalances();
    handleGetHistories();

    // Refresh balances every 15 seconds
    const balancesInterval = setInterval(handleGetBalances, 15000);
    
    // Refresh histories every 5 seconds
    const historiesInterval = setInterval(handleGetHistories, 5000);

    return () => {
      clearInterval(balancesInterval);
      clearInterval(historiesInterval);
    };
  }, [accessToken]);

  const value = {
    profile,
    isLoading,
    selectedReceive,
    refreshSelectedReceiveAddress,
    balances,
    histories,
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
