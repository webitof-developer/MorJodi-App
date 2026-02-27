import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
} from "react";
import { AppState, DeviceEventEmitter } from "react-native";
import { useDispatch } from "react-redux";
import io from "socket.io-client";
import { API_BASE_URL } from "../constants/config";
import {
  addNotification,
  fetchUnreadNotificationCount,
  fetchUnreadUserNotificationCount,
} from "../redux/slices/notificationSlice";
import { fetchUnreadMessageCount } from "../redux/slices/messageSlice";

// --------------------------------------------------------
// CONTEXT EXPORT
// --------------------------------------------------------
const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

const SocketManager = ({ user, children }) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const [onlineUsers, setOnlineUsers] = useState({});
  const unreadRefreshTimerRef = useRef(null);
  const normalizeId = React.useCallback((value) => {
    if (!value) return null;
    if (typeof value === 'object') {
      const maybeId = value._id || value.id;
      return maybeId ? String(maybeId) : null;
    }
    const raw = String(value).trim();
    if (!raw || raw === 'undefined' || raw === 'null') return null;
    return raw;
  }, []);

  const scheduleUnreadRefresh = React.useCallback(
    (delayMs = 350) => {
      if (unreadRefreshTimerRef.current) {
        clearTimeout(unreadRefreshTimerRef.current);
      }
      unreadRefreshTimerRef.current = setTimeout(() => {
        dispatch(fetchUnreadNotificationCount());
        dispatch(fetchUnreadUserNotificationCount());
        dispatch(fetchUnreadMessageCount());
        unreadRefreshTimerRef.current = null;
      }, delayMs);
    },
    [dispatch],
  );

  // ========================================================
  // MAIN EFFECT
  // ========================================================
  useEffect(() => {
    if (!user?._id) return;
    if (!API_BASE_URL) {
      console.warn("[SocketManager] API_BASE_URL is not set, skipping socket init.");
      return;
    }

    // Prevent duplicate connections
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 600,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.5,
    });
    socketRef.current = socket;

    // --------------------------------------------------------
    // CONNECTION
    // --------------------------------------------------------
    socket.on("connect", () => {
      console.log("🟢 Socket connected");
      socket.emit("registerUser", user._id);
      scheduleUnreadRefresh(0);
    });

    // --------------------------------------------------------
    // INTEREST EVENTS (merged)
    // --------------------------------------------------------
    const interestEvents = [
      "interest:received",
      "interest:accepted",
      "interest:declined",
      "interest:unsent",
      "interest:removed",
    ];

    interestEvents.forEach((event) => {
      socket.on(event, (data) => {
        DeviceEventEmitter.emit("interestEvent", data);
      });
    });

    // --------------------------------------------------------
    // NOTIFICATION / MESSAGE EVENTS
    // --------------------------------------------------------
    socket.on("new_notification", (notification) => {
      console.log("New notification:", notification);
      dispatch(addNotification(notification));
      scheduleUnreadRefresh();
    });

    socket.on("notification_count_update", () => {
      scheduleUnreadRefresh();
    });

    socket.on("newMessage", (message) => {
      if (message.sender !== user._id) {
        scheduleUnreadRefresh();
      }
    });

    socket.on("messageStatusUpdate", (data) => {
      // If status is read, update unread counts
      if (data?.status === 'read') {
        scheduleUnreadRefresh();
      }
    });

    // --------------------------------------------------------
    // ONLINE / OFFLINE STATUS
    // --------------------------------------------------------
    socket.on("user_status_update", ({ userId, status, lastActive }) => {
      const normalizedUserId = normalizeId(userId);
      if (!normalizedUserId) return;
      setOnlineUsers((prev) => ({
        ...prev,
        [normalizedUserId]: { status, lastActive },
      }));
    });

    socket.on("initial_user_statuses", (statuses) => {
      const formatted = {};
      statuses.forEach((u) => {
        const normalizedUserId = normalizeId(u.userId);
        if (!normalizedUserId) return;
        formatted[normalizedUserId] = {
          status: u.status,
          lastActive: u.lastActive,
        };
      });
      setOnlineUsers(formatted);
    });

    // --------------------------------------------------------
    // INCOMING CALL
    // --------------------------------------------------------
    socket.on("incoming-call", (data) => {
      console.log("Incoming call:", data);
      DeviceEventEmitter.emit("incomingCallEvent", data);
    });

    // --------------------------------------------------------
    // APP STATE CHANGE
    // --------------------------------------------------------
    const handleAppStateChange = (next) => {
      // BACKGROUND -> OFFLINE
      if (appState.current === "active" && next !== "active") {
        socket.emit("user_status_update", {
          userId: user._id,
          status: "offline",
          lastActive: new Date(),
        });
      }

      // FOREGROUND -> ONLINE
      if (appState.current !== "active" && next === "active") {
        socket.emit("user_status_update", {
          userId: user._id,
          status: "online",
          lastActive: null,
        });
      }

      appState.current = next;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------
    return () => {
      if (unreadRefreshTimerRef.current) {
        clearTimeout(unreadRefreshTimerRef.current);
        unreadRefreshTimerRef.current = null;
      }
      if (subscription) subscription.remove();
      if (socketRef.current) {
        if (user?._id) {
          socketRef.current.emit("user_status_update", {
            userId: user._id,
            status: "offline",
            lastActive: new Date(),
          });
        }
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, [user?._id, scheduleUnreadRefresh, normalizeId]);

  // --------------------------------------------------------
  // PROVIDER
  // --------------------------------------------------------
  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, onlineUsers }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketManager;


