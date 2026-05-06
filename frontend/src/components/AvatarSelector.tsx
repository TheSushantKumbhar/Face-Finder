import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  Animated,
  ImageSourcePropType,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
const AVATAR_SIZE = (SW - 100) / 4;

const bw = {
  card: '#111111',
  border: '#1E1E1E',
};

/* eslint-disable @typescript-eslint/no-require-imports */
const AVATAR_IMAGES: Record<string, ImageSourcePropType> = {
  robot: require('../../assets/avatars/robot.png'),
  cat: require('../../assets/avatars/cat.png'),
  fox: require('../../assets/avatars/fox.png'),
  alien: require('../../assets/avatars/alien.png'),
  unicorn: require('../../assets/avatars/unicorn.png'),
  ninja: require('../../assets/avatars/ninja.png'),
  astronaut: require('../../assets/avatars/astronaut.png'),
  owl: require('../../assets/avatars/owl.png'),
};

const AVATAR_IDS = Object.keys(AVATAR_IMAGES);

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  visible: boolean;
}

function AnimatedOption({
  id,
  isSelected,
  onPress,
  index,
}: {
  id: string;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay: index * 60,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        delay: index * 60,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isSelected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0);
    }
  }, [isSelected]);

  const pulseScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { scale: isSelected ? Animated.multiply(scale, pulseScale) : scale },
        ],
      }}
    >
      <TouchableOpacity
        style={[styles.option, isSelected && styles.optionSelected]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image
          source={AVATAR_IMAGES[id]}
          style={styles.avatarImg}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AvatarSelector({ selectedId, onSelect, visible }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {AVATAR_IDS.map((id, index) => (
          <AnimatedOption
            key={id}
            id={id}
            isSelected={selectedId === id}
            onPress={() => onSelect(id)}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

export function renderAvatar(id: string, size: number): React.ReactNode {
  const source = AVATAR_IMAGES[id];
  if (!source) {
    return (
      <Image
        source={AVATAR_IMAGES.robot}
        style={{ width: size * 0.85, height: size * 0.85, borderRadius: size * 0.425 }}
        resizeMode="cover"
      />
    );
  }
  return (
    <Image
      source={source}
      style={{ width: size * 0.85, height: size * 0.85, borderRadius: size * 0.425 }}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  option: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: bw.card,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  optionSelected: {
    borderColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: AVATAR_SIZE / 2,
  },
});
