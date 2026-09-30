import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:naik_mobile/shared/styles.dart';
import 'package:naik_mobile/core/theme/kids_design_tokens.dart';

/// ─────────────────────────────────────────────────────────────
///  BARIISAA TV — brand theme: yellow-first with blue accents
///  Backgrounds/surfaces are warm yellow; blue is used for active
///  states, icons, and accents. White is used for cards/text
///  readability against yellow.
/// ─────────────────────────────────────────────────────────────
class AppTheme {
  AppTheme._();

  // ═══════════════════════════════════════════════
  //  CANONICAL BRAND TOKENS
  // ═══════════════════════════════════════════════
  static const Color sunnyYellow = KidsDesignTokens.sunnyYellow;
  static const Color skyBlue = KidsDesignTokens.skyBlue;
  static const Color skyBlueLight = KidsDesignTokens.skyBlueLight;
  static const Color playfulRed = KidsDesignTokens.playfulRed;
  static const Color mintGreen = KidsDesignTokens.mintGreen;
  static const Color softPurple = KidsDesignTokens.softPurple;
  static const Color softAmber = KidsDesignTokens.softAmber;
  static const Color darkNavy = KidsDesignTokens.darkNavy;
  static const Color deepNavy = KidsDesignTokens.deepNavy;
  static const Color charcoal = KidsDesignTokens.charcoal;
  static const Color silver = KidsDesignTokens.silver;
  static const Color creamBg = KidsDesignTokens.creamBg;
  static const Color white = KidsDesignTokens.white;
  static const Color offWhite = KidsDesignTokens.offWhite;

  // ── Brand colors (kids-first yellow/blue palette) ──
  static const Color primaryYellow = sunnyYellow;   // #FFC53D — bg, CTA, warm
  static const Color accentBlue = skyBlue;          // #2196F3 — active, icons, links
  static const Color accentBlueLight = skyBlueLight;// #81D4FA — decorative
  static const Color errorRed = playfulRed;         // #FF6B6B — error, warn
  static const Color successGreen = mintGreen;      // #4FD1A5 — success
  static const Color sectionPurple = softPurple;    // #B79CEC — secondary sections
  static const Color textDark = darkNavy;           // #1F2A4A — primary text
  static const Color textNavy = deepNavy;           // #0F1A2E — hero, dark mode bg
  static const Color textSecondary = charcoal;      // #3E4A5E — secondary text
  static const Color textMuted = silver;            // #90A4AE — hints, disabled
  static const Color surfaceWhite = white;          // #FFFFFF — cards, modals
  static const Color surfaceOffWhite = offWhite;    // #FFFDF5 — card inner
  static const Color bgYellow = creamBg;            // #FFC53D — scaffold
  static const Color gold = sunnyYellow;            // alias for CTA

  // ── Additional semantic colors used across the app ──
  static const Color darkText = textDark;           // #1F2A4A — alias for primary text
  static const Color cardShadow = Color(0x1A1F2A4A);  // subtle shadow
  static const Color textShadow = Color(0x401F2A4A);   // text shadow overlay
  static const Color creamText = Color(0xFFF5E6B8);   // warm cream text
  static const Color softGrey = Color(0xFFE8E8E8);    // neutral grey
  static const Color freshGreen = Color(0xFF4FD1A5);  // success green
  static const Color lightPurple = Color(0xFFB79CEC); // soft purple
  static const Color softWhite = Color(0xFFF8F9FA);   // near-white
  static const Color deepPurple = Color(0xFF7C4DFF);  // deep purple accent
  static const Color cardPurple = Color(0xFFEDE7F6);  // light purple card
  static const Color deepIndigo = Color(0xFF3F51B5);  // deep indigo

  // ── Parent-zone theme (separate, muted, adult) ──
  static const Color parentBg = Color(0xFFFFF8E1);
  static const Color parentCard = Color(0xFFFFFFFF);
  static const Color parentText = Color(0xFF444444);
  static const Color parentMuted = Color(0xFF999999);

