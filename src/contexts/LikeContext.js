import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../constants/config';
const INTERACTIONS_API_URL = `${API_BASE_URL}/api/interactions`;
const LikeContext = createContext();

export const LikeProvider = ({ children }) => {
  const [likedProfiles, setLikedProfiles] = useState([]);
  const { token } = useSelector(state => state.auth); // Assuming token is in auth state

  const authAxios = axios.create({
    baseURL: INTERACTIONS_API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    if (token) {
      fetchLikedProfiles();
    }
  }, [token]);

  const fetchLikedProfiles = async () => {
    try {
      const response = await authAxios.get('/liked');
      setLikedProfiles(response.data.map(profile => profile._id));
    } catch (error) {
      // //console.error('Error fetching liked profiles:', error);
    }
  };

  const likeProfile = async profileId => {
    try {
      await authAxios.post(`/like/${profileId}`);
      setLikedProfiles(prev => [...prev, profileId]);
      return true;
    } catch (error) {
      // //console.error('Error liking profile:', error);
      return false;
    }
  };

  const unlikeProfile = async profileId => {
    try {
      await authAxios.post(`/unlike/${profileId}`);
      setLikedProfiles(prev => prev.filter(id => id !== profileId));
      return true;
    } catch (error) {
      // //console.error('Error unliking profile:', error);
      return false;
    }
  };

  const isLiked = profileId => likedProfiles.includes(profileId);

  return (
    <LikeContext.Provider
      value={{
        likedProfiles,
        likeProfile,
        unlikeProfile,
        isLiked,
        fetchLikedProfiles,
      }}
    >
      {children}
    </LikeContext.Provider>
  );
};

export const useLike = () => useContext(LikeContext);
