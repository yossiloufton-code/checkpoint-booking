// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { RoomsPage } from "./pages/RoomsPage";
import { BookingsPage } from "./pages/BookingsPage";
import { LoginPage } from "./pages/LoginPage"; // <- your login page
import { RoomsProvider } from "./context/RoomsContext";
import { BookingsProvider } from "./context/BookingsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import "./App.scss";

export default function App() {
  return (
    <Router>
      <RoomsProvider>
        <BookingsProvider>
          <MainLayout />
        </BookingsProvider>
      </RoomsProvider>
    </Router>
  );
}

function StartGate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/rooms" replace /> : <Navigate to="/login" replace />;
}

function MainLayout() {
  const { user, roleLabel, loginAsGuest, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAuthPage =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");

  return (
    <>
      <header className="app-header">
        <div className="logo" onClick={() => navigate("/rooms")}>StayBook</div>

        <nav className="main-nav">
          <NavLink
            to="/rooms"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Rooms
          </NavLink>

          <NavLink
            to="/bookings"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            My Bookings
          </NavLink>
        </nav>

        {/* Hide top-right actions while on the auth page */}
        {!isAuthPage && (
          <div className="auth-actions">
            {!user ? (
              <>
                <button
                  className="btn-secondary"
                  onClick={async () => {
                    await loginAsGuest();
                    navigate("/rooms");
                  }}
                >
                  Continue as Guest
                </button>
                <button className="btn-primary" onClick={() => navigate("/login")}>
                  Login
                </button>
              </>
            ) : (
              <div className="user-info">
                <span className={`user-chip ${roleLabel === "Member" ? "member" : "guest"}`}>
                  {roleLabel}
                </span>
                <button className="logout-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <Routes>
        {/* Start on login if not authenticated */}
        <Route path="/" element={<StartGate />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/rooms" element={<RoomsPage />} />

        <Route element={<ProtectedRoute allowGuest />}>
          <Route path="/bookings" element={<BookingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
