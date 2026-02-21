import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../constants/config";
import { Alert, DeviceEventEmitter } from "react-native";

const InterestContext = createContext();
export const useInterest = () => useContext(InterestContext);

// Utility → normalize ID always as string
const getId = (val) => {
  if (!val) return null;
  if (typeof val === "string") return val;
  if (typeof val === "object" && val._id) return val._id.toString();
  return null;
};

export const InterestProvider = ({ children }) => {
  const { token } = useSelector((state) => state.auth);

  const [sentInterests, setSentInterests] = useState([]);
  const [receivedInterests, setReceivedInterests] = useState([]);

  // ================================
  // FETCH SENT INTERESTS
  // ================================
  const fetchSentInterests = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/interests/sent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSentInterests(data);
    } catch {
      Alert.alert("Error", "Failed to fetch sent interests.");
    }
  };

  // ================================
  // FETCH RECEIVED INTERESTS
  // ================================
  const fetchReceivedInterests = async () => {
    if (!token) return;
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/api/interests/received`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setReceivedInterests(data);
    } catch {
      Alert.alert("Error", "Failed to fetch received interests.");
    }
  };

  useEffect(() => {
    if (token) {
      fetchSentInterests();
      fetchReceivedInterests();
    }
  }, [token]);

  // ============================================================
  // SOCKET EVENT HANDLER (REAL-TIME)
  // ============================================================
  const handleInterestEvent = (event) => {
    const { type, interest, interestId } = event;

    // ----- RECEIVED A NEW INTEREST -----
    if (type === "received") {
      setReceivedInterests((prev) => {
        const exists = prev.find((i) => i._id === interest._id);
        if (exists) return prev;
        return [...prev, interest];
      });
      return;
    }

    // ----- ACCEPTED -----
    if (type === "accepted") {
      setSentInterests((prev) =>
        prev.map((i) =>
          i._id === interestId ? { ...i, status: "accepted" } : i
        )
      );
      setReceivedInterests((prev) =>
        prev.map((i) =>
          i._id === interestId ? { ...i, status: "accepted" } : i
        )
      );
      return;
    }

    // ----- DECLINED -----
    if (type === "declined") {
      setSentInterests((prev) =>
        prev.map((i) =>
          i._id === interestId ? { ...i, status: "declined" } : i
        )
      );
      return;
    }

    // ----- UNSENT -----
    if (type === "unsent") {
      setReceivedInterests((prev) =>
        prev.filter((i) => i._id !== interestId)
      );
      return;
    }
    // ----- REMOVED (accepted interest removed) -----
if (type === "removed") {
  setSentInterests((prev) => prev.filter((i) => i._id !== interestId));
  setReceivedInterests((prev) => prev.filter((i) => i._id !== interestId));
  return;
}

  };

  // REGISTER SOCKET LISTENER
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      "interestEvent",
      handleInterestEvent
    );

    return () => subscription.remove();
  }, []);

  // ============================================================
  // ACTIONS
  // ============================================================

  const sendInterest = async (receiverId) => {
    if (!token) {
      Alert.alert("Error", "Login first.");
      return { ok: false };
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/interests/send`,
        { receiverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchSentInterests();
      return { ok: true };
    } catch (error) {
      const res = error.response;

      if (res?.status === 403) {
        return {
          ok: false,
          subscriptionRequired: true,
          message: res.data.message,
        };
      }

      Alert.alert("Error", res?.data?.message || "Failed to send interest.");
      return { ok: false };
    }
  };

  const acceptInterest = async (interestId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/interests/accept/${interestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchSentInterests();
      fetchReceivedInterests();
    } catch {
      Alert.alert("Error", "Unable to accept interest.");
    }
  };

  const declineInterest = async (interestId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/interests/decline/${interestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchReceivedInterests();
    } catch {
      Alert.alert("Error", "Unable to decline interest.");
    }
  };

  const unsendInterest = async (interestId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/interests/unsend/${interestId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      fetchSentInterests();
    } catch {
      Alert.alert("Error", "Unable to unsend interest.");
    }
  };
const removeAcceptedInterest = async (interestId) => {
  try {
    await axios.delete(
      `${API_BASE_URL}/api/interests/remove/${interestId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Immediate UI update
    setSentInterests((prev) => prev.filter((i) => i._id !== interestId));
    setReceivedInterests((prev) => prev.filter((i) => i._id !== interestId));

    return { ok: true };
  } catch (error) {
    Alert.alert("Error", "Unable to remove interest.");
    return { ok: false };
  }
};

  // ============================================================
  // HELPERS — FIXED FOR STRING + OBJECT IDs
  // ============================================================

  const isInterestSent = (profileId) =>
    sentInterests.some(
      (i) => getId(i.receiverId) === profileId && i.status === "pending"
    );

  const isInterestReceived = (profileId) =>
    receivedInterests.some(
      (i) => getId(i.senderId) === profileId && i.status === "pending"
    );

  const getInterestStatus = (profileId) => {
    const sent = sentInterests.find(
      (i) => getId(i.receiverId) === profileId
    );
    const received = receivedInterests.find(
      (i) => getId(i.senderId) === profileId
    );

    if (sent)
      return { type: "sent", status: sent.status, interestId: sent._id };

    if (received)
      return {
        type: "received",
        status: received.status,
        interestId: received._id,
      };

    return { type: "none", status: "none" };
  };

  const hasAcceptedInterest = (profileId) =>
    sentInterests.some(
      (i) => getId(i.receiverId) === profileId && i.status === "accepted"
    ) ||
    receivedInterests.some(
      (i) => getId(i.senderId) === profileId && i.status === "accepted"
    );

  // ============================================================

  return (
    <InterestContext.Provider
      value={{
        sentInterests,
        receivedInterests,
        sendInterest,
        acceptInterest,
        removeAcceptedInterest,
        declineInterest,
        unsendInterest,
        getInterestStatus,
        isInterestSent,
        isInterestReceived,
        hasAcceptedInterest,
      }}
    >
      {children}
    </InterestContext.Provider>
  );
};
