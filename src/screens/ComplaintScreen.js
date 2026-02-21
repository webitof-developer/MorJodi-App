import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import moment from 'moment';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '../localization/i18n';

const ComplaintScreen = ({ navigation, route }) => {
  const { user, token } = useSelector(state => state.auth);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'detail'
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [userComplaints, setUserComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [complaintType, setComplaintType] = useState('other');
  const [reportedUserId, setReportedUserId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Chat State
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const flatListRef = useRef();

  // Initial Load
  useEffect(() => {
    fetchUserComplaints();
    if (route.params?.reportedUserId) {
      setReportedUserId(route.params.reportedUserId);
      setComplaintType('user');
      setViewMode('create');
    }
  }, [route.params?.reportedUserId]);

  const fetchUserComplaints = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUserComplaints(response.data.complaints);
      }
    } catch (error) {
      // console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reloadComplaintDetails = async (id) => {
    try {
      // We might need a specific endpoint or just re-fetch all. 
      // Ideally fetch single, but 'my' list is okay for now or filter.
      // Let's implement fetch single if we can, otherwise re-fetch all and find.
      // But for chat updates, we need the latest timeline.
      // Assuming there isn't a "get my single complaint" easily without admin rights?
      // Wait, User routes didn't explicitly have "get single".
      // Controller `getComplaintById` is Admin only in routes!
      // CHECK routes/Complaint.js from step 78... 
      // `router.get('/:id', ensureAuth, ensureAdmin, complaintController.getComplaintById);`
      // Users cannot fetch single details!
      // I MUST FIX THIS to allow users to fetch their own complaint details for the chat.
      // START ACTION: Update Backend Route/Controller first? 
      // User can use `getUserComplaints` which returns list. I can just re-call that.
      // But that's heavy.
      // I will rely on `getUserComplaints` for now, or just add the single route for users.
      // Let's stick to `getUserComplaints` re-fetch for simplicity as I can't switch context easily mid-file-write.
      // Actually I can just Refresh the list and pick the item.
      const response = await axios.get(`${API_BASE_URL}/api/complaints/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setUserComplaints(response.data.complaints);
        const updated = response.data.complaints.find(c => c._id === id);
        if (updated) setSelectedComplaint(updated);
      }
    } catch (e) { console.log(e); }
  };

  // --- ACTIONS ---

  const handleCreateSubmit = async () => {
    if (!subject || !message) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('complaintType', complaintType);
      if (complaintType === 'user') formData.append('reportedUserId', reportedUserId);
      formData.append('subject', subject);
      formData.append('message', message);
      if (selectedImage) {
        formData.append('image', {
          uri: selectedImage.uri,
          type: selectedImage.type,
          name: selectedImage.fileName,
        });
      }

      const res = await axios.post(`${API_BASE_URL}/api/complaints`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        Alert.alert('Success', 'Complaint submitted successfully.');
        setSubject(''); setMessage(''); setSelectedImage(null);
        setViewMode('list');
        fetchUserComplaints();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    try {
      setSendingReply(true);
      await axios.post(
        `${API_BASE_URL}/api/complaints/${selectedComplaint._id}/reply`,
        { message: replyMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyMessage('');
      await reloadComplaintDetails(selectedComplaint._id);
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleImagePick = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.6 }, res => {
      if (res.assets) setSelectedImage(res.assets[0]);
    });
  };

  // --- RENDERERS ---

  const renderStatusBadge = (status) => {
    let color = COLORS.gray;
    let bg = '#f3f4f6';
    switch (status) {
      case 'open': color = COLORS.orange; bg = '#ffedd5'; break;
      case 'in progress': color = COLORS.blue; bg = '#dbeafe'; break;
      case 'solved': color = COLORS.green; bg = '#dcfce7'; break;
      case 'closed': color = COLORS.gray; bg = '#f3f4f6'; break;
    }
    return (
      <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
        <Text style={{ color: color, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{status}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => { setSelectedComplaint(item); setViewMode('detail'); }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardDate}>{moment(item.createdAt).format('DD MMM, YYYY')}</Text>
        {renderStatusBadge(item.status)}
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
      <Text style={styles.cardBody} numberOfLines={2}>{item.message}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={styles.idText}>#{item._id.slice(-6).toUpperCase()}</Text>
        {item.status === 'solved' || item.status === 'closed' ? null : (
          <Text style={{ fontSize: 12, color: COLORS.primary }}>Tap to view discussion</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // --- VIEWS ---

  if (viewMode === 'create') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Complaint</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.label}>Complaint Type</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={complaintType}
              onValueChange={setComplaintType}
              enabled={!route.params?.reportedUserId}
            >
              <Picker.Item label="General Issue" value="other" />
              <Picker.Item label="Report User" value="user" />
            </Picker>
          </View>

          {complaintType === 'user' && (
            <>
              <Text style={styles.label}>Reported User ID</Text>
              <TextInput
                style={styles.input}
                value={reportedUserId}
                onChangeText={setReportedUserId}
                editable={!route.params?.reportedUserId}
              />
            </>
          )}

          <Text style={styles.label}>Subject</Text>
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Brief summary" />

          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Describe your issue detailedly..."
          />

          <TouchableOpacity style={styles.imageBtn} onPress={handleImagePick}>
            <MaterialIcons name="add-photo-alternate" size={24} color={COLORS.darkGray} />
            <Text style={{ marginLeft: 10, color: COLORS.darkGray }}>
              {selectedImage ? 'Image Selected' : 'Attach Image (Optional)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
            onPress={handleCreateSubmit}
            disabled={submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Ticket</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (viewMode === 'detail' && selectedComplaint) {
    // Merge timeline with a consolidated list for display? 
    // Actually just use timeline. if empty, show nothing.
    // We should also show the INITIAL message as the first bubble.
    // Since backend adds initial message to timeline, we just render timeline!
    const messages = selectedComplaint.timeline || [];

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Ticket Details</Text>
            <Text style={{ fontSize: 10, color: COLORS.darkGray }}>#{selectedComplaint._id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.bannerTitle}>{selectedComplaint.subject}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            {renderStatusBadge(selectedComplaint.status)}
            <Text style={{ fontSize: 12, color: COLORS.darkGray, marginLeft: 10 }}>
              {moment(selectedComplaint.createdAt).format('DD MMM YYYY, HH:mm')}
            </Text>
          </View>
        </View>

        {/* Chat Area */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isAdmin = item.role === 'admin';
            return (
              <View style={[styles.bubbleWrapper, isAdmin ? styles.leftBubble : styles.rightBubble]}>
                {isAdmin && (
                  <View style={styles.avatar}>
                    <MaterialIcons name="support-agent" size={20} color="#fff" />
                  </View>
                )}
                <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleUser]}>
                  <Text style={[styles.bubbleText, isAdmin ? { color: COLORS.black } : { color: '#fff' }]}>{item.message}</Text>
                  <Text style={[styles.timeText, isAdmin ? { color: COLORS.darkGray } : { color: '#e0e0e0' }]}>
                    {moment(item.createdAt).format('HH:mm')}
                  </Text>
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.gray }}>No messages yet.</Text>
          }
        />

        {/* Reply Box */}
        {selectedComplaint.status !== 'closed' && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.inputBar}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type a reply..."
                value={replyMessage}
                onChangeText={setReplyMessage}
                multiline
              />
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSendReply}
                disabled={sendingReply}
              >
                {sendingReply ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    );
  }

  // DEFAULT: LIST VIEW
  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={userComplaints}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <FontAwesome name="inbox" size={50} color={COLORS.lightGray} />
              <Text style={{ color: COLORS.gray, marginTop: 10 }}>No complaints found.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setViewMode('create')}>
        <MaterialIcons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1
  },
  headerTitle: { ...FONTS.h3, color: COLORS.black },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardDate: { fontSize: 12, color: COLORS.gray },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginBottom: 4 },
  cardBody: { fontSize: 14, color: COLORS.darkGray },
  idText: { fontSize: 10, color: COLORS.lightGray },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60, height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5,
  },

  // Form Styles
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.black, marginTop: 15, marginBottom: 5 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.black
  },
  pickerWrapper: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff',
  },
  imageBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 15, borderWidth: 1,
    borderColor: '#ddd', borderStyle: 'dashed', borderRadius: 8, marginTop: 20
  },
  submitBtn: {
    backgroundColor: COLORS.primary, padding: 15, borderRadius: 8, marginTop: 30, alignItems: 'center'
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Detail/Chat Styles
  infoBanner: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black },

  bubbleWrapper: { flexDirection: 'row', marginVertical: 6, alignItems: 'flex-end' },
  leftBubble: { justifyContent: 'flex-start' }, // Admin
  rightBubble: { justifyContent: 'flex-end' }, // User

  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.secondary,
    alignItems: 'center', justifyContent: 'center', marginRight: 8
  },

  bubble: {
    padding: 12, borderRadius: 16, maxWidth: '80%'
  },
  bubbleAdmin: { backgroundColor: '#fff', borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#eee' },
  bubbleUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },

  bubbleText: { fontSize: 14, lineHeight: 20 },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  inputBar: {
    padding: 10, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center',
    borderTopWidth: 1, borderColor: '#eee'
  },
  replyInput: {
    flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15,
    paddingVertical: 10, maxHeight: 100, color: COLORS.black
  },
  sendBtn: {
    width: 40, height: 40, backgroundColor: COLORS.primary, borderRadius: 20,
    marginLeft: 10, alignItems: 'center', justifyContent: 'center'
  }
});

export default ComplaintScreen;
