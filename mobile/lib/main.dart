import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:go_router/go_router.dart';
import 'package:just_audio_media_kit/just_audio_media_kit.dart';
import 'core/theme/app_theme.dart';
import 'core/di/injection.dart';
import 'core/navigation/app_router.dart';
import 'features/auth/presentation/auth_cubit.dart';
import 'features/auth/domain/auth_state.dart';
import 'features/screen_theme/screen_theme_cubit.dart';
import 'firebase_options.dart';

/// Lightweight splash screen shown while app startup completes.
/// The UI is visible immediately; heavy startup work runs in the
/// background without blocking the render thread.
class StartupSplash extends StatefulWidget {
  final Future<void> Function() onStartupCompleted;

  const StartupSplash({super.key, required this.onStartupCompleted});

  @override
  State<StartupSplash> createState() => _StartupSplashState();
}

class _StartupSplashState extends State<StartupSplash> {
  bool _loaded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      try {
        await widget.onStartupCompleted();
      } catch (e) {
        // Never block the app on a startup failure — open it anyway.
        if (kDebugMode) debugPrint('Startup failed (opening app): $e');
      } finally {
        if (mounted) {
          setState(() {
            _loaded = true;
          });
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loaded) {
      return const BariisaaTvApp();
    }
    // MaterialApp provides Directionality/Theme/MediaQuery — without it the
    // splash widgets throw on the first frame and the screen stays black.
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: appLightTheme,
      darkTheme: appDarkTheme,
      themeMode: ThemeMode.system,
      home: _buildSplash(),
    );
  }

  Widget _buildSplash() {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(strokeWidth: 3, color: AppTheme.gold),
            SizedBox(height: 16),
            Text(
              'Bariisaa Tv',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.skyBlue),
            ),
          ],
        ),
      ),
    );
  }
}

/// Heavy startup work that runs after the first frame is painted.
Future<void> _runStartup() async {
  await setupDependencies();
  getIt<ScreenThemeCubit>().load();
  getIt<AuthCubit>().initAuthCheck();
}

Future<void> _initializeFirebase() async {
  if (kIsWeb) {
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    } catch (e) {
      if (kDebugMode) debugPrint('Firebase init skipped: $e');
    }
    return;
  }
  if (Platform.isAndroid || Platform.isIOS || Platform.isMacOS) {
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
    } catch (e) {
      if (kDebugMode) debugPrint('Firebase init skipped: $e');
    }
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    if (kDebugMode) debugPrint('FlutterError: ${details.exceptionAsString()}');
  };
  PlatformDispatcher.instance.onError = (error, stack) {
    if (kDebugMode) debugPrint('Uncaught error: $error\n$stack');
    return true;
  };

  // Show splash first; heavy startup work runs after the first frame.
  // The real app replaces the splash when startup completes.
  runApp(const StartupSplash(onStartupCompleted: _runStartup));
  // Audio backend init off the critical path — no-op on Android/iOS but
  // blocks first frame on desktop (libmpv dlopen).
  JustAudioMediaKit.ensureInitialized();
  _initializeFirebase();
}

/// Key for the scaffold messenger used to show snackbars on the root scaffold.
final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

/// Main application widget with routing and theme configuration.
class BariisaaTvApp extends StatelessWidget {
  const BariisaaTvApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: createProviders(),
      child: BlocListener<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthLogoutLoading) {
            context.go(AppRoutes.login);
          }
          if (state is AuthSessionExpired) {
            context.go(AppRoutes.login);
            rootScaffoldMessengerKey.currentState?.showSnackBar(
              SnackBar(
                content: Text(state.message),
                behavior: SnackBarBehavior.floating,
              ),
            );
          }
        },
        child: MaterialApp.router(
          title: 'Bariisaa Tv',
          debugShowCheckedModeBanner: false,
          scaffoldMessengerKey: rootScaffoldMessengerKey,
          theme: appLightTheme,
          darkTheme: appDarkTheme,
          themeMode: ThemeMode.system,
          routerConfig: createRouter(),
        ),
      ),
    );
  }
}
