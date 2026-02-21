import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { API_BASE_URL } from "../constants/config";
import { removeProfile, fetchProfiles } from "../redux/slices/profilesSlice";
import {
  removeFromHome,
  fetchPremiumProfiles,
  fetchNearbyProfiles,
} from "../redux/slices/homeSlice";
const BlockContext = createContext();

export const BlockProvider = ({ children }) => {
  const [blockedProfiles, setBlockedProfiles] = useState([]);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const authAxios = axios.create({
    baseURL: `${API_BASE_URL}/api/interactions`,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    if (token) fetchBlockedProfiles();
  }, [token]);

  // ✅ fetch blocked profiles list
  const fetchBlockedProfiles = async () => {
    try {
      const res = await authAxios.get("/blocked");
      const ids = res.data.map((p) => p._id);
      setBlockedProfiles(ids);
    } catch (err) {
      // console.log("❌ Error fetching blocked profiles:", err.message);
    }
  };

  // ✅ BLOCK PROFILE
  const blockProfile = async (profileId) => {
    try {
      await authAxios.post(`/block/${profileId}`);
      setBlockedProfiles((prev) => [...prev, profileId]);
      dispatch(removeProfile(profileId)); // instantly remove
        dispatch(removeFromHome(profileId));

      // (optional) background refresh for home lists
      dispatch(fetchPremiumProfiles());
      dispatch(fetchNearbyProfiles());
    } catch (err) {
      // console.log("❌ Error blocking user:", err.message);
    }
  };

  // ✅ UNBLOCK PROFILE
  const unblockProfile = async (profileId) => {
    try {
      await authAxios.post(`/unblock/${profileId}`);

      // local state update
      setBlockedProfiles((prev) => prev.filter((id) => id !== profileId));

      // 🔥 Immediately refresh most-used tab
      dispatch(fetchProfiles({ profileType: "yourMatches" }));

      // 🔥 Immediately refresh Home lists
      dispatch(fetchPremiumProfiles());
      dispatch(fetchNearbyProfiles());

      // 🔥 Background refresh for other tabs
      setTimeout(() => {
        dispatch(fetchProfiles({ profileType: "all" }));
        dispatch(fetchProfiles({ profileType: "nearby" }));
        dispatch(fetchProfiles({ profileType: "justJoined" }));
        dispatch(fetchProfiles({ profileType: "verified" }));
      }, 1000);
    } catch (err) {
      // console.log("❌ Error unblocking user:", err.message);
    }
  };

  const isBlocked = (profileId) => blockedProfiles.includes(profileId);

  return (
    <BlockContext.Provider
      value={{
        blockedProfiles,
        fetchBlockedProfiles,
        blockProfile,
        unblockProfile,
        isBlocked,
      }}
    >
      {children}
    </BlockContext.Provider>
  );
};

export const useBlock = () => useContext(BlockContext);
