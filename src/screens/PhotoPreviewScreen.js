import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  Dimensions,
  StyleSheet,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { COLORS, FONTS } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const PhotoPreviewScreen = ({ route, navigation }) => {
  const { photos, startIndex = 0 } = route.params;
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const onViewableItemsChanged = React.useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Exit Button */}
        <Pressable style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Icon name="times-circle" size={28} color={COLORS.white} />
        </Pressable>

        {/* Image Slider */}
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          initialScrollIndex={startIndex}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          renderItem={({ item }) => (
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: item }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}
        />

        {/* Image Number Indicator */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C', // dark gray background
  },
  imageWrapper: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '90%',
  },
  counter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  counterText: {
    color: COLORS.white,
    ...FONTS.h4,
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
});

export default PhotoPreviewScreen;
