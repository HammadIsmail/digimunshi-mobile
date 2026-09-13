import React from 'react';
import Svg, { Rect, Path } from 'react-native-svg';
import { View, StyleProp, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Logo({ size = 120, style }: LogoProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1024 1024"
        fill="none"
      >
        {/* Background rounded rect */}
        <Rect width="1024" height="1024" rx="220" fill="#FFFFFF" />

        {/* Open khata / ledger */}
        <Path
          d="M168 292 C168 262 193 238 223 238 H466 C489 238 509 248 524 265 C539 248 559 238 582 238 H801 C831 238 856 262 856 292 V708 C856 738 831 762 801 762 H584 C559 762 538 750 524 730 C510 750 489 762 464 762 H223 C193 762 168 738 168 708 V292Z"
          fill="#F05700"
        />

        {/* White page area - Left */}
        <Path
          d="M214 292 C214 280 224 270 236 270 H458 C481 270 500 282 514 300 V692 C500 674 481 662 458 662 H236 C224 662 214 652 214 640 V292Z"
          fill="#FFFFFF"
        />

        {/* White page area - Right */}
        <Path
          d="M810 292 C810 280 800 270 788 270 H590 C567 270 548 282 534 300 V692 C548 674 567 662 590 662 H788 C800 662 810 652 810 640 V292Z"
          fill="#FFFFFF"
        />

        {/* Left ledger lines */}
        <Path
          d="M268 376 H452"
          stroke="#F05700"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <Path
          d="M268 450 H432"
          stroke="#F05700"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <Path
          d="M268 524 H410"
          stroke="#F05700"
          strokeWidth="28"
          strokeLinecap="round"
        />

        {/* Right ledger lines */}
        <Path
          d="M596 376 H756"
          stroke="#F05700"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <Path
          d="M596 450 H736"
          stroke="#F05700"
          strokeWidth="28"
          strokeLinecap="round"
        />
        <Path
          d="M596 524 H716"
          stroke="#F05700"
          strokeWidth="28"
          strokeLinecap="round"
        />

        {/* Central microphone capsule */}
        <Rect
          x="470"
          y="350"
          width="108"
          height="220"
          rx="54"
          fill="#F05700"
        />

        {/* Microphone base cradle */}
        <Path
          d="M438 494 V522 C438 575 479 616 524 616 C569 616 610 575 610 522 V494"
          stroke="#F05700"
          strokeWidth="30"
          strokeLinecap="round"
        />

        {/* Microphone stand vertical */}
        <Path
          d="M524 616 V668"
          stroke="#F05700"
          strokeWidth="30"
          strokeLinecap="round"
        />

        {/* Microphone base plate */}
        <Path
          d="M468 668 H580"
          stroke="#F05700"
          strokeWidth="30"
          strokeLinecap="round"
        />

        {/* Soundwave accents */}
        <Path
          d="M414 410 C390 432 390 488 414 510"
          stroke="#F05700"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <Path
          d="M634 410 C658 432 658 488 634 510"
          stroke="#F05700"
          strokeWidth="24"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
export default Logo;
