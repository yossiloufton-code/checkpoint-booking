// src/components/rooms/RoomsSearchBar.tsx
import React from "react";
import DatePicker from "react-datepicker";
import styles from "../../pages/RoomsPage.module.scss";

interface RoomsSearchBarProps {
  location: string;
  minCapacity: string;
  startDate: Date | null;
  endDate: Date | null;
  role?: "GUEST" | "MEMBER";
  loading: boolean;
  onLocationChange: (value: string) => void;
  onMinCapacityChange: (value: string) => void;
  onDatesChange: (start: Date | null, end: Date | null) => void;
  onSearch: () => void;
}

export const RoomsSearchBar: React.FC<RoomsSearchBarProps> = ({
  location,
  minCapacity,
  startDate,
  endDate,
  role,
  loading,
  onLocationChange,
  onMinCapacityChange,
  onDatesChange,
  onSearch,
}) => {
  const today = new Date();

  return (
    <section className={styles.filtersBar}>
      {/* Destination */}
      <div className={styles.filterItem}>
        <label className={styles.label} htmlFor="location">
          Where are you going?
        </label>
        <input
          id="location"
          className={styles.input}
          placeholder="e.g. Tel Aviv"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
        />
      </div>

      {/* Check-in */}
      <div className={styles.filterItem}>
        <label className={styles.label}>Check-in</label>
        <DatePicker
          selected={startDate}
          onChange={(date) => {
            const s = date ?? null;
            const e = endDate && s && endDate < s ? null : endDate;
            console.log(s)
            console.log(e)
            onDatesChange(s, e);
          }}
          minDate={today}
          placeholderText="Select check-in"
          dateFormat="dd/MM/yyyy"
          className={styles.input}
          isClearable
          selectsStart
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* Check-out */}
      <div className={styles.filterItem}>
        <label className={styles.label}>Check-out</label>
        <DatePicker
          selected={endDate}
          onChange={(date) => {
            const e = date ?? null;
            if (startDate && e && e < startDate) return;
            onDatesChange(startDate, e);
          }}
          minDate={startDate || today}
          placeholderText="Select check-out"
          dateFormat="dd/MM/yyyy"
          className={styles.input}
          isClearable
          disabled={!startDate}       // important: choose check-in first
          selectsEnd
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* Guests / capacity */}
      <div className={styles.filterItem}>
        <label className={styles.label} htmlFor="capacity">
          Guests (min)
        </label>
        <input
          id="capacity"
          type="number"
          min={1}
          className={styles.input}
          value={minCapacity}
          onChange={(e) => onMinCapacityChange(e.target.value)}
        />
      </div>

      <button
        className={styles.primaryButton}
        type="button"
        onClick={onSearch}
        disabled={loading}
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </section>
  );
};
