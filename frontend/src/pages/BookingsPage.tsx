import React from "react";
import { useBookings } from "../context/BookingsContext";
import { BookingsList } from "../components/bookings/BookingsList";
import { Pager } from "../components/common/Pager";
import styles from "./RoomsPage.module.scss";

export const BookingsPage: React.FC = () => {
  const { bookings, loading, page, pageSize, total, hasMore, goToPage, setPageSize } = useBookings();

  return (
    <div className={styles.page}>
      <div className={styles.pageInner}>
        <h1 className={styles.title}>Your bookings</h1>

        <Pager
          page={page}
          pageSize={pageSize}
          total={total}
          hasMore={hasMore}
          loading={loading}
          onPrev={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
          onPageSize={(n) => setPageSize(n)}
        />

        {loading && <p>Loading…</p>}

        {!loading && bookings.length === 0 && (
          <p className={styles.noResults}>You don&apos;t have any bookings yet.</p>
        )}

        {!loading && bookings.length > 0 && <BookingsList bookings={bookings} />}
      </div>
    </div>
  );
};
