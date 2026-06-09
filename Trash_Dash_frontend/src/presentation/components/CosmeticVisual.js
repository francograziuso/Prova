import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Asset } from "expo-asset";
import { SvgUri, SvgXml } from "react-native-svg";
import { styles } from "../styles/appStyles";

export function CosmeticVisual({ item, variant = "base", size = 64, emojiStyle, animated = true }) {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) {
      glowAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [glowAnim, variant, animated]);

  const svgXml =
    variant === "victory"
      ? item.victorySvg
      : variant === "defeat"
      ? item.defeatSvg
      : item.baseSvg;

  const svgAsset =
    variant === "victory"
      ? item.victorySvgAsset
      : variant === "defeat"
      ? item.defeatSvgAsset
      : item.baseSvgAsset;

  const renderVisual = () => {
    if (svgXml && svgXml.includes("<svg") && svgXml.includes("</svg>")) {
      return <SvgXml xml={svgXml} width={size} height={size} />;
    }

    if (svgAsset) {
      const assetUri = Asset.fromModule(svgAsset).uri;
      return <SvgUri uri={assetUri} width={size} height={size} />;
    }

    return (
      <Text
        allowFontScaling={false}
        style={[
          emojiStyle,
          styles.ecoCosmeticFallback,
          { fontSize: Math.max(28, size * 0.72) },
        ]}
      >
        {variant === "defeat" ? item.iconDead : item.iconHealthy}
      </Text>
    );
  };

  const glowOpacity = animated
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.18, variant === "defeat" ? 0.26 : 0.46],
      })
    : variant === "defeat"
    ? 0.18
    : 0.24;

  const visualScale = animated
    ? glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, variant === "defeat" ? 1.02 : 1.045],
      })
    : 1;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.ecoCosmeticFrame,
        { width: size * 1.38, height: size * 1.38 },
      ]}
    >
      <Animated.View
        style={[
          styles.ecoCosmeticGlow,
          variant === "defeat" ? styles.ecoCosmeticGlowDirty : styles.ecoCosmeticGlowClean,
          {
            opacity: glowOpacity,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.ecoCosmeticInner,
          {
            transform: [{ scale: visualScale }],
          },
        ]}
      >
        {renderVisual()}
      </Animated.View>
    </View>
  );
}
