/**
 * PulseMate Connect Logo - SVG Icon
 * Modern, professional medical app icon
 */
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

export default function PulseMateLogoSVG({ size = 80 }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
        <Defs>
          <LinearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="1" />
            <Stop offset="100%" stopColor="#2563EB" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="crossGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.6" />
            <Stop offset="50%" stopColor="#2563EB" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        
        {/* Outer Shadow Circle */}
        <Circle cx="60" cy="62" r="56" fill="rgba(0,0,0,0.08)" />
        
        {/* Background Circle with Gradient */}
        <Circle cx="60" cy="60" r="56" fill="url(#bgGradient)" />
        
        {/* Inner White Circle */}
        <Circle cx="60" cy="60" r="48" fill="white" />
        
        {/* Medical Cross with Gradient */}
        <G>
          {/* Vertical bar with rounded ends */}
          <Path
            d="M 53 32 Q 53 30 55 30 L 65 30 Q 67 30 67 32 L 67 88 Q 67 90 65 90 L 55 90 Q 53 90 53 88 Z"
            fill="url(#crossGradient)"
          />
          {/* Horizontal bar with rounded ends */}
          <Path
            d="M 32 53 Q 30 53 30 55 L 30 65 Q 30 67 32 67 L 88 67 Q 90 67 90 65 L 90 55 Q 90 53 88 53 Z"
            fill="url(#crossGradient)"
          />
        </G>
        
        {/* Heartbeat/Pulse Line */}
        <Path
          d="M 15 60 L 30 60 L 35 48 L 40 72 L 45 60 L 52 60 L 57 52 L 62 68 L 67 60 L 75 60 L 80 54 L 85 66 L 90 60 L 105 60"
          stroke="url(#pulseGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        
        {/* Small Plus Signs as Decorative Elements */}
        <G opacity="0.15" stroke="#2563EB" strokeWidth="2" strokeLinecap="round">
          <Path d="M 20 30 L 20 38 M 16 34 L 24 34" />
          <Path d="M 100 30 L 100 38 M 96 34 L 104 34" />
          <Path d="M 20 90 L 20 98 M 16 94 L 24 94" />
          <Path d="M 100 90 L 100 98 M 96 94 L 104 94" />
        </G>
      </Svg>
    </View>
  );
}
