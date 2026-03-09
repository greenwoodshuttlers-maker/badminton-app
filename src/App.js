import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuth } from "./context/AuthContext";
import HistoryPage from "./pages/HistoryPage";
import UserManagementPage from "./pages/UserManagementPage";
import ProfilePage from "./pages/ProfilePage";
import Players from "./pages/Players";
import ClubExpensesDashboard from "./pages/ClubExpensesDashboard";
import BreakfastPage from "./pages/BreakfastPage";
import BreakfastHistoryPage from "./pages/BreakfastHistoryPage";
import JerseyVoting from "./pages/JerseyVoting";
import JerseyDashboard from "./pages/JerseyDashboard";
import JerseyOrder from "./pages/JerseyOrder";
import JerseyTop from "./pages/JerseyTop";
import PlayerPreferences from "./pages/PlayerPreferences";






function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <LoginPage />}
        />

        <Route
          path="/dashboard"
          element={user ? <DashboardPage /> : <Navigate to="/" />}
        />
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/" />}
        />
        <Route
          path="/profile/:userId"
          element={user ? <ProfilePage /> : <Navigate to="/" />}
        />

        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/players" element={<Players />} />
        <Route path="/club-expenses" element={<ClubExpensesDashboard />} />
        <Route path="/club-expenses/breakfast" element={<BreakfastPage />} />
        <Route path="/club-expenses/breakfast-history" element={<BreakfastHistoryPage />} />
        <Route path="/jersey-voting" element={<JerseyVoting />} />
        <Route path="/jersey-dashboard" element={<JerseyDashboard />} />
        <Route path="/jersey-order" element={<JerseyOrder />} />
        <Route path="/jersey-top" element={<JerseyTop />} />
        <Route path="/player-preferences" element={<PlayerPreferences />} />




      </Routes>
    </BrowserRouter>
  );
}

export default App;
