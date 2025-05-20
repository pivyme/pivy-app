import PolkadotBackground from "@/components/shared/PolkadotBackground";
import { Outlet } from "react-router-dom";

export default function LandingLayout() {
  return (
    <>
      <div id="portal-root" />
      <div className="light">
        <PolkadotBackground className="opacity-50" />

        <Outlet />
      </div>
    </>
  );
} 