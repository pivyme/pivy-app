import PolkadotBackground from "@/components/shared/PolkadotBackground";
import { Outlet } from "react-router";

export default function IndexLayout() {
  return (
    <div className="light">
      <PolkadotBackground />
      <Outlet />
    </div>
  );
}
