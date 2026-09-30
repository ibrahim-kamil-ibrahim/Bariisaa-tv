import 'package:flutter/material.dart';
import 'package:naik_mobile/core/theme/app_theme.dart';
import 'package:naik_mobile/core/theme/kids_design_tokens.dart';
import 'package:naik_mobile/shared/styles.dart';
import 'package:naik_mobile/shared/animations/kids_motion.dart';
import 'package:naik_mobile/shared/widgets/shared_widgets.dart';

/// Standalone Phase 0 design-system preview. Run with:
///   flutter run -t lib/dev/design_preview_main.dart
/// Shows the new kid palette + example widgets for review.
void main() => runApp(const _PreviewApp());

class _PreviewApp extends StatelessWidget {
  const _PreviewApp();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bariisaa — Design Preview',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme(),
      darkTheme: AppTheme.darkTheme(),
      themeMode: ThemeMode.light,
      home: const KidsDesignPreviewScreen(),
    );
  }
}

class KidsDesignPreviewScreen extends StatelessWidget {
  const KidsDesignPreviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('🎨 Kids Design System')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: const [
          _Section(title: 'Palette'),
          _PaletteSwatches(),
          SizedBox(height: 28),
          _Section(title: 'Buttons & emoji taps'),
          _ButtonsPreview(),
          SizedBox(height: 28),
          _Section(title: 'Feedback states'),
          _FeedbackPreview(),
          SizedBox(height: 28),
          _Section(title: 'Celebration & motion'),
          _MotionPreview(),
          SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  const _Section({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title, style: AppStyles.heading(color: AppTheme.darkNavy)),
    );
  }
}

// ── Palette swatches ────────────────────────────────────────────
class _PaletteSwatches extends StatelessWidget {
  const _PaletteSwatches();

  static const Map<String, Color> _swatches = {
    'Sunny Yellow': KidsDesignTokens.sunnyYellow,
    'Sky Blue': KidsDesignTokens.skyBlue,
    'Playful Red': KidsDesignTokens.playfulRed,
    'Mint Green': KidsDesignTokens.mintGreen,
    'Soft Purple': KidsDesignTokens.softPurple,
    'Dark Navy': KidsDesignTokens.darkNavy,
    'Charcoal': KidsDesignTokens.charcoal,
    'Cream BG': KidsDesignTokens.creamBg,
  };

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        for (final e in _swatches.entries)
          Container(
            width: 104,
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 6),
            decoration: BoxDecoration(
              color: e.value,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.silver),
            ),
            child: Column(
              children: [
                const SizedBox(height: 28),
                Text(
                  e.key,
                  textAlign: TextAlign.center,
                  style: AppStyles.caption(
                    color: e.value.computeLuminance() > 0.5
                        ? AppTheme.darkNavy
                        : Colors.white,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

// ── Buttons + emoji taps ────────────────────────────────────────
class _ButtonsPreview extends StatelessWidget {
  const _ButtonsPreview();

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 12,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        BigTapButton(
          color: AppTheme.sunnyYellow,
          onPressed: () {},
          child: Text('Play ▶', style: AppStyles.label(color: AppTheme.deepNavy)),
        ),
        BigTapButton(
          color: AppTheme.skyBlue,
          onPressed: () {},
          child: Text('Read 📖', style: AppStyles.label(color: Colors.white)),
        ),
        BouncyScale(
          onTap: () {},
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: AppTheme.funButtonDecoration(AppTheme.playfulRed),
            child: Text('Tap me!', style: AppStyles.label(color: Colors.white)),
          ),
        ),
        const MascotBubble(emoji: '🎉', size: 72, label: 'Great job!'),
        CategoryBlob(
          emoji: '🎧',
          label: 'Stories',
          color: AppTheme.skyBlue,
          onTap: () {},
        ),
        CategoryBlob(
          emoji: '🎵',
          label: 'Music',
          color: AppTheme.softPurple,
          onTap: () {},
        ),
        CategoryBlob(
          emoji: '🩺',
          label: 'My Doctor',
          color: AppTheme.mintGreen,
          onTap: () {},
        ),
      ],
    );
  }
}

// ── Feedback states ─────────────────────────────────────────────
class _FeedbackPreview extends StatelessWidget {
  const _FeedbackPreview();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          decoration: AppTheme.cardDecoration(),
          padding: const EdgeInsets.all(20),
          child: KidsEmptyState(
            emoji: '🎈',
            title: 'No favorites yet!',
            subtitle: 'Go find something fun to listen to.',
          ),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: AppTheme.cardDecoration(),
          padding: const EdgeInsets.all(20),
          child: const KidsLoadingState(),
        ),
        const SizedBox(height: 16),
        Container(
          decoration: AppTheme.cardDecoration(),
          padding: const EdgeInsets.all(20),
          child: KidsErrorState(onRetry: () {}),
        ),
      ],
    );
  }
}

// ── Celebration & motion ────────────────────────────────────────
class _MotionPreview extends StatelessWidget {
  const _MotionPreview();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const SparkleCelebration(size: 160),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                'A confetti sparkle plays when a task finishes, and buttons bounce on tap (150–300ms).',
                style: AppStyles.body(color: AppTheme.charcoal),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        BigTapButton(
          color: AppTheme.mintGreen,
          onPressed: () => Navigator.of(context).push(
            GentlePageRoute(page: const _SecondPage()),
          ),
          child: Text(
            'Open page (gentle transition)',
            style: AppStyles.label(color: AppTheme.deepNavy),
          ),
        ),
      ],
    );
  }
}

class _SecondPage extends StatelessWidget {
  const _SecondPage();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('✨ Gentle transition')),
      body: const Center(child: Text('It faded and slid in gently!', style: TextStyle(fontSize: 20))),
    );
  }
}
