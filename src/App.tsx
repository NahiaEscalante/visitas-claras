import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Observaciones from "./pages/Observaciones";
import Calendario from "./pages/Calendario";
import Historial from "./pages/Historial";
import Ayuda from "./pages/Ayuda";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/observaciones" 
              element={
                <ProtectedRoute>
                  <Observaciones />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calendario" 
              element={
                <ProtectedRoute>
                  <Calendario />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/historial" 
              element={
                <ProtectedRoute>
                  <Historial />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/ayuda" 
              element={
                <ProtectedRoute>
                  <Ayuda />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
