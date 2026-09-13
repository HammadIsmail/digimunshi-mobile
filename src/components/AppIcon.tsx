import React from 'react';
import { Image } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

export type IconName =
  | 'backspace'
  | 'clothing_store'
  | 'cross'
  | 'down_arrow'
  | 'flag'
  | 'general_store'
  | 'home'
  | 'karyana_store'
  | 'khata'
  | 'left_arrow'
  | 'list'
  | 'lock'
  | 'logout'
  | 'medical_store'
  | 'plus'
  | 'right_arrow'
  | 'search'
  | 'send_message'
  | 'shop'
  | 'speaker_big'
  | 'speaker_small'
  | 'tick'
  | 'up_arrow';

const iconMap: Record<IconName, any> = {
  backspace: require('@/assets/images/icons/backspace.svg'),
  clothing_store: require('@/assets/images/icons/clothing_store.svg'),
  cross: require('@/assets/images/icons/cross.svg'),
  down_arrow: require('@/assets/images/icons/down_arrow.svg'),
  flag: require('@/assets/images/icons/flag.svg'),
  general_store: require('@/assets/images/icons/general_store.svg'),
  home: require('@/assets/images/icons/home.svg'),
  karyana_store: require('@/assets/images/icons/karyana_store.svg'),
  khata: require('@/assets/images/icons/khata.svg'),
  left_arrow: require('@/assets/images/icons/left_arrow.svg'),
  list: require('@/assets/images/icons/list.svg'),
  lock: require('@/assets/images/icons/lock.svg'),
  logout: require('@/assets/images/icons/logout.svg'),
  medical_store: require('@/assets/images/icons/medical_store.svg'),
  plus: require('@/assets/images/icons/plus.svg'),
  right_arrow: require('@/assets/images/icons/right_arrow.svg'),
  search: require('@/assets/images/icons/search.svg'),
  send_message: require('@/assets/images/icons/send_message.svg'),
  shop: require('@/assets/images/icons/shop.svg'),
  speaker_big: require('@/assets/images/icons/speaker_big.svg'),
  speaker_small: require('@/assets/images/icons/speaker_small.svg'),
  tick: require('@/assets/images/icons/tick.svg'),
  up_arrow: require('@/assets/images/icons/up_arrow.svg'),
};

interface AppIconProps {
  name: IconName;
  size?: number;
  width?: number;
  height?: number;
  tintColor?: string;
  style?: StyleProp<ImageStyle>;
}

export function AppIcon({ name, size = 20, width, height, tintColor, style }: AppIconProps) {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <Image
      source={iconMap[name]}
      style={[{ width: w, height: h }, style]}
      contentFit="contain"
      tintColor={tintColor}
    />
  );
}