  // ── Shape constants ──
  static const double cardRadius = KidsDesignTokens.radiusCard;
  static const double buttonRadius = KidsDesignTokens.radiusButton;
  static const double chipRadius = KidsDesignTokens.radiusChip;
  static const double blobRadius = KidsDesignTokens.radiusBlob;
  static const double minTapSize = KidsDesignTokens.minTapSize;

  // ── Font sizes (early-reader friendly — big!) ──
  static const double displaySize = KidsDesignTokens.fontDisplay;
  static const double headlineSize = KidsDesignTokens.fontHeadline;
  static const double titleSize = KidsDesignTokens.fontTitle;
  static const double bodySize = KidsDesignTokens.fontBody;
  static const double captionSize = KidsDesignTokens.fontCaption;

  static TextStyle get headingFont =>
      AppStyles.baloo2(fontWeight: FontWeight.w700, color: darkText);
  static TextStyle get bodyFont =>
      AppStyles.nunito(fontWeight: FontWeight.w600, color: darkText);

  // ── Soft shadow ──
  static List<BoxShadow> clayShadow({
    Color? color,
    double blur = 30,
    double dy = 10,
    double spread = -5,
  }) {
    return [
      BoxShadow(
        color: color ?? cardShadow,
        blurRadius: blur,
        offset: Offset(0, dy),
        spreadRadius: spread,
      ),
    ];
  }

