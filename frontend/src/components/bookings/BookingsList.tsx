import React from "react";
import type { Booking } from "../../api/bookings";
import { BookingCard } from "./BookingCard";
import { useBookings } from "../../context/BookingsContext";

export const BookingsList: React.FC<{ bookings: Booking[] }> = ({ bookings }) => {
  const { cancelBooking, confirmBooking, cancelLoadingId, confirmLoadingId } = useBookings();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
      {bookings.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          onCancel={(id) => cancelBooking(id)}
          onConfirm={(id) => confirmBooking(id)}          
          cancelLoading={cancelLoadingId === b.id}
          confirmLoading={confirmLoadingId === b.id}    
        />
      ))}
    </div>
  );
};
