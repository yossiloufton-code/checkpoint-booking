import React,
  { createContext, useReducer, useMemo, useCallback, useRef, useContext, type ReactNode, useEffect }
from "react";
import { getRooms, type Room } from "../api/rooms";
import { holdBooking } from "../api/bookings";
import { toast } from "react-toastify";

type ApiList<T> = {
  data: T[];
  total: number; 
  page: number;  
  hasMore: boolean;  
};

export interface RoomsSearchParams {
  location?: string;
  minCapacity?: number;
  startTime?: string;
  endTime?: string;  
}

type State = {
  rooms: Room[];
  loading: boolean;
  bookingLoadingId: string | null;

  lastParams: RoomsSearchParams | null;
  page: number;
  pageSize: number;

  total: number;
  hasMore: boolean;
};

type Action =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ROOMS"; payload: Room[] }
  | { type: "SET_BOOKING_LOADING"; payload: string | null }
  | { type: "SET_LAST_PARAMS"; payload: RoomsSearchParams | null }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_PAGE_SIZE"; payload: number }
  | { type: "SET_META"; payload: { total: number; hasMore: boolean } };

const initialState: State = {
  rooms: [],
  loading: false,
  bookingLoadingId: null,
  lastParams: null,
  page: 1,
  pageSize: 12,
  total: 0,
  hasMore: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ROOMS":
      return { ...state, rooms: action.payload, loading: false };
    case "SET_BOOKING_LOADING":
      return { ...state, bookingLoadingId: action.payload };
    case "SET_LAST_PARAMS":
      return { ...state, lastParams: action.payload };
    case "SET_PAGE":
      return { ...state, page: Math.max(1, action.payload) };
    case "SET_PAGE_SIZE":
      return { ...state, pageSize: Math.max(1, action.payload), page: 1 };
    case "SET_META":
      return { ...state, total: action.payload.total, hasMore: action.payload.hasMore };
    default:
      return state;
  }
}

/* ---------- Context API ---------- */
type Ctx = State & {
  searchRooms: (params: RoomsSearchParams) => Promise<void>; 
  goToPage: (page: number) => Promise<void>;
  setPageSize: (n: number) => Promise<void>;
  refresh: () => Promise<void>;
  holdRoom: (roomId: string, start: Date, end: Date) => Promise<void>;
};

const RoomsContext = createContext<Ctx | undefined>(undefined);

export const RoomsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // timers to re-fetch when holds expire
  const expiryTimersRef = useRef<Map<string, number>>(new Map()); 

  // Normalize backend response even if it returns a bare array temporarily
  const normalize = useCallback(
    (raw: unknown, page: number, pageSize: number): ApiList<Room> => {
      if (Array.isArray(raw)) {
        const data = raw as Room[];
        return {
          data,
          total: data.length,       
          page,
          hasMore: data.length === pageSize,
        };
      }
      return raw as ApiList<Room>;
    },
    []
  );

  const fetchPage = useCallback(
    async (params: RoomsSearchParams, page: number, pageSize: number) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const res = await getRooms({ ...params, page, limit: pageSize } as any);
        const norm = normalize(res, page, pageSize);

        dispatch({ type: "SET_ROOMS", payload: norm.data });
        dispatch({ type: "SET_META", payload: { total: norm.total ?? norm.data.length, hasMore: !!norm.hasMore } });
        dispatch({ type: "SET_PAGE", payload: norm.page ?? page });
      } catch {
        dispatch({ type: "SET_LOADING", payload: false });
        toast.error("Failed to load rooms.");
      }
    },
    [normalize]
  );

  const searchRooms = useCallback(
    async (params: RoomsSearchParams) => {
      dispatch({ type: "SET_LAST_PARAMS", payload: params });
      dispatch({ type: "SET_PAGE", payload: 1 });
      await fetchPage(params, 1, state.pageSize);
    },
    [fetchPage, state.pageSize]
  );

  const goToPage = useCallback(
    async (page: number) => {
      const p = Math.max(1, Math.ceil(page));
      const params = state.lastParams ?? {};
      dispatch({ type: "SET_PAGE", payload: p });
      await fetchPage(params, p, state.pageSize);
    },
    [fetchPage, state.lastParams, state.pageSize]
  );

  const setPageSize = useCallback(
    async (n: number) => {
      const size = Math.max(1, Math.floor(n));
      dispatch({ type: "SET_PAGE_SIZE", payload: size });
      const params = state.lastParams ?? {};
      await fetchPage(params, 1, size);
    },
    [fetchPage, state.lastParams]
  );

  const refresh = useCallback(async () => {
    const params = state.lastParams ?? {};
    const page = state.page || 1;
    await fetchPage(params, page, state.pageSize);
  }, [fetchPage, state.lastParams, state.page, state.pageSize]);

  const scheduleRefreshAt = useCallback(
    (roomId: string, when: Date) => {
      const ms = Math.max(0, when.getTime() - Date.now()) + 200;
      const existing = expiryTimersRef.current.get(roomId);
      if (existing) window.clearTimeout(existing);

      const tid = window.setTimeout(async () => {
        expiryTimersRef.current.delete(roomId);
        await refresh();
      }, ms);

      expiryTimersRef.current.set(roomId, tid);
    },
    [refresh]
  );

  const holdRoom = useCallback(
    async (roomId: string, start: Date, end: Date) => {
      const checkIn = new Date(start); checkIn.setHours(15, 0, 0, 0);
      const checkOut = new Date(end);  checkOut.setHours(11, 0, 0, 0);

      dispatch({ type: "SET_BOOKING_LOADING", payload: roomId });
      try {
        const pending = await holdBooking({
          roomId,
          startTime: checkIn.toISOString(),
          endTime: checkOut.toISOString(),
        });

        await refresh();

        if ((pending as any)?.expiresAt) {
          const exp = new Date((pending as any).expiresAt);
          scheduleRefreshAt(roomId, exp);

          const secs = Math.max(1, Math.round((+exp - Date.now()) / 1000));
          toast.success(`Hold placed! Expires in ~${secs}s. Confirm it in "My Bookings".`);
        } else {
          toast.success("Hold placed! Confirm it in 'My Bookings'.");
        }
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || "Failed to place hold.";
        toast.error(msg);
      } finally {
        dispatch({ type: "SET_BOOKING_LOADING", payload: null });
      }
    },
    [refresh, scheduleRefreshAt]
  );

  useEffect(() => {
    return () => {
      expiryTimersRef.current.forEach((tid) => window.clearTimeout(tid));
      expiryTimersRef.current.clear();
    };
  }, []);

  const value = useMemo<Ctx>(() => ({
    ...state,
    searchRooms,
    goToPage,
    setPageSize,
    refresh,
    holdRoom,
  }), [state, searchRooms, goToPage, setPageSize, refresh, holdRoom]);

  return <RoomsContext.Provider value={value}>{children}</RoomsContext.Provider>;
};

export function useRooms(): Ctx {
  const ctx = useContext(RoomsContext);
  if (!ctx) throw new Error("useRooms must be used within a RoomsProvider");
  return ctx;
}
