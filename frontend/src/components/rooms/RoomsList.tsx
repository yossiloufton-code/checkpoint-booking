// src/components/rooms/RoomsList.tsx
import React from "react";
import { type Room } from "../../api/rooms";
import { RoomCard } from "./RoomCard";

interface RoomsListProps {
  rooms: Room[];
  startDate: Date | null;
  endDate: Date | null;
  canBook: boolean;
  bookingLoadingId: string | null;
  onBook: (roomId: string) => void;
}

export const RoomsList: React.FC<RoomsListProps> = ({
  rooms,
  startDate,
  endDate,
  canBook,
  bookingLoadingId,
  onBook,
}) => {
  return (
    <div className="rooms-grid">
      {rooms?.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          startDate={startDate}
          endDate={endDate}
          canBook={canBook}
          bookingLoading={bookingLoadingId === room.id}
          onBook={onBook}
        />
      ))}
    </div>
  );
};
