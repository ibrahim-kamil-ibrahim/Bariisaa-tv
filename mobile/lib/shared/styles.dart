import 'package:flutter/material.dart';

/// App-wide text styles. Two bundled families:
///   Baloo2 — rounded, for headings / buttons / big numbers
///   Nunito — friendly, for body text / labels
/// Early-reader defaults: generous line-height + letter-spacing.
class AppStyles {
  static const String headingFamily = 'Baloo2';
  static const String bodyFamily = 'Nunito';
  static const List<String> _fallback = ['NotoSansEthiopic', 'NotoColorEmoji'];

  static TextStyle baloo2({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? height,
    TextDecoration? decoration,
    Color? decorationColor,
    TextDecorationStyle? decorationStyle,
    double? decorationThickness,
    double? letterSpacing,
    double? wordSpacing,
    FontStyle? fontStyle,
    TextOverflow? overflow,
    List<Shadow>? shadows,
  }) {
    return TextStyle(
      fontFamily: headingFamily,
      fontFamilyFallback: _fallback,
      fontSize: fontSize ?? 14,
      fontWeight: fontWeight ?? FontWeight.w700,
      color: color,
      height: height ?? 1.15,
      letterSpacing: letterSpacing ?? 0.3,
      decoration: decoration,
      decorationColor: decorationColor,
      decorationStyle: decorationStyle,
      decorationThickness: decorationThickness,
      wordSpacing: wordSpacing,
      fontStyle: fontStyle,
      overflow: overflow,
      shadows: shadows,
    );
  }

  static TextStyle nunito({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? height,
    TextDecoration? decoration,
    Color? decorationColor,
    TextDecorationStyle? decorationStyle,
    double? decorationThickness,
    double? letterSpacing,
    double? wordSpacing,
    FontStyle? fontStyle,
    TextOverflow? overflow,
    List<Shadow>? shadows,
  }) {
    return TextStyle(
      fontFamily: bodyFamily,
      fontFamilyFallback: _fallback,
      fontSize: fontSize ?? 14,
      fontWeight: fontWeight ?? FontWeight.w600,
      color: color,
      height: height ?? 1.4,
      letterSpacing: letterSpacing ?? 0.2,
      decoration: decoration,
      decorationColor: decorationColor,
      decorationStyle: decorationStyle,
      decorationThickness: decorationThickness,
      wordSpacing: wordSpacing,
      fontStyle: fontStyle,
      overflow: overflow,
      shadows: shadows,
    );
  }

  // ── Convenience getters (kid-first sizes) ──
  static TextStyle display({Color? color}) =>
      baloo2(fontSize: 36, fontWeight: FontWeight.w700, color: color);

  static TextStyle heading({Color? color, double? fontSize}) => baloo2(
    fontSize: fontSize ?? 28,
    fontWeight: FontWeight.w700,
    color: color,
  );

  static TextStyle title({Color? color}) =>
      baloo2(fontSize: 22, fontWeight: FontWeight.w700, color: color);

  static TextStyle body({Color? color}) =>
      nunito(fontSize: 16, fontWeight: FontWeight.w600, color: color);

  static TextStyle caption({Color? color}) =>
      nunito(fontSize: 14, fontWeight: FontWeight.w600, color: color);

  static TextStyle label({Color? color}) =>
      nunito(fontSize: 18, fontWeight: FontWeight.w800, color: color);
}
