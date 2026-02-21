import { combineReducers } from 'redux';
import authReducer from './authReducer';
import subscriptionReducer from '../slices/subscriptionSlice';
import searchReducer from '../slices/searchSlice';
import profilesReducer from '../slices/profilesSlice';
import notificationReducer from '../slices/notificationSlice';
import messageReducer from '../slices/messageSlice';
import userStatusReducer from '../slices/userStatusSlice';
import homeReducer from '../slices/homeSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  subscription: subscriptionReducer,
  search: searchReducer,
  profiles: profilesReducer,
  notifications: notificationReducer,
  messages: messageReducer,
  userStatus: userStatusReducer,
  home: homeReducer
});

export default rootReducer;
