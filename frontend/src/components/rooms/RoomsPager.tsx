import React from "react";
import styles from "../../pages/RoomsPage.module.scss";

type Props = {
  page: number;          // current page (1-based)
  pageSize: number;      // rows per page
  total?: number;        // total rows (optional)
  hasMore?: boolean;     // if total is unknown, use hasMore to drive "Next"
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (n: number) => void;
};

export const RoomsPager: React.FC<Props> = ({
  page,
  pageSize,
  total,
  hasMore,
  onPrev,
  onNext,
  onPageSizeChange,
}) => {
  const totalPages =
    typeof total === "number" && total > 0
      ? Math.max(1, Math.ceil(total / pageSize))
      : undefined;

  const disablePrev = page <= 1;
  const disableNext =
    totalPages !== undefined ? page >= totalPages : hasMore === false;

  return (
    <div className={styles.Pager}>
      <span>
        Page <strong>{page}</strong>
        {totalPages ? <> of <strong>{totalPages}</strong></> : null}
      </span>

      <button className="ghost" onClick={onPrev} disabled={disablePrev}>
        Prev
      </button>
      <button onClick={onNext} disabled={disableNext}>
        Next
      </button>

      <span>· Per page</span>
      <select
        value={pageSize}
        onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
      >
        <option value={8}>8</option>
        <option value={12}>12</option>
        <option value={18}>18</option>
        <option value={24}>24</option>
      </select>
    </div>
  );
};
