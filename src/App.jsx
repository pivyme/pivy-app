import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootProvider from "./providers/RootProvider";
import IndexLayout from "./layouts/IndexLayout";
import IndexPage from "./pages/IndexPage";
import { ProtectedRoute } from "./providers/AuthProvider";
import AppLayout from "./layouts/AppLayout";
import LoginPage from "./pages/LoginPage";
import AppHomePage from "./pages/app/AppHomePage";

// Helper function to check if we're on a subdomain
const isSubdomain = () => {
  const hostname = window.location.hostname;
  // Handle both localhost and production domains
  return (
    hostname.endsWith(".localhost") ||
    (hostname.split(".").length > 2 && hostname.split(".")[0] !== "www")
  );
};

// Get username from subdomain
const getSubdomainUsername = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  // Handle both localhost and production domains
  return hostname.endsWith(".localhost")
    ? parts[0]
    : parts.length > 2
    ? parts[0]
    : null;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: isSubdomain() ? <IndexLayout /> : <IndexPage />,
    children: isSubdomain() ? [
      {
        path: "",
        element: <IndexPage username={getSubdomainUsername() || "jordan"} />,
      },
    ] : undefined,
  },
  {
    path: "/app",
    element: <AppLayout />,
    children: [
      {
        path: "",
        element: (
          <ProtectedRoute>
            <AppHomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "receive/:username",
        element: <IndexPage />,
      },
    ],
  },
  {
    path: "*",
    element: <IndexPage />,
  },
]);

export default function App() {
  return (
    <RootProvider>
      <RouterProvider router={router} />
    </RootProvider>
  );
}
