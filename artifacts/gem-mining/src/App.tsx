import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useGetMe } from "@workspace/api-client-react";

import { Layout } from "@/components/Layout";
import { Web3WalletProvider } from "@/lib/web3Wallet";
import Auth from "@/pages/Auth";
import Mining from "@/pages/Mining";
import Wallet from "@/pages/Wallet";
import Referral from "@/pages/Referral";
import Profile from "@/pages/Profile";
import Verify from "@/pages/Verify";
import Admin from "@/pages/Admin";
import EixPage from "@/pages/EixPage";
import PowerCardsPage from "@/pages/PowerCardsPage";
import AirdropPage from "@/pages/AirdropPage";
import ProjectApplyPage from "@/pages/ProjectApplyPage";
import NotFound from "@/pages/not-found";

// Global fetch interceptor — injects JWT and handles 401s.
// Uses the Headers constructor to clone existing headers safely;
// spreading a Headers object with {...} drops all its entries.
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem("etr_token");
  if (token && typeof input === "string" && input.startsWith("/api/")) {
    init = { ...(init || {}) };
    const merged = new Headers(init.headers as HeadersInit | undefined);
    merged.set("Authorization", `Bearer ${token}`);
    init.headers = merged;
  }
  const response = await originalFetch(input, init);
  if (
    response.status === 401 &&
    window.location.pathname !== "/login" &&
    window.location.pathname !== "/signup"
  ) {
    localStorage.removeItem("etr_token");
    window.dispatchEvent(new Event("auth-unauthorized"));
  }
  return response;
};

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

function Redirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(to); }, [to, setLocation]);
  return null;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
      <p className="text-muted-foreground text-sm tracking-widest uppercase animate-pulse">Loading…</p>
    </div>
  );
}

// Flat auth guard — avoids wouter v3 nested-route path-stripping by keeping
// all routes at the top-level Switch instead of inside a catch-all.
function RequireAuth({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false } });
  if (isLoading) return <LoadingScreen />;
  if (error || !user) return <Redirect to="/login" />;
  return (
    <Layout user={user}>
      <Component />
    </Layout>
  );
}

function RequireAdmin({ component: Component }: { component: React.ComponentType }) {
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false } });
  if (isLoading) return <LoadingScreen />;
  if (error || !user) return <Redirect to="/login" />;
  if (!user.isAdmin) return <Redirect to="/mining" />;
  return (
    <Layout user={user}>
      <Component />
    </Layout>
  );
}

function Router() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = () => setLocation("/login");
    window.addEventListener("auth-unauthorized", handler);
    return () => window.removeEventListener("auth-unauthorized", handler);
  }, [setLocation]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login"><Auth mode="login" /></Route>
      <Route path="/signup"><Auth mode="signup" /></Route>
      <Route path="/recovery"><Auth mode="recovery" /></Route>

      {/* Protected routes */}
      <Route path="/mining"><RequireAuth component={Mining} /></Route>
      <Route path="/wallet"><RequireAuth component={Wallet} /></Route>
      <Route path="/referral"><RequireAuth component={Referral} /></Route>
      <Route path="/profile"><RequireAuth component={Profile} /></Route>
      <Route path="/verify"><RequireAuth component={Verify} /></Route>
      <Route path="/eix"><RequireAuth component={EixPage} /></Route>
      <Route path="/power-cards"><RequireAuth component={PowerCardsPage} /></Route>
      <Route path="/airdrop"><RequireAuth component={AirdropPage} /></Route>
      <Route path="/projects/apply"><RequireAuth component={ProjectApplyPage} /></Route>
      <Route path="/admin"><RequireAdmin component={Admin} /></Route>

      {/* Legacy redirects */}
      <Route path="/levels"><Redirect to="/power-cards" /></Route>
      <Route path="/convert"><Redirect to="/wallet" /></Route>
      <Route path="/wallet/convert"><Redirect to="/wallet" /></Route>
      <Route path="/wallet/usdt"><Redirect to="/eix" /></Route>
      <Route path="/wallet/usdt/deposit"><Redirect to="/eix" /></Route>
      <Route path="/wallet/etr"><Redirect to="/wallet" /></Route>
      <Route path="/wallet/deposit-address"><Redirect to="/eix" /></Route>
      <Route path="/wallet/receive"><Redirect to="/eix" /></Route>
      <Route path="/deposit"><Redirect to="/eix" /></Route>
      <Route path="/withdraw"><Redirect to="/wallet" /></Route>
      <Route path="/dashboard"><Redirect to="/mining" /></Route>
      <Route path="/"><Redirect to="/mining" /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3WalletProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster
          position="top-center"
          gap={10}
          toastOptions={{
            unstyled: true,
            style: { padding: 0, margin: 0, background: "transparent", border: "none", boxShadow: "none" },
          }}
        />
      </Web3WalletProvider>
    </QueryClientProvider>
  );
}
