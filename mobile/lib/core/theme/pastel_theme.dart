import 'package:flutter/material.dart';

/// ─────────────────────────────────────────────────────────────
///  PASTEL CLAY / 3D SOFT-CLAY tokens — Naik brand
///  Yellow-first surfaces with blue accents.
/// ─────────────────────────────────────────────────────────────
class PastelTheme {
  PastelTheme._();

  // ── Background (yellow) ──
  static const Color lavenderBg = Color(0xFFFFC53D);
  static const Color lavenderLight = Color(0xFFFFE082);
  static const Color lavenderDeep = Color(0xFFF9A825);

  // ── Card / surface ──
  static const Color creamCard = Color(0xFFFFFDF5);
  static const Color creamLight = Color(0xFFFFFDF5);

  // ── Primary action (blue) ──
  static const Color purplePrimary = Color(0xFF2196F3);
  static const Color purpleDark = Color(0xFF1976D2);
  static const Color purpleLight = Color(0xFF64B5F6);

  // ── Ink ──
  static const Color inkDark = Color(0xFF1F2A4A);
  static const Color inkMuted = Color(0xFF3E4A5E);

  // ── Decorative accents ──
  static const Color heartPink = Color(0xFFFF6B6B);
  static const Color leafGreen = Color(0xFF4FD1A5);
  static const Color flowerYellow = Color(0xFFFFC53D);
  static const Color cloudWhite = Color(0xFFFFFFFF);

  // ── Radii ──
  static const double cardRadius = 30.0;
  static const double inputRadius = 20.0;
  static const double buttonRadius = 999.0;
  static const double tileRadius = 22.0;

  // ── Soft clay shadows ──
  static const BoxShadow softShadow = BoxShadow(
    color: Color(0x33F9A825),
    blurRadius: 30,
    offset: Offset(0, 12),
    spreadRadius: -6,
  );
  static const BoxShadow buttonShadow = BoxShadow(
    color: Color(0x402196F3),
    blurRadius: 18,
    offset: Offset(0, 8),
    spreadRadius: -4,
  );

  // ── Gradients ──
  static const LinearGradient backgroundGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFFFFE082), Color(0xFFFFC53D), Color(0xFFFFF8E1)],
  );

  static const LinearGradient buttonGradient = LinearGradient(
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
    colors: [Color(0xFF64B5F6), Color(0xFF2196F3), Color(0xFF1976D2)],
  );

  // ── Fonts ──
  static const String headingFont = 'Baloo2';
  static const String bodyFont = 'Nunito';

  static TextStyle heading({
    double size = 30,
    Color color = inkDark,
    FontWeight weight = FontWeight.w700,
  }) {
    return TextStyle(
      fontFamily: headingFont,
      fontFamilyFallback: const ['NotoSansEthiopic', 'NotoColorEmoji'],
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: 1.15,
    );
  }

  static TextStyle body({
    double size = 16,
    Color color = inkDark,
    FontWeight weight = FontWeight.w600,
  }) {
    return TextStyle(
      fontFamily: bodyFont,
      fontFamilyFallback: const ['NotoSansEthiopic', 'NotoColorEmoji'],
      fontSize: size,
      fontWeight: weight,
      color: color,
      height: 1.4,
    );
  }
}
