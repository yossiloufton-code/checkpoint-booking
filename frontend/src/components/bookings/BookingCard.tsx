import React, { useEffect, useMemo, useState } from "react";
import type { Booking } from "../../api/bookings";
import styles from "../../pages/RoomsPage.module.scss";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function useCountdown(expiresAt?: string | null) {
  const [left, setLeft] = useState<number>(() => {
    if (!expiresAt) return 0;
    return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
  });
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const s = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setLeft(s);
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [expiresAt]);
  return left;
}

export const BookingCard: React.FC<{
  booking: Booking;
  onCancel?: (id: string) => void;
  onConfirm?: (id: string) => void;            // <-- ADD
  cancelLoading?: boolean;
  confirmLoading?: boolean;                    // <-- ADD
}> = ({ booking, onCancel, onConfirm, cancelLoading, confirmLoading }) => {
  const { room, startTime, endTime, status, expiresAt, id } = booking;
  const secondsLeft = useCountdown(expiresAt);
  const canConfirm = status === "PENDING" && !!expiresAt && secondsLeft > 0;

  const statusEl = useMemo(() => {
    if (status === "CONFIRMED") return <span style={{ color: "#16a34a" }}>CONFIRMED</span>;
    if (status === "CANCELLED") return <span style={{ color: "#dc2626" }}>CANCELLED</span>;
    // PENDING
    return (
      <span style={{ color: "#f59e0b" }}>
        PENDING{canConfirm ? ` · ${secondsLeft}s` : " · expired"}
      </span>
    );
  }, [status, canConfirm, secondsLeft]);

  return (
    <article className={styles.roomCard}>
      <header className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>{room?.name ?? booking.roomName}</h2>
          <div className={styles.cardLocation}>
            {(room?.location ?? "")} · Capacity {room?.capacity ?? ""}
          </div>
        </div>
        <div style={{ fontSize: "0.78rem", textTransform: "uppercase" }}>{statusEl}</div>
      </header>

      <div className={styles.cardBody}>
        {room?.amenities && (
          <div className={styles.cardAmenities}>
            {Object.entries(room.amenities)
              .filter(([, v]) => Boolean(v))
              .map(([k]) => k)
              .join(" · ")}
          </div>
        )}
        <div className={styles.cardDates}>{formatDate(startTime)} → {formatDate(endTime)}</div>
      </div>

      <footer className={styles.cardFooter}>
        {/* Confirm (only while pending & not expired) */}
        {canConfirm && onConfirm && (
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => onConfirm(id)}
            disabled={confirmLoading}
            title="Confirm this hold"
          >
            {confirmLoading ? "Confirming…" : "Confirm"}
          </button>
        )}

        {/* Cancel (optional; hide if already confirmed/cancelled) */}
        {onCancel && status !== "CANCELLED" && (
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => onCancel(id)}
            disabled={cancelLoading}
            style={{ marginLeft: "8px" }}
          >
            {cancelLoading ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </footer>
    </article>
  );
};
