import 'package:flutter/material.dart';

/// ─────────────────────────────────────────────────────────────
///  KIDS DESIGN TOKENS — Naik Mobile
///  Single source of truth for the branded design system.
///
///  Brand focus: yellow background / surfaces, blue accents.
///  White is still used for cards and readable text on yellow.
///  Supporting accents are kept low-saturation so yellow stays dominant.
/// ─────────────────────────────────────────────────────────────
class KidsDesignTokens {
  KidsDesignTokens._();

  // ── Brand primary ──
  static const Color sunnyYellow = Color(0xFFFFC53D); // primary bg/CTA
  static const Color skyBlue = Color(0xFF2196F3); // primary accent/active
  static const Color skyBlueLight = Color(0xFF81D4FA); // decorative light blue
  static const Color playfulRed = Color(0xFFFF6B6B); // warm accent / error

  // ── Supporting accents (used sparingly, so yellow stays dominant) ──
  static const Color mintGreen = Color(0xFF4FD1A5); // success / growth
  static const Color softPurple = Color(0xFFB79CEC); // secondary section
  static const Color softAmber = Color(0xFFFFB74D); // gentle warning

  // ── Ink / neutrals ──
  static const Color darkNavy = Color(0xFF1F2A4A); // primary text
  static const Color deepNavy = Color(0xFF0F1A2E); // hero / night
  static const Color charcoal = Color(0xFF3E4A5E); // secondary text
  static const Color silver = Color(0xFF90A4AE); // muted text/badges

  // ── Surfaces ──
  static const Color creamBg = Color(0xFFFFC53D); // warm yellow scaffold
  static const Color white = Color(0xFFFFFFFF);
  static const Color offWhite = Color(0xFFFFFDF5); // cards on yellow

  // ── Spacing scale (8pt grid) ──
  static const double spaceXs = 4;
  static const double spaceSm = 8;
  static const double spaceMd = 16;
  static const double spaceLg = 24;
  static const double spaceXl = 32;
  static const double screenPadding = 20;

  // ── Radii ──
  static const double radiusCard = 24;
  static const double radiusBlob = 24;
  static const double radiusSheet = 24;
  static const double radiusButton = 999;
  static const double radiusChip = 999;

  // ── Tap targets ──
  static const double minTapSize = 56;

  // ── Typography ──
  static const double fontDisplay = 36;
  static const double fontHeadline = 30;
  static const double fontTitle = 24;
  static const double fontBody = 18;
  static const double fontCaption = 14;
  static const String headingFontFamily = 'Baloo2';
  static const String bodyFontFamily = 'Nunito';

  // ── Motion ──
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration durationBase = Duration(milliseconds: 250);
  static const Duration durationSlow = Duration(milliseconds: 300);
}
