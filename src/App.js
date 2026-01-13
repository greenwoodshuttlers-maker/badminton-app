import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import { useAuth } from "./context/AuthContext";
import HistoryPage from "./pages/HistoryPage";
import UserManagementPage from "./pages/UserManagementPage";
import ProfilePage from "./pages/ProfilePage";
import Players from "./pages/Players";





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
        <Route path="/history" element={<HistoryPage />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/players" element={<Players />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
