import LenisSmoothScrollProvider from "@/providers/LenisSmoothScrollProvider";
import WebstarterOnboarding from "@/components/WebstarterOnboarding";
import LoginPage from "./LoginPage";

export default function IndexPage() {
  return (
    <>
      <LenisSmoothScrollProvider />
      <LoginPage />
    </>
  );
}
