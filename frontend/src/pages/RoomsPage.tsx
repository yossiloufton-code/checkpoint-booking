import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { RoomsSearchBar } from "../components/rooms/RoomsSearchBar";
import { RoomsList } from "../components/rooms/RoomsList";
import { RoomsPager } from "../components/rooms/RoomsPager";
import { useRooms } from "../context/RoomsContext";
import styles from "./RoomsPage.module.scss";
import { useNavigate } from "react-router-dom";

const DAY_MS = 24 * 60 * 60 * 1000;

export const RoomsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    rooms,
    loading,
    bookingLoadingId,
    searchRooms,
    goToPage,
    setPageSize,
    page,
    pageSize,
    total,
    hasMore,
    holdRoom,
  } = useRooms();

  const [location, setLocation] = useState("");
  const [minCapacity, setMinCapacity] = useState<string>("");

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  function atMidnight(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d: Date, days: number) { const x = new Date(d); x.setDate(x.getDate() + days); return x; }
  function diffNights(start: Date, end: Date) {
    const s = atMidnight(start), e = atMidnight(end);
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / DAY_MS));
  }

  function handleDatesChange(start: Date | null, end: Date | null) {
    // No viewing restriction — just normalize order.
    if (start && end && end <= start) {
      end = addDays(start, 1);
    }
    setStartDate(start ?? null);
    setEndDate(end ?? null);
  }

  async function loadRooms() {
    const params: {
      location?: string;
      minCapacity?: number;
      startTime?: string;
      endTime?: string;
    } = {
      location: location || undefined,
      minCapacity: minCapacity ? Number(minCapacity) : undefined,
    };

    if (startDate && endDate) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);     end.setHours(23, 59, 59, 999);
      params.startTime = start.toISOString();
      params.endTime = end.toISOString();
    }

    await searchRooms(params); // resets to page 1 inside context
  }

  async function handleBook(roomId: string) {
    if (!user) {
      navigate("/login", { replace: true, state: { returnTo: "/rooms" } });
      return;
    }
    if (!startDate || !endDate) {
      toast.warn("Select dates first.");
      return;
    }
    await holdRoom(roomId, startDate, endDate);
  }

  const canBook = !!startDate && !!endDate && !bookingLoadingId;

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        <h1 className={styles.title}>Book a room</h1>

        <RoomsSearchBar
          location={location}
          minCapacity={minCapacity}
          startDate={startDate}
          endDate={endDate}
          role={user?.role}
          loading={loading}
          onLocationChange={setLocation}
          onMinCapacityChange={setMinCapacity}
          onDatesChange={handleDatesChange}
          onSearch={loadRooms}
        />

        <RoomsPager
          page={page}
          pageSize={pageSize}
          total={total}
          hasMore={hasMore}
          onPrev={() => goToPage(Math.abs(page - 1))}
          onNext={() => goToPage(page + 1)}
          onPageSizeChange={(n) => setPageSize(n)}
        />

        <RoomsList
          rooms={rooms}
          startDate={startDate}
          endDate={endDate}
          canBook={canBook}
          bookingLoadingId={bookingLoadingId}
          onBook={handleBook}
        />

        {!loading && rooms?.length === 0 && (
          <p className={styles.noResults}>
            No rooms match your search yet. Try changing dates, location, or guest count.
          </p>
        )}
      </div>
    </div>
  );
};
