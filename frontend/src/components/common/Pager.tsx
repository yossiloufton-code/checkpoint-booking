// src/components/common/Pager.tsx
import React from "react";

export const Pager: React.FC<{
  page: number;
  pageSize: number;
  total?: number;      // optional
  hasMore?: boolean;   // optional
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSize?: (n: number) => void;
}> = ({ page, pageSize, total, hasMore, loading, onPrev, onNext, onPageSize }) => {
  const canPrev = page > 1 && !loading;
  const canNext = (hasMore ?? (total ? page * pageSize < total : true)) && !loading;

  return (
    <div style={{ display:"flex", gap:12, alignItems:"center", justifyContent:"flex-end", margin:"12px 0" }}>
      {typeof total === "number" && (
        <span style={{ color:"#6b7280", fontSize:12 }}>
          Page {page}{total ? ` of ${Math.max(1, Math.ceil(total / pageSize))}` : ""} · {total} items
        </span>
      )}
      <button className="ghost" disabled={!canPrev} onClick={onPrev}>Prev</button>
      <button className="ghost" disabled={!canNext} onClick={onNext}>Next</button>
      {onPageSize && (
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          style={{ padding:"6px 8px", borderRadius:8, border:"1px solid #e5e7eb" }}
        >
          {[6, 12, 24].map(n => <option key={n} value={n}>{n}/page</option>)}
        </select>
      )}
    </div>
  );
};
