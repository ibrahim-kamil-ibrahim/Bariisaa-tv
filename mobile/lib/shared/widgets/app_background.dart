import 'package:flutter/material.dart';

/// App-wide full-bleed background image with a readability scrim.
///
/// Every screen that isn't covered by [ThemedScreenScaffold] (e.g. the
/// Discovery home) can drop this in as the bottom-most Stack layer. The
/// scrim keeps cards/legible content readable over busy photos.
class AppBackground extends StatelessWidget {
  final Widget? child;

  const AppBackground({super.key, this.child});

  static const String assetPath = 'assets/images/app_bg.jpg';

  /// Convenience builder: full-bleed image + soft scrim (+ optional child).
  static Widget image({Widget? child}) => AppBackground(child: child);

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Image.asset(
          assetPath,
          fit: BoxFit.cover,
          errorBuilder: (_, _, _) => const ColoredBox(color: Color(0xFFFFC53D)),
        ),
        // Soft cream scrim: keeps the background visible but guarantees
        // contrast for dark text on cards across any photo.
        ColoredBox(color: Colors.white.withValues(alpha: 0.18)),
        ?child,
      ],
    );
  }
}
