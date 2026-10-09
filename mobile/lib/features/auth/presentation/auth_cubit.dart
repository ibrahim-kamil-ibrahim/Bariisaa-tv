import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/auth_state.dart';
import '../data/auth_repository.dart';
import '../../../shared/models/models.dart';

class AuthCubit extends Cubit<AuthState> {
  final AuthRepository _repository;

  AuthCubit(this._repository) : super(AuthInitial());

  UserModel? get currentUser {
    final s = state;
    if (s is AuthAuthenticated) return s.user;
    if (s is AuthOtpVerified) return s.user;
    return null;
  }

  Future<void> checkAuthStatus() async {
    emit(AuthLoading());
    try {
      final loggedIn = await _repository.isLoggedIn();
      if (!loggedIn) {
        emit(const AuthGuest());
        return;
      }
      final user = await _repository.restoreSession();
      if (user != null) {
        emit(AuthAuthenticated(user));
      } else {
        emit(const AuthGuest());
      }
    } catch (e) {
      emit(const AuthGuest());
    }
  }

  Future<void> signupEmail({
    required String name,
    required String email,
    required String password,
    int? age,
    String? gender,
    String? avatar,
  }) async {
    emit(AuthSignupLoading());
    try {
      final user = await _repository.signupEmail(
        name: name,
        email: email,
        password: password,
        age: age,
        gender: gender,
        avatar: avatar,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(_toMessage(e)));
    }
  }

  Future<void> signupPhone({
    required String name,
    required String phone,
    required String password,
    int? age,
    String? gender,
    String? avatar,
  }) async {
    emit(AuthSignupLoading());
    try {
      final user = await _repository.signupPhone(
        name: name,
        phone: phone,
        password: password,
        age: age,
        gender: gender,
        avatar: avatar,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(_toMessage(e)));
    }
  }

  Future<void> signupUsername({
    required String name,
    required String username,
    required String password,
    int? age,
    String? gender,
    String? avatar,
  }) async {
    emit(AuthSignupLoading());
    try {
      final user = await _repository.signupUsername(
        name: name,
        username: username,
        password: password,
        age: age,
        gender: gender,
        avatar: avatar,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(_toMessage(e)));
    }
  }

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    emit(AuthLoginLoading());
    try {
      final user = await _repository.login(
        identifier: identifier,
        password: password,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(_toMessage(e)));
    }
  }

  Future<void> loginUsername({
    required String username,
    required String password,
  }) async {
    emit(AuthLoginLoading());
    try {
      final user = await _repository.loginUsername(
        username: username,
        password: password,
      );
      emit(AuthAuthenticated(user));
    } catch (e) {
      emit(AuthError(_toMessage(e)));
    }
  }

  Future<void> logout() async {
    emit(AuthLogoutLoading());
    try {
      await _repository.logout();
    } catch (_) {}
    emit(const AuthGuest());
  }

  void continueAsGuest() {
    emit(const AuthGuest());
  }

  /// Called by ApiClient when the refresh token is rejected (session dead).
  /// Only acts when the user currently appears signed in.
  void handleSessionExpired() {
    final s = state;
    if (s is AuthAuthenticated || s is AuthOtpVerified) {
      emit(const AuthSessionExpired(
        'Your session has expired. Please sign in again.',
      ));
    }
  }

  Future<void> sendEmailOtp(String email) async {
    final prev = state;
    emit(AuthOtpLoading());
    try {
      await _repository.sendEmailOtp(email);
      emit(AuthOtpSent(identifier: email, isEmail: true));
    } catch (e) {
      // Restore previous state so the user isn't lost
      if (prev is AuthAuthenticated) {
        emit(prev);
      }
      emit(AuthError(_toMessage(e)));
    }
  }

  Future<void> verifyEmailOtp(String email, String code) async {
    final prev = state;
    emit(AuthOtpLoading());
    try {
      await _repository.verifyEmailOtp(email, code);
      // Look up user from previous authenticated state
      UserModel? user;
      if (prev is AuthAuthenticated) {
        user = prev.user;
      }
      // Try to get current user from stored data
      user ??= currentUser;
      if (user != null) {
        emit(AuthOtpVerified('Email verified successfully', user));
      } else {
        // Fallback: restore session to get user
        final restored = await _repository.restoreSession();
        if (restored != null) {
          emit(AuthOtpVerified('Email verified successfully', restored));
        } else {
          emit(const AuthGuest());
        }
      }
    } catch (e) {
      if (prev is AuthAuthenticated) {
        emit(prev);
      }
      emit(AuthError(_toMessage(e)));
    }
  }

  Future<void> sendPhoneOtp(String phone) async {
    final prev = state;
    emit(AuthOtpLoading());
    try {
      await _repository.sendPhoneOtp(phone);
      emit(AuthOtpSent(identifier: phone, isEmail: false));
    } catch (e) {
      if (prev is AuthAuthenticated) {
        emit(prev);
      }
      emit(AuthError(_toMessage(e)));
    }
  }

  Future<void> verifyPhoneOtp(String phone, String code) async {
    final prev = state;
    emit(AuthOtpLoading());
    try {
      await _repository.verifyPhoneOtp(phone, code);
      UserModel? user;
      if (prev is AuthAuthenticated) {
        user = prev.user;
      }
      user ??= currentUser;
      if (user != null) {
        emit(AuthOtpVerified('Phone verified successfully', user));
      } else {
        final restored = await _repository.restoreSession();
        if (restored != null) {
          emit(AuthOtpVerified('Phone verified successfully', restored));
        } else {
          emit(const AuthGuest());
        }
      }
    } catch (e) {
      if (prev is AuthAuthenticated) {
        emit(prev);
      }
      emit(AuthError(_toMessage(e)));
    }
  }

  String _toMessage(Object e) {
    // 1. Extract server message from DioException FIRST (most reliable)
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
      // Fallback based on status code
      final statusCode = e.response?.statusCode;
      if (statusCode == 401) {
        return 'Invalid username or password';
      }
      if (statusCode == 409) {
        return 'An account with this username already exists';
      }
      if (statusCode == 423) {
        return 'Too many attempts. Please wait a few minutes and try again.';
      }
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout ||
          e.type == DioExceptionType.sendTimeout) {
        return 'Network error. Please check your connection.';
      }
      if (e.type == DioExceptionType.connectionError) {
        return 'Network error. Please check your connection.';
      }
    }

    // 2. String-based fallback for non-Dio exceptions
    final msg = e.toString();
    if (msg.contains('Invalid credentials') || msg.contains('Invalid username')) {
      return 'Invalid username or password';
    }
    if (msg.contains('already exists') || msg.contains('already taken')) {
      return 'An account with this username already exists';
    }
    if (msg.contains('Too many') || msg.contains('locked')) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    if (msg.contains('network') ||
        msg.contains('timeout') ||
        msg.contains('SocketException')) {
      return 'Network error. Please check your connection.';
    }

    return 'Something went wrong. Please try again.';
  }
}