  // ── Gradients ──
  static LinearGradient heroGradient() => const LinearGradient(
    colors: [Color(0xFF1F2A4A), Color(0xFF2196F3)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static LinearGradient backgroundGradient() => const LinearGradient(
    colors: [Color(0xFFFFC53D), Color(0xFFFFE082)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );

  // ── Shared decorations ──
  static BoxDecoration blobDecoration(Color color) => BoxDecoration(
    borderRadius: BorderRadius.circular(blobRadius),
    gradient: LinearGradient(
      colors: [color.withValues(alpha: 0.85), color],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    boxShadow: clayShadow(
      color: color.withValues(alpha: 0.28),
      blur: 20,
      dy: 8,
      spread: -3,
    ),
  );

  static BoxDecoration cardDecoration() => BoxDecoration(
    color: offWhite,
    borderRadius: BorderRadius.circular(cardRadius),
    boxShadow: clayShadow(),
  );

  static BoxDecoration funButtonDecoration(Color color) => BoxDecoration(
    borderRadius: BorderRadius.circular(buttonRadius),
    gradient: LinearGradient(
      colors: [color.withValues(alpha: 0.95), color],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    ),
    boxShadow: clayShadow(
      color: color.withValues(alpha: 0.35),
      blur: 18,
      dy: 8,
      spread: -4,
    ),
  );

  // ── Profile screen decorations ──
  static LinearGradient shimmerGoldGradient() => LinearGradient(
    colors: [
      sunnyYellow.withValues(alpha: 0.0),
      sunnyYellow.withValues(alpha: 0.45),
      sunnyYellow.withValues(alpha: 0.0),
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static BoxDecoration profileCardDecoration() => BoxDecoration(
    borderRadius: BorderRadius.circular(cardRadius),
    boxShadow: [
      BoxShadow(
        color: skyBlue.withValues(alpha: 0.18),
        blurRadius: 30,
        spreadRadius: 2,
      ),
      ...clayShadow(),
    ],
  );

  static BoxDecoration gridCardDecoration(Color color) => BoxDecoration(
    borderRadius: BorderRadius.circular(20),
    gradient: LinearGradient(
      colors: [color.withValues(alpha: 0.35), color.withValues(alpha: 0.18)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    border: Border.all(color: color.withValues(alpha: 0.35)),
  );

  // ═══════════════════════════════════════════════
  //  LIGHT THEME — yellow primary surface, blue accent
  // ═══════════════════════════════════════════════
  static ThemeData lightTheme() {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Nunito',
      fontFamilyFallback: const ['NotoSansEthiopic', 'NotoColorEmoji'],
      brightness: Brightness.light,
      scaffoldBackgroundColor: creamBg,
      colorScheme: const ColorScheme.light(
        primary: sunnyYellow,
        onPrimary: deepNavy,
        secondary: skyBlue,
        onSecondary: white,
        tertiary: softPurple,
        onTertiary: darkNavy,
        surface: offWhite,
        onSurface: darkNavy,
        error: playfulRed,
        onError: white,
      ),
      textTheme: TextTheme(
        displayLarge: AppStyles.baloo2(
          fontSize: displaySize,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.1,
        ),
        displayMedium: AppStyles.baloo2(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.1,
        ),
        displaySmall: AppStyles.baloo2(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.1,
        ),
        headlineLarge: AppStyles.baloo2(
          fontSize: headlineSize,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.2,
        ),
        headlineMedium: AppStyles.baloo2(
          fontSize: headlineSize,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.2,
        ),
        headlineSmall: AppStyles.baloo2(
          fontSize: 26,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.2,
        ),
        titleLarge: AppStyles.baloo2(
          fontSize: titleSize,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.2,
        ),
        titleMedium: AppStyles.baloo2(
          fontSize: titleSize,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.2,
        ),
        titleSmall: AppStyles.baloo2(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: darkText,
          height: 1.2,
        ),
        bodyLarge: AppStyles.nunito(
          fontSize: bodySize,
          fontWeight: FontWeight.w600,
          color: darkText,
          height: 1.5,
        ),
        bodyMedium: AppStyles.nunito(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: darkText,
          height: 1.4,
        ),
        bodySmall: AppStyles.nunito(
          fontSize: captionSize,
          fontWeight: FontWeight.w500,
          color: silver,
          height: 1.3,
        ),
        labelLarge: AppStyles.nunito(
          fontSize: bodySize,
          fontWeight: FontWeight.w700,
          color: darkText,
        ),
        labelMedium: AppStyles.nunito(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: darkText,
        ),
        labelSmall: AppStyles.nunito(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: silver,
        ),
      ).apply(bodyColor: darkText, displayColor: darkText),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: sunnyYellow,
        surfaceTintColor: Colors.transparent,
        foregroundColor: deepNavy,
        toolbarHeight: 68,
        titleSpacing: 12,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        iconTheme: const IconThemeData(size: 26, color: deepNavy),
        actionsIconTheme: const IconThemeData(size: 26, color: deepNavy),
        titleTextStyle: AppStyles.baloo2(
          fontSize: titleSize,
          fontWeight: FontWeight.w700,
          color: deepNavy,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: offWhite,
        shadowColor: cardShadow,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(cardRadius)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: offWhite,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(buttonRadius),
          borderSide: const BorderSide(color: skyBlue, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(buttonRadius),
          borderSide: const BorderSide(color: skyBlue, width: 2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(buttonRadius)),
          borderSide: const BorderSide(color: sunnyYellow, width: 3),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 24,
          vertical: 18,
        ),
        hintStyle: AppStyles.nunito(
          fontSize: 16,
          color: silver,
          fontWeight: FontWeight.w600,
        ),
        labelStyle: AppStyles.nunito(
          fontSize: 16,
          color: darkNavy,
          fontWeight: FontWeight.w700,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: sunnyYellow,
          foregroundColor: deepNavy,
          minimumSize: const Size(double.infinity, 60),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
          textStyle: AppStyles.nunito(
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
          elevation: 0,
          shadowColor: sunnyYellow.withValues(alpha: 0.35),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: skyBlue,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          textStyle: AppStyles.nunito(
            fontSize: 18,
            fontWeight: FontWeight.w700,
          ),
          minimumSize: const Size(minTapSize, minTapSize),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: skyBlue,
          side: const BorderSide(color: skyBlue, width: 3),
          minimumSize: const Size(double.infinity, 60),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
          textStyle: AppStyles.nunito(
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: sunnyYellow,
        foregroundColor: deepNavy,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        elevation: 4,
        sizeConstraints: const BoxConstraints(minWidth: 68, minHeight: 68),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: skyBlue.withValues(alpha: 0.12),
        selectedColor: skyBlue,
        labelStyle: AppStyles.nunito(
          fontSize: 15,
          fontWeight: FontWeight.w700,
          color: deepNavy,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(chipRadius),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: sunnyYellow,
        indicatorColor: skyBlue.withValues(alpha: 0.22),
        surfaceTintColor: Colors.transparent,
        elevation: 4,
        shadowColor: cardShadow,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected))
            return AppStyles.nunito(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: skyBlue,
            );
          return AppStyles.nunito(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: deepNavy,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected))
            return const IconThemeData(size: 30, color: skyBlue);
          return const IconThemeData(size: 28, color: deepNavy);
        }),
      ),
      sliderTheme: SliderThemeData(
        trackHeight: 8,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
        overlayShape: const RoundSliderOverlayShape(overlayRadius: 28),
        activeTrackColor: sunnyYellow,
        inactiveTrackColor: skyBlue.withValues(alpha: 0.35),
        thumbColor: sunnyYellow,
        overlayColor: sunnyYellow.withValues(alpha: 0.15),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(blobRadius),
        ),
        elevation: 6,
        shadowColor: cardShadow,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        elevation: 6,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(chipRadius),
        ),
        elevation: 6,
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE8E8E8),
        thickness: 1,
        space: 1,
      ),
      iconTheme: const IconThemeData(size: 28, color: deepNavy),
    );
  }

  // ═══════════════════════════════════════════════
  //  DARK THEME — deep navy with yellow/blue accents
  // ═══════════════════════════════════════════════
  static ThemeData darkTheme() {
    const textMain = Color(0xFFF5F3E8);
    const textMuted = Color(0xFFB9C2D4);
    const surfaceDark = Color(0xFF2E3C5C);
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Nunito',
      fontFamilyFallback: const ['NotoSansEthiopic', 'NotoColorEmoji'],
      brightness: Brightness.dark,
      scaffoldBackgroundColor: deepNavy,
      colorScheme: const ColorScheme.dark(
        primary: sunnyYellow,
        onPrimary: deepNavy,
        secondary: skyBlue,
        onSecondary: white,
        tertiary: mintGreen,
        onTertiary: deepNavy,
        surface: surfaceDark,
        onSurface: textMain,
        error: playfulRed,
        onError: white,
      ),
      textTheme: TextTheme(
        displayLarge: AppStyles.baloo2(
          fontSize: displaySize,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.1,
        ),
        displayMedium: AppStyles.baloo2(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.1,
        ),
        displaySmall: AppStyles.baloo2(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.1,
        ),
        headlineLarge: AppStyles.baloo2(
          fontSize: headlineSize,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.2,
        ),
        headlineMedium: AppStyles.baloo2(
          fontSize: headlineSize,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.2,
        ),
        headlineSmall: AppStyles.baloo2(
          fontSize: 26,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.2,
        ),
        titleLarge: AppStyles.baloo2(
          fontSize: titleSize,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.2,
        ),
        titleMedium: AppStyles.baloo2(
          fontSize: titleSize,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.2,
        ),
        titleSmall: AppStyles.baloo2(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.2,
        ),
        bodyLarge: AppStyles.nunito(
          fontSize: bodySize,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.5,
        ),
        bodyMedium: AppStyles.nunito(
          fontSize: 16,
          fontWeight: FontWeight.w700,
          color: textMain,
          height: 1.4,
        ),
        bodySmall: AppStyles.nunito(
          fontSize: captionSize,
          fontWeight: FontWeight.w600,
          color: textMuted,
          height: 1.3,
        ),
        labelLarge: AppStyles.nunito(
          fontSize: bodySize,
          fontWeight: FontWeight.w800,
          color: textMain,
        ),
        labelMedium: AppStyles.nunito(
          fontSize: 16,
          fontWeight: FontWeight.w800,
          color: textMain,
        ),
        labelSmall: AppStyles.nunito(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: textMuted,
        ),
      ).apply(bodyColor: textMain, displayColor: textMain),
      appBarTheme: AppBarTheme(
        centerTitle: false,
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: deepNavy,
        surfaceTintColor: Colors.transparent,
        foregroundColor: textMain,
        toolbarHeight: 68,
        titleSpacing: 12,
        systemOverlayStyle: SystemUiOverlayStyle.light,
        iconTheme: const IconThemeData(size: 26, color: sunnyYellow),
        actionsIconTheme: const IconThemeData(size: 26, color: sunnyYellow),
        titleTextStyle: AppStyles.baloo2(
          fontSize: titleSize,
          fontWeight: FontWeight.w700,
          color: textMain,
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: surfaceDark,
        shadowColor: Colors.transparent,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(cardRadius)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceDark,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(buttonRadius),
          borderSide: const BorderSide(color: surfaceDark, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(buttonRadius),
          borderSide: const BorderSide(color: surfaceDark, width: 2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.all(Radius.circular(buttonRadius)),
          borderSide: const BorderSide(color: sunnyYellow, width: 3),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 24,
          vertical: 18,
        ),
        hintStyle: AppStyles.nunito(
          fontSize: 16,
          color: textMuted,
          fontWeight: FontWeight.w600,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: sunnyYellow,
          foregroundColor: deepNavy,
          minimumSize: const Size(double.infinity, 60),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 18),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(buttonRadius),
          ),
          textStyle: AppStyles.nunito(
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
          elevation: 0,
        ),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: sunnyYellow,
        foregroundColor: deepNavy,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
        elevation: 4,
        sizeConstraints: const BoxConstraints(minWidth: 68, minHeight: 68),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surfaceDark,
        indicatorColor: sunnyYellow.withValues(alpha: 0.3),
        surfaceTintColor: Colors.transparent,
        elevation: 4,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected))
            return AppStyles.nunito(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: sunnyYellow,
            );
          return AppStyles.nunito(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: textMuted,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected))
            return const IconThemeData(size: 30, color: sunnyYellow);
          return const IconThemeData(size: 28, color: textMuted);
        }),
      ),
      sliderTheme: SliderThemeData(
        trackHeight: 8,
        thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
        overlayShape: const RoundSliderOverlayShape(overlayRadius: 28),
        activeTrackColor: sunnyYellow,
        inactiveTrackColor: surfaceDark,
        thumbColor: sunnyYellow,
        overlayColor: sunnyYellow.withValues(alpha: 0.15),
      ),
      dialogTheme: DialogThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(blobRadius),
        ),
        elevation: 6,
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        elevation: 6,
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(chipRadius),
        ),
        elevation: 6,
      ),
      iconTheme: const IconThemeData(size: 28, color: textMain),
    );
  }

  // ═══════════════════════════════════════════════
  //  PARENT ZONE THEME
  // ═══════════════════════════════════════════════
  static ThemeData parentTheme() {
    final base = lightTheme();
    return base.copyWith(
      scaffoldBackgroundColor: parentBg,
      appBarTheme: base.appBarTheme.copyWith(
        backgroundColor: parentBg,
        foregroundColor: parentText,
        titleTextStyle: AppStyles.nunito(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: parentText,
        ),
      ),
      cardTheme: base.cardTheme.copyWith(color: parentCard),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: base.elevatedButtonTheme.style?.copyWith(
          backgroundColor: WidgetStateProperty.all(const Color(0xFF607D8B)),
          foregroundColor: WidgetStateProperty.all(white),
          minimumSize: WidgetStateProperty.all(const Size(double.infinity, 52)),
          padding: WidgetStateProperty.all(
            const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          ),
          shape: WidgetStateProperty.all(
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          textStyle: WidgetStateProperty.all(
            AppStyles.nunito(fontSize: 16, fontWeight: FontWeight.w700),
          ),
        ),
      ),
      colorScheme: base.colorScheme.copyWith(
        primary: const Color(0xFF607D8B),
        secondary: const Color(0xFF78909C),
      ),
    );
  }
}
