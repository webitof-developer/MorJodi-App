import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import io from 'socket.io-client';

// Placeholder for Agora SDK imports
// import RtcEngine, { ChannelProfile, ClientRole, VideoRenderMode } from 'react-native-agora';
// import { RtcLocalView, RtcRemoteView } from 'react-native-agora';

const VideoCallScreen = ({ navigation, route }) => {
  const { channelName, token, recipientId, recipientName, messageId, chatId } =
    route.params;
  const { token: authToken, user } = useSelector(state => state.auth);
  const [callStatus, setCallStatus] = useState('initiated');
  const [callDuration, setCallDuration] = useState(0);
  const [socket, setSocket] = useState(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // Agora specific states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);

  const updateCallStatus = useCallback(
    async (status, duration = 0) => {
      if (!messageId) return;
      try {
        await axios.post(
          `${API_BASE_URL}/api/agora/update-call`,
          { messageId, status, duration },
          { headers: { Authorization: `Bearer ${authToken}` } },
        );
        // console.log(`Call message ${messageId} status updated to ${status} with duration ${duration}`);
        setCallStatus(status);
      } catch (error) {
        // //console.error('Error updating call status:', error);
      }
    },
    [messageId, authToken],
  );

  // Timer for call duration
  useEffect(() => {
    if (callStatus === 'answered') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else if (callStatus !== 'initiated' && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  // Socket.io for real-time updates
  useEffect(() => {
    const newSocket = io(API_BASE_URL, { transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.emit('joinChat', chatId);

    newSocket.on('callStatusUpdate', data => {
      if (data.messageId === messageId) {
        setCallStatus(data.status);
        if (data.duration) {
          setCallDuration(data.duration);
        }
        if (
          data.status === 'completed' ||
          data.status === 'rejected' ||
          data.status === 'missed'
        ) {
          Alert.alert('Call Ended', `Call ${data.status}.`);
          navigation.goBack();
        }
      }
    });

    return () => {
      newSocket.disconnect();
      if (callStatus === 'initiated') {
        updateCallStatus('missed');
      } else if (callStatus === 'answered') {
        updateCallStatus('completed', callDuration);
      }
    };
  }, [
    messageId,
    chatId,
    authToken,
    navigation,
    callStatus,
    callDuration,
    updateCallStatus,
  ]);

  const handleHangUp = () => {
    updateCallStatus('completed', callDuration);
    // TODO: Leave Agora channel and destroy engine
    navigation.goBack();
  };

  const handleAccept = () => {
    updateCallStatus('answered');
    // TODO: Initialize Agora Engine and join channel
    // try {
    //   const engine = await RtcEngine.create(AGORA_APP_ID);
    //   engine.setChannelProfile(ChannelProfile.Communication);
    //   engine.setClientRole(ClientRole.Broadcaster);
    //   engine.enableVideo();
    //   engine.joinChannel(token, channelName, null, user._id);

    //   engine.addListener('UserJoined', (uid, elapsed) => {
    //     setRemoteUid(uid);
    //   });
    //   engine.addListener('UserOffline', (uid, reason) => {
    //     setRemoteUid(null);
    //     handleHangUp();
    //   });
    //   // Add other event listeners
    // } catch (e) {
    //   //console.error('Agora init error:', e);
    //   Alert.alert('Error', 'Failed to start call.');
    //   updateCallStatus('failed');
    //   navigation.goBack();
    // }
  };

  const handleReject = () => {
    updateCallStatus('rejected');
    navigation.goBack();
  };

  const formatDuration = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Mute/unmute local audio stream via Agora SDK
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // TODO: Enable/disable local video stream via Agora SDK
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleHangUp}>
          <Icon name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Video Call with {recipientName}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.callStatusText}>Status: {callStatus}</Text>
        {callStatus === 'answered' && (
          <Text style={styles.callDurationText}>
            Duration: {formatDuration(callDuration)}
          </Text>
        )}

        {callStatus === 'initiated' && (
          <View style={styles.callActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.green }]}
              onPress={handleAccept}
            >
              <Icon name="call" size={30} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: COLORS.red }]}
              onPress={handleReject}
            >
              <Icon name="call-end" size={30} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        )}

        {/* Agora SDK Video Call UI will be rendered here */}
        <View style={styles.agoraContainer}>
          {/* {callStatus === 'answered' && (
            <>
              <RtcLocalView.SurfaceView
                style={styles.localVideo}
                channelId={channelName}
                renderMode={VideoRenderMode.Hidden}
              />
              {remoteUid && (
                <RtcRemoteView.SurfaceView
                  style={styles.remoteVideo}
                  uid={remoteUid}
                  channelId={channelName}
                  renderMode={VideoRenderMode.Hidden}
                />
              )}
            </>
          )} */}
          <Text style={styles.agoraPlaceholderText}>Agora Video Call UI</Text>
        </View>
      </View>
      <View style={styles.footer}>
        {callStatus === 'answered' && (
          <>
            <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
              <Icon
                name={isMuted ? 'mic-off-outline' : 'mic-outline'}
                size={30}
                color={COLORS.white}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleVideo}
            >
              <Icon
                name={isVideoOff ? 'videocam-off-outline' : 'videocam-outline'}
                size={30}
                color={COLORS.white}
              />
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity style={styles.callButton} onPress={handleHangUp}>
          <Icon name="call-outline" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default VideoCallScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.darkGray,
  },
  headerTitle: {
    color: COLORS.white,
    ...FONTS.h3,
    marginLeft: SIZES.padding,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callStatusText: {
    color: COLORS.white,
    ...FONTS.body3,
    marginBottom: SIZES.padding,
  },
  callDurationText: {
    color: COLORS.white,
    ...FONTS.h1,
    marginBottom: SIZES.padding,
  },
  callActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
  },
  actionButton: {
    padding: SIZES.padding,
    borderRadius: 50,
  },
  agoraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  agoraPlaceholderText: {
    color: COLORS.white,
    ...FONTS.body3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.darkGray,
  },
  controlButton: {
    padding: SIZES.padding,
  },
  callButton: {
    backgroundColor: COLORS.red,
    padding: SIZES.padding,
    borderRadius: 50,
  },
  localVideo: {
    flex: 1,
  },
  remoteVideo: {
    position: 'absolute',
    width: 120,
    height: 160,
    top: 40,
    right: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
});
