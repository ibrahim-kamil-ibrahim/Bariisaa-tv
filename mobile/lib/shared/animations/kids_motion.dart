import 'dart:math';
import 'package:flutter/material.dart';
import 'package:naik_mobile/core/theme/app_theme.dart';

/// ─────────────────────────────────────────────────────────────
///  KIDS MOTION — reusable micro-animations (150–300ms, snappy)
///   1. BouncyScale    → button-press bounce
///   2. ConfettiBurst  → success sparkle/confetti overlay
///   3. GentlePageRoute→ soft fade + slide-up page transition
/// ─────────────────────────────────────────────────────────────

/// Wraps a child in a press-bounce (scale 1.0 → 0.93) — used for any
/// tappable surface that isn't already `BigTapButton`.
class BouncyScale extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  const BouncyScale({super.key, required this.child, this.onTap});

  @override
  State<BouncyScale> createState() => _BouncyScaleState();
}

class _BouncyScaleState extends State<BouncyScale>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: KidsMotion.durationFast,
    );
    _scale = Tween<double>(
      begin: 1.0,
      end: 0.93,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) {
        _controller.reverse();
        widget.onTap?.call();
      },
      onTapCancel: () => _controller.reverse(),
      child: AnimatedBuilder(
        animation: _scale,
        builder: (context, child) =>
            Transform.scale(scale: _scale.value, child: child),
        child: widget.child,
      ),
    );
  }
}

/// One-shot sparkle + confetti celebration (plays on mount, ~2s).
/// Distinct from `ConfettiBurst` in shared_widgets.dart (which is
/// trigger-based); this is a self-contained "success!" burst.
class SparkleCelebration extends StatefulWidget {
  final double size;
  final String emoji;
  const SparkleCelebration({super.key, this.size = 200, this.emoji = '🎉'});

  @override
  State<SparkleCelebration> createState() => _SparkleCelebrationState();
}

class _SparkleCelebrationState extends State<SparkleCelebration>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) => CustomPaint(
          painter: _ConfettiPainter(progress: _controller.value),
          child: child,
        ),
        child: Center(
          child: Opacity(
            opacity: (1.0 - _controller.value).clamp(0.0, 1.0),
            child: Text(widget.emoji, style: const TextStyle(fontSize: 56)),
          ),
        ),
      ),
    );
  }
}

class _ConfettiPainter extends CustomPainter {
  final double progress;
  _ConfettiPainter({required this.progress});

  static const List<Color> _colors = [
    AppTheme.sunnyYellow,
    AppTheme.skyBlue,
    AppTheme.playfulRed,
    AppTheme.mintGreen,
    AppTheme.softPurple,
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final random = Random(42);
    final center = Offset(size.width / 2, size.height / 2);

    for (int i = 0; i < 24; i++) {
      final angle = (i * 2 * pi / 24) + progress * pi;
      final distance =
          20.0 + progress * (size.width * 0.45) + random.nextDouble() * 20;
      final x = center.dx + cos(angle) * distance;
      final y = center.dy + sin(angle) * distance - progress * 30;
      final radius = 2.5 + random.nextDouble() * 4.5;
      final opacity = (1.0 - progress).clamp(0.0, 1.0);

      final paint = Paint()
        ..color = _colors[i % _colors.length].withValues(alpha: opacity)
        ..style = PaintingStyle.fill;
      canvas.drawCircle(Offset(x, y), radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ConfettiPainter oldDelegate) =>
      oldDelegate.progress != progress;
}

/// Gentle page transition: fade + subtle slide-up, 250ms.
class GentlePageRoute<T> extends PageRouteBuilder<T> {
  GentlePageRoute({required Widget page, super.settings})
    : super(
        transitionDuration: const Duration(milliseconds: 250),
        reverseTransitionDuration: const Duration(milliseconds: 200),
        pageBuilder: (_, _, _) => page,
        transitionsBuilder: (_, animation, _, child) {
          final curved = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          );
          return FadeTransition(
            opacity: curved,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: const Offset(0, 0.03),
                end: Offset.zero,
              ).animate(curved),
              child: child,
            ),
          );
        },
      );
}

/// Motion durations shared across the system (see KidsDesignTokens).
class KidsMotion {
  KidsMotion._();
  static const Duration durationFast = Duration(milliseconds: 150);
  static const Duration durationBase = Duration(milliseconds: 250);
  static const Duration durationSlow = Duration(milliseconds: 300);
}
