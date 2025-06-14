import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootProvider from "./providers/RootProvider";
import { ProtectedRoute } from "./providers/AuthProvider";
import AppLayout from "./layouts/AppLayout";
import LandingLayout from "./layouts/LandingLayout";
import LoginPage from "./pages/LoginPage";
import AppHomePage from "./pages/app/AppHomePage";
import AppAlertPage from "./pages/app/AppAlertPage";
import AppLinkPage from "./pages/app/AppLinkPage";
import ReceivePage from "./pages/ReceivePage";
import ReceiveLayout from "./layouts/ReceiveLayout";
import IndexPage from "./pages/IndexPage";

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

// Extract tag from path for subdomain routes
const getTagFromPath = () => {
  const pathname = window.location.pathname;
  return pathname.startsWith('/') ? pathname.slice(1) : pathname;
};

const router = createBrowserRouter([
  {
    path: "/landing",
    element: <LandingLayout />,
    children: [
      {
        path: "",
        element: <IndexPage />,
      }
    ]
  },
  {
    path: "/",
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
        path: "links",
        element: (
          <ProtectedRoute>
            <AppLinkPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "alerts",
        element: (
          <ProtectedRoute>
            <AppAlertPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      }
    ],
  },
  {
    path: "/:username",
    element: <ReceiveLayout />,
    children: [
      {
        path: "",
        element: <ReceivePage />,
      },
      {
        path: ":tag",
        element: <ReceivePage />,
      }
    ],
  },
]);

export default function App() {
  return (
    <RootProvider>
      <RouterProvider router={router} />
    </RootProvider>
  );
}
