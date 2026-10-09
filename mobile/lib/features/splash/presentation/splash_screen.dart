import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/navigation/app_router.dart';

import 'dart:async';
import 'dart:math' as math;

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final AnimationController _floatCtrl;

  // ── Logo animations ──
  late final Animation<double> _logoFade;
  late final Animation<double> _logoScale;

  // ── Title animations ──
  late final Animation<double> _titleFade;
  late final Animation<Offset> _titleSlide;

  bool _navigated = false;
  Timer? _navTimer;

  @override
  void initState() {
    super.initState();

    // ── Main entrance controller (plays once) ──
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );

    // ── Float controller (repeats forever) ──
    _floatCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    )..repeat(reverse: true);

    // ── Logo: fade in 0→0.45, elastic scale 0→0.55 ──
    _logoFade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.0, 0.45, curve: Curves.easeOut),
      ),
    );
    _logoScale = Tween<double>(begin: 0.3, end: 1).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.0, 0.55, curve: Curves.elasticOut),
      ),
    );

    // ── Title: slide up + fade 0.3→0.7 ──
    _titleFade = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _ctrl,
        curve: const Interval(0.30, 0.70, curve: Curves.easeOut),
      ),
    );
    _titleSlide = Tween<Offset>(begin: const Offset(0, 0.5), end: Offset.zero)
        .animate(
          CurvedAnimation(
            parent: _ctrl,
            curve: const Interval(0.30, 0.75, curve: Curves.easeOutCubic),
          ),
        );

    _ctrl.forward();

    // Navigate once the entrance animation completes (branding still gets
    // ~2.4s of screen time — no arbitrary 10s hold).
    _navTimer = Timer(const Duration(milliseconds: 2400), () {
      if (!_navigated && mounted) {
        _navigated = true;
        context.go(AppRoutes.discovery);
      }
    });
  }

  @override
  void dispose() {
    _navTimer?.cancel();
    _ctrl.dispose();
    _floatCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        body: Container(
          width: double.infinity,
          height: double.infinity,
          decoration: BoxDecoration(gradient: AppTheme.heroGradient()),
          child: AnimatedBuilder(
            animation: Listenable.merge([_ctrl, _floatCtrl]),
            builder: (context, _) {
              // Subtle sine-wave float: ±5 px, driven by repeating controller
              final floatY = math.sin(_floatCtrl.value * math.pi) * 5.0;

              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // ── Logo: scale + fade + float ──
                    FadeTransition(
                      opacity: _logoFade,
                      child: Transform.translate(
                        offset: Offset(0, floatY),
                        child: ScaleTransition(
                          scale: _logoScale,
                          child: Image.asset(
                            'assets/images/logo.png',
                            width: 160,
                            height: 160,
                            fit: BoxFit.contain,
                            filterQuality: FilterQuality.high,
                            errorBuilder: (_, _, _) => const Text(
                              'B',
                              style: TextStyle(
                                fontSize: 80,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.gold,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    // ── Title: slide-up + fade + gentle float ──
                    FadeTransition(
                      opacity: _titleFade,
                      child: SlideTransition(
                        position: _titleSlide,
                        child: Transform.translate(
                          offset: Offset(0, floatY * 0.4),
                          child: Text(
                            'Bariisaa Tv',
                            style: AppStyles.baloo2(
                              fontSize: 36,
                              fontWeight: FontWeight.w700,
                              color: AppTheme.white,
                              shadows: [
                                Shadow(
                                  color: Colors.black.withValues(alpha: 0.15),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
