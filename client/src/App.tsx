import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import SamagamDetails from "@/pages/samagam-details";
import RecordedSamagamsPage from "@/pages/recorded-samagams";
import LocationsPage from "@/pages/locations";
import LangarSewaPage from "@/pages/langar-sewa";
import BroadcastPage from "@/pages/broadcast";
import GurmatCamp from "@/pages/gurmat-camp";
import MediaPage from "@/pages/media-page";
import CalendarPage from "@/pages/calendar-page";
import { AuthProvider } from "@/hooks/use-auth";
import { SocketProvider } from "@/hooks/use-socket";
import { ProtectedRoute } from "./lib/protected-route";
import { SplashScreen } from "@/components/splash-screen";
import { BackgroundMusic } from "@/components/background-music";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      {/* Restore original homepage */}
      <Route path="/" component={HomePage} />
      <Route path="/samagam/:id" component={SamagamDetails} />
      <Route path="/recorded-samagams" component={RecordedSamagamsPage} />
      <Route path="/media" component={MediaPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/gurmat-camp" component={GurmatCamp} />
      <Route path="/locations" component={LocationsPage} />
      <Route path="/langar-sewa" component={LangarSewaPage} />
      <Route path="/broadcast" component={BroadcastPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {/* Background music starts immediately and plays throughout the app */}
      <BackgroundMusic />
      
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SocketProvider>
              <Router />
              <Toaster />
            </SocketProvider>
          </AuthProvider>
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;
