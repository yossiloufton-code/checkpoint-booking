import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./AuthPage.module.scss";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"GUEST" | "MEMBER">("MEMBER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password, role);
      toast.success("Account created! You are now logged in.");
      navigate("/rooms");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Registration failed, try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Sign up</h1>
        <p className={styles.subtitle}>
          Choose your role and start booking rooms.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Role selector */}
          <div className={styles.field}>
            <span className={styles.label}>Role</span>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.85rem" }}>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="MEMBER"
                  checked={role === "MEMBER"}
                  onChange={() => setRole("MEMBER")}
                />{" "}
                Member (longer booking window)
              </label>
              <label>
                <input
                  type="radio"
                  name="role"
                  value="GUEST"
                  checked={role === "GUEST"}
                  onChange={() => setRole("GUEST")}
                />{" "}
                Guest
              </label>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className={styles.footer}>
          <span>Already have an account?</span>
          <Link className={styles.footerLink} to="/login">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};
