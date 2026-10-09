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

final GlobalKey<ScaffoldMessengerState> rootScaffoldMessengerKey =
    GlobalKey<ScaffoldMessengerState>();

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

  JustAudioMediaKit.ensureInitialized();
  await setupDependencies();
  getIt<ScreenThemeCubit>().load();
  getIt<AuthCubit>().checkAuthStatus();
  runApp(const BariisaaTvApp());
  _initializeFirebase();
}

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
          theme: AppTheme.lightTheme(),
          darkTheme: AppTheme.darkTheme(),
          themeMode: ThemeMode.system,
          routerConfig: createRouter(),
        ),
      ),
    );
  }
}
