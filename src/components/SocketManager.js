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
import { fetchUnreadUserNotificationCount } from "../redux/slices/notificationSlice";

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

    const socket = io(API_BASE_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    // --------------------------------------------------------
    // CONNECTION
    // --------------------------------------------------------
    socket.on("connect", () => {
      console.log("🟢 Socket connected");
      socket.emit("registerUser", user._id);
      dispatch(fetchUnreadUserNotificationCount());
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
      dispatch(fetchUnreadUserNotificationCount()); // Keep updating badge count

      // ✅ Add to list locally to avoid refresh
      // Import addNotification inside the component or outside if cyclic dependency isn't an issue. 
      // Safe to dispatch plain object if action import is tricky, but here we can import it.
      const { addNotification } = require("../redux/slices/notificationSlice");
      dispatch(addNotification(notification));
    });

    socket.on("newMessage", (message) => {
      if (message.sender !== user._id) {
        dispatch(fetchUnreadUserNotificationCount());
      }
    });

    socket.on("messageStatusUpdate", (data) => {
      // If status is read, update unread counts
      if (data?.status === 'read') {
        dispatch(fetchUnreadUserNotificationCount());
      }
    });

    // --------------------------------------------------------
    // ONLINE / OFFLINE STATUS
    // --------------------------------------------------------
    socket.on("user_status_update", ({ userId, status, lastActive }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: { status, lastActive },
      }));
    });

    socket.on("initial_user_statuses", (statuses) => {
      const formatted = {};
      statuses.forEach((u) => {
        formatted[u.userId] = {
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
      if (subscription) subscription.remove();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, [user?._id]);

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


