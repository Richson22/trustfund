import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Send from "./pages/Send";
import Receive from "./pages/Receive";
import AssetDetail from "./pages/AssetDetail";
import Swap from "./pages/Swap";
import Settings from "./pages/Settings";
import Security from "./pages/Security";
import TransactionHistory from "./pages/Transactionhistory";
import NftGallery from "./pages/Nftgallery";
import NftDetail from "./pages/NftDetail";
import Earn from "./pages/Earn";
import Discover from "./pages/Discover";
import ImportWallet from "./pages/Importwallet";
import BuySell from "./pages/BuySell";
import AppLayout from "./components/AppLayout";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

function AssetDetailWrapper() {
  const { symbol } = useParams();
  return <AssetDetail symbol={symbol.toUpperCase()} />;
}

function NftDetailWrapper() {
  const { id } = useParams();
  return <NftDetail id={id} />;
}

// Shared sidebar for every protected page
function SidebarLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

// Logged-in users visiting /login go to where they were headed (or the dashboard)
function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  return isAuthenticated ? <Navigate to={from} replace /> : children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Public pages ── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/import-wallet" element={<ImportWallet />} />

          {/* ── Protected pages (login required) WITH the sidebar ── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<SidebarLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/send" element={<Send />} />
              <Route path="/receive" element={<Receive />} />
              <Route path="/swap" element={<Swap />} />
              <Route path="/buy-sell" element={<BuySell />} />
              <Route path="/earn" element={<Earn />} />
                           <Route path="/discover" element={<Discover />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/security" element={<Security />} />
              <Route path="/nft" element={<NftGallery />} />
              <Route path="/nft/:id" element={<NftDetailWrapper />} />
              <Route path="/transactionhistory" element={<TransactionHistory />} />
              <Route path="/asset/:symbol" element={<AssetDetailWrapper />} />
            </Route>
          </Route>

          {/* Anything unknown goes home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;