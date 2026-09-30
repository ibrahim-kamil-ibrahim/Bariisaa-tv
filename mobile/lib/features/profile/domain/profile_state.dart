import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class ProfileState extends Equatable {
  const ProfileState();

  @override
  List<Object?> get props => [];
}

class ProfileInitial extends ProfileState {}

class ProfileLoading extends ProfileState {}

class ProfileLoaded extends ProfileState {
  final UserModel user;
  final SubscriptionModel? subscription;

  const ProfileLoaded({required this.user, this.subscription});

  ProfileLoaded copyWith({UserModel? user, SubscriptionModel? subscription}) {
    return ProfileLoaded(
      user: user ?? this.user,
      subscription: subscription ?? this.subscription,
    );
  }

  @override
  List<Object?> get props => [user, subscription];
}

class ProfileDevicesLoaded extends ProfileState {
  final List<DeviceModel> devices;

  const ProfileDevicesLoaded(this.devices);

  @override
  List<Object?> get props => [devices];
}

class ProfileSuccess extends ProfileState {
  final String message;

  const ProfileSuccess(this.message);

  @override
  List<Object?> get props => [message];
}

class ProfileError extends ProfileState {
  final String message;

  const ProfileError(this.message);

  @override
  List<Object?> get props => [message];
}
