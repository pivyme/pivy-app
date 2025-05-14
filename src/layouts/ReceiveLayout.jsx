import { Outlet } from "react-router";
import ReceiveWalletProvider from "../providers/ReceiveWalletProvider";
import PolkadotBackground from "@/components/shared/PolkadotBackground";

export default function ReceiveLayout() {
  console.log('receive layout')
  return (
    <div className="light">
      <ReceiveWalletProvider>
        <PolkadotBackground />
        <Outlet />
      </ReceiveWalletProvider>
    </div>
  );
}
