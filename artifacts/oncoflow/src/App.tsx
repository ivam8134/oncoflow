import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PatientsList from "./pages/PatientsList";
import PatientProfile from "./pages/PatientProfile";
import AddPatient from "./pages/AddPatient";
import Notes from "./pages/Notes";
import AISummary from "./pages/AISummary";
import Exports from "./pages/Exports";
import { AppLayout } from "./components/layout/AppLayout";
import { RequireAuth } from "./components/RequireAuth";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>
      </Route>
      <Route path="/patients">
        <RequireAuth><AppLayout><PatientsList /></AppLayout></RequireAuth>
      </Route>
      <Route path="/patients/:id">
        <RequireAuth><AppLayout><PatientProfile /></AppLayout></RequireAuth>
      </Route>
      <Route path="/add-patient">
        <RequireAuth><AppLayout><AddPatient /></AppLayout></RequireAuth>
      </Route>
      <Route path="/notes">
        <RequireAuth><AppLayout><Notes /></AppLayout></RequireAuth>
      </Route>
      <Route path="/ai-summary">
        <RequireAuth><AppLayout><AISummary /></AppLayout></RequireAuth>
      </Route>
      <Route path="/exports">
        <RequireAuth><AppLayout><Exports /></AppLayout></RequireAuth>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <AppRoutes />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
