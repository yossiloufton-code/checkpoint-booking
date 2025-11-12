import React, {
  createContext,
  useReducer,
  useMemo,
  useCallback,
  useEffect,
  useContext,
} from "react";
import {
  getMyBookings,
  cancelBooking as apiCancel,
  confirmBooking as apiConfirm,
  type Booking,
} from "../api/bookings";
import { getRoomById, type Room } from "../api/rooms";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useLocation } from "react-router-dom";

/** Generic list response shape from server */
type ApiList<T> = { data: T[]; total: number; page: number; hasMore: boolean };

type State = {
  bookings: Booking[];
  loading: boolean;
  cancelLoadingId: string | null;
  page: number;
  pageSize: number;
  total?: number;
  hasMore?: boolean;
};

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | {
    type: "SET_BOOKINGS";
    payload: {
      items: Booking[];
      page: number;
      pageSize: number;
      total?: number;
      hasMore?: boolean;
    };
  }
  | { type: "SET_CANCEL_LOADING"; payload: string | null }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number };

const initialState: State = {
  bookings: [],
  loading: false,
  cancelLoadingId: null,
  page: 1,
  pageSize: 12,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_BOOKINGS":
      return {
        ...state,
        bookings: action.payload.items,
        page: action.payload.page,
        pageSize: action.payload.pageSize,
        total: action.payload.total,
        hasMore: action.payload.hasMore,
        loading: false,
      };
    case "SET_CANCEL_LOADING":
      return { ...state, cancelLoadingId: action.payload };
    case "SET_PAGE":
      return { ...state, page: Math.max(1, action.payload) };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: Math.max(1, action.payload), page: 1 };
    default:
      return state;
  }
}

/* ---------- Context API ---------- */
type Ctx = State & {
  refreshBookings: (page?: number, pageSize?: number) => Promise<void>;
  cancelBooking: (bookingId: string) => Promise<void>;
  confirmBooking: (bookingId: string) => Promise<void>;
  goToPage: (p: number) => Promise<void>;
  setPageSize: (n: number) => Promise<void>;
};

const BookingsContext = createContext<Ctx | undefined>(undefined);

export const BookingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();          // <-- from your AuthContext
  const location = useLocation();
  const [state, dispatch] = useReducer(reducer, initialState);

  const hydrateRoomsOnce = useCallback(async (list: Booking[]): Promise<Booking[]> => {
    const ids = Array.from(
      new Set(
        list
          .map((b) => b.room?.id ?? (b as any).roomId)
          .filter((x): x is string => !!x)
      )
    );

    const map = new Map<string, Room>();
    await Promise.all(
      ids.map(async (id) => {
        try {
          const r = await getRoomById(id);
          map.set(id, r);
        } catch {
        }
      })
    );

    return list.map((b) => ({
      ...b,
      room: b.room ?? map.get((b as any).roomId as string),
    }));
  }, []);

  const refreshBookings = useCallback(
    async (pageArg?: number, pageSizeArg?: number) => {
      const page = pageArg ?? state.page;
      const limit = pageSizeArg ?? state.pageSize;
      const onBookingsRoute =
        location.pathname.startsWith("/bookings") ||
        location.pathname === "/me/bookings";

      if (!isAuthenticated || !onBookingsRoute) return;

      dispatch({ type: "SET_LOADING", payload: true });
      try {

        const raw = (await getMyBookings({ page, limit })) as unknown as
          | Booking[]
          | ApiList<Booking>;

        const items = Array.isArray(raw) ? raw : raw.data;
        const total = Array.isArray(raw) ? undefined : raw.total;
        const hasMore = Array.isArray(raw) ? undefined : raw.hasMore;

        const withRooms = await hydrateRoomsOnce(items);

        dispatch({
          type: "SET_BOOKINGS",
          payload: {
            items: withRooms,
            page,
            pageSize: limit,
            total,
            hasMore,
          },
        });
      } catch {
        dispatch({ type: "SET_LOADING", payload: false });
        toast.error("Failed to load bookings.");
      }
    },
    [state.page, state.pageSize, hydrateRoomsOnce]
  );

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      dispatch({ type: "SET_CANCEL_LOADING", payload: bookingId });
      try {
        await apiCancel(bookingId);
        toast.success("Booking cancelled.");
        await refreshBookings(); // keep current page
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to cancel booking.";
        toast.error(msg);
      } finally {
        dispatch({ type: "SET_CANCEL_LOADING", payload: null });
      }
    },
    [refreshBookings]
  );

  const confirmBooking = useCallback(
    async (bookingId: string) => {
      try {
        await apiConfirm(bookingId);
        toast.success("Booking confirmed.");
        await refreshBookings(); // keep current page
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to confirm booking.";
        toast.error(msg);
      }
    },
    [refreshBookings]
  );

  const goToPage = useCallback(
    async (p: number) => {
      const next = Math.max(1, Math.ceil(p));
      dispatch({ type: "SET_PAGE", payload: next });
      await refreshBookings(next, state.pageSize);
    },
    [refreshBookings, state.pageSize]
  );

  const setPageSize = useCallback(
    async (n: number) => {
      const size = Math.max(1, Math.floor(n));
      dispatch({ type: "SET_PAGE_SIZE", payload: size });
      await refreshBookings(1, size);
    },
    [refreshBookings]
  );

  useEffect(() => {
    const onBookingsRoute =
      location.pathname.startsWith("/bookings")

    console.log(onBookingsRoute)
    if (!onBookingsRoute) return;

    void refreshBookings(state.page, state.pageSize);
  }, [
    isAuthenticated,
    location.pathname,
    state.page,
    state.pageSize,
    refreshBookings,
  ]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      refreshBookings,
      cancelBooking,
      confirmBooking,
      goToPage,
      setPageSize,
    }),
    [state, refreshBookings, cancelBooking, confirmBooking, goToPage, setPageSize]
  );

  return (
    <BookingsContext.Provider value={value}>
      {children}
    </BookingsContext.Provider>
  );
};

export function useBookings(): Ctx {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings must be used within a BookingsProvider");
  return ctx;
}
