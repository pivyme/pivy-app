import Navbar from "@/components/app/Navbar";
import AppWalletProvider from "@/providers/AppWalletProvider";
import { Outlet, useNavigate } from "react-router-dom";
import { DashboardProvider } from '@/contexts/DashboardContext';
import { useAuth } from "@/providers/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import PolkadotBackground from "@/components/shared/PolkadotBackground";
import BottomBar from "@/components/app/BottomBar";
import CreateLinkModal from "@/components/app/CreateLinkModal";

export default function AppLayout() {
  const { isSignedIn } = useAuth();
  const { connected } = useWallet();
  const navigate = useNavigate();

  // useEffect(() => {
  //   // Only redirect if we're sure the user is not authenticated
  //   if (!connected && !isSignedIn) {
  //     navigate("/login");
  //   }
  // }, [connected, isSignedIn, navigate]);

  const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false)
  console.log({
    isCreateLinkModalOpen
  })

  return (
    <AppWalletProvider>
      <DashboardProvider>
        {/* Portal root for modals */}
        <div id="portal-root" />
        
        <PolkadotBackground />
        <Navbar />
        <BottomBar
          isCreateLinkModalOpen={isCreateLinkModalOpen}
          setIsCreateLinkModalOpen={setIsCreateLinkModalOpen}
        />
        <CreateLinkModal
          open={isCreateLinkModalOpen}
          onClose={() => setIsCreateLinkModalOpen(false)}
        />
        <div className="light">
          <Outlet />
        </div>
      </DashboardProvider>
    </AppWalletProvider>
  );
}
