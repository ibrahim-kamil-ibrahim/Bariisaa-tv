import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class AuthState extends Equatable {
  const AuthState();
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthGuest extends AuthState {
  const AuthGuest();
}

class AuthAuthenticated extends AuthState {
  final UserModel user;
  const AuthAuthenticated(this.user);
  @override
  List<Object?> get props => [user.id];
}

class AuthError extends AuthState {
  final String message;
  const AuthError(this.message);
  @override
  List<Object?> get props => [message];
}

class AuthSignupLoading extends AuthState {}

class AuthLoginLoading extends AuthState {}

class AuthLogoutLoading extends AuthState {}

class AuthOtpSent extends AuthState {
  final String identifier;
  final bool isEmail;
  const AuthOtpSent({required this.identifier, required this.isEmail});
  @override
  List<Object?> get props => [identifier, isEmail];
}

class AuthOtpLoading extends AuthState {}

/// OTP verified — user is fully authenticated.
/// Carries the [UserModel] so widgets checking `state is AuthAuthenticated`
/// or `state is AuthOtpVerified` both see the user.
class AuthOtpVerified extends AuthState {
  final String message;
  final UserModel user;
  const AuthOtpVerified(this.message, this.user);
  @override
  List<Object?> get props => [message, user.id];
}
