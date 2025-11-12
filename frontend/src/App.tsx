import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { RoomsPage } from "./pages/RoomsPage";
import { BookingsPage } from "./pages/BookingsPage";
import { LoginPage } from "./pages/LoginPage";
import { RoomsProvider } from "./context/RoomsContext";
import { BookingsProvider } from "./context/BookingsContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import React from "react";
import "./App.scss";

export default function App() {
  return (
    <Router>
      <RoomsProvider>
        {/* <BookingsProvider> */}
          <MainLayout />
        {/* </BookingsProvider> */}
      </RoomsProvider>
    </Router>
  );
}

function StartGate() {
  return <Navigate to="/rooms" replace />;
}

function EnsureSession({ children }: { children: React.ReactNode }) {
  const { user, loading, loginAsGuest } = useAuth();
  const [booting, setBooting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user && !booting) {
      setBooting(true);
      (async () => {
        try {
          await loginAsGuest(); 
        } finally {
          setBooting(false);
        }
      })();
    }
  }, [loading, user, booting, loginAsGuest]);

  if (loading || (!user && booting)) return null;

  return <>{children}</>;
}

function MainLayout() {
  const { user, roleLabel, logout } = useAuth();
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

        {!isAuthPage && (
          <div className="auth-actions">
            {!user ? (
              <button className="btn-primary" onClick={() => navigate("/login")}>
                Login
              </button>
            ) : (
              <div className="user-info">
                <span className={`user-chip ${roleLabel === "Member" ? "member" : "guest"}`}>
                  {roleLabel}
                </span>
                <button
                  className="logout-btn"
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <Routes>
        <Route path="/" element={<StartGate />} />

        {/* Explicit auth route: does NOT auto-guest */}
        <Route path="/login" element={<LoginPage />} />

        {/* Everything inside EnsureSession requires a session. If not present, we auto guest. */}
        <Route
          path="/rooms"
          element={
            <EnsureSession>
              <RoomsPage />
            </EnsureSession>
          }
        />

        <Route
          element={
            <EnsureSession>
              <ProtectedRoute allowGuest />
            </EnsureSession>
          }
        >
          <Route path="/bookings" element={
            <BookingsProvider>
              <BookingsPage />
            </BookingsProvider>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
