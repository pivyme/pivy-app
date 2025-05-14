import Navbar from "@/components/app/Navbar";
import AppWalletProvider from "@/providers/AppWalletProvider";
import { Outlet, useNavigate } from "react-router-dom";
import { DashboardProvider } from '@/contexts/DashboardContext';
import { useAuth } from "@/providers/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import PolkadotBackground from "@/components/shared/PolkadotBackground";

export default function AppLayout() {
  const { isSignedIn } = useAuth();
  const { connected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (!connected && !isSignedIn) {
      navigate("/app/login");
    }
  }, [connected, isSignedIn, navigate]);

  return (
    <AppWalletProvider>
      <DashboardProvider>
        <PolkadotBackground />
        <Navbar />
        <div className="light">
          <Outlet />
        </div>
      </DashboardProvider>
    </AppWalletProvider>
  );
}
