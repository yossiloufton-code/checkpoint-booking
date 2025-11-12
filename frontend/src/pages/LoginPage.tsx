// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./AuthPage.module.scss";

export const LoginPage: React.FC = () => {
  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: Location } };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [guestSubmitting, setGuestSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || "/rooms";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Invalid email or password";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGuestLogin() {
    setGuestSubmitting(true);
    try {
      await loginAsGuest();
      toast.success("Logged in as guest");
      navigate("/rooms", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Failed to log in as guest");
    } finally {
      setGuestSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Log in</h1>
        <p className={styles.subtitle}>
          Access your room bookings and manage reservations.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={submitting}
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <button
          type="button"
          className={styles.primaryButton}
          style={{ background: "#6b7280", marginTop: "0.5rem" }}
          onClick={handleGuestLogin}
          disabled={guestSubmitting}
        >
          {guestSubmitting ? "Entering as guest…" : "Continue as guest"}
        </button>

        <div className={styles.footer}>
          <span>Don&apos;t have an account?</span>
          <Link className={styles.footerLink} to="/register">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};
