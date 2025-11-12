// src/components/rooms/RoomCard.tsx
import React from "react";
import { type Room } from "../../api/rooms";
import styles from "../../pages/RoomsPage.module.scss";

interface RoomCardProps {
  room: Room;
  startDate: Date | null;
  endDate: Date | null;
  canBook: boolean;
  bookingLoading: boolean;
  onBook: (roomId: string) => void;
}

function formatShort(date: Date) {
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  startDate,
  endDate,
  canBook,
  bookingLoading,
  onBook,
}) => {
  const af = room.availableFrom ? new Date(room.availableFrom) : null;
  const at = room.availableTo ? new Date(room.availableTo) : null;

  // local UI hint: selected range must be inside availability window (if set)
  let outsideWindow = false;
  if ((af || at) && startDate && endDate) {
    const startOk = !af || startDate >= af;
    const endOk = !at || endDate <= at;
    outsideWindow = !(startOk && endOk);
  }

  const unavailable = outsideWindow || !canBook;

  return (
    <article className={styles.roomCard}>
      <header className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>{room.name}</h2>
          <div className={styles.cardLocation}>
            {room.location || "No location"} · Capacity {room.capacity}
          </div>
        </div>

        {/* Status pill */}
        <div
          className={`${styles.statusPill} ${
            unavailable ? styles.statusUnavailable : styles.statusAvailable
          }`}
        >
          {unavailable ? "Unavailable" : "Available"}
        </div>
      </header>

      <div className={styles.cardBody}>
        {room.amenities && (
          <div className={styles.cardAmenities}>
            {Object.entries(room.amenities)
              .filter(([, v]) => Boolean(v))
              .map(([k]) => k)
              .join(" · ")}
          </div>
        )}

        {/* Selected stay preview */}
        {startDate && endDate && (
          <div className={styles.cardDates}>
            Selected stay: {formatShort(startDate)} → {formatShort(endDate)}
          </div>
        )}

        {/* Availability window (always show if present) */}
        {(af || at) && (
          <div className={styles.cardDates}>
            Available: {af ? formatShort(af) : "now"} →{" "}
            {at ? formatShort(at) : "open-ended"}
          </div>
        )}

        {/* Hint if outside window */}
        {outsideWindow && (
          <div className={styles.cardDates} style={{ color: "#b91c1c" }}>
            Not available for selected dates
          </div>
        )}
      </div>

      <footer className={styles.cardFooter}>
        <button
          className={styles.secondaryButton}
          type="button"
          onClick={() => onBook(room.id)}
          disabled={unavailable}
          title={
            unavailable
              ? "Room is not available for these dates"
              : "Book this room"
          }
        >
          {bookingLoading
            ? "Booking…"
            : unavailable
            ? "Unavailable"
            : "Book these dates"}
        </button>
      </footer>
    </article>
  );
};
