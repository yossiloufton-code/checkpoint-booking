import React from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./Layout.module.scss";

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.logo}>RoomBooking</div>

        <nav className={styles.navLinks}>
          {user && <Link to="/rooms">Rooms</Link>}
        </nav>

        <div className={styles.userSection}>
          {user ? (
            <>
              <span>{user.email}</span>
              <span className={styles.roleBadge}>
                {user.role === "GUEST" ? "Guest" : "Member"}
              </span>
              <button
                className={`${styles.button} ${styles["button--ghost"]}`}
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.button}>
                Login
              </Link>
              <Link
                to="/register"
                className={`${styles.button} ${styles["button--ghost"]}`}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};
