import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/profile_state.dart';
import '../data/profile_repository.dart';

class ProfileCubit extends Cubit<ProfileState> {
  final ProfileRepository _repository;

  ProfileCubit(this._repository) : super(ProfileInitial());

  void loadProfile() async {
    emit(ProfileLoading());
    try {
      final user = await _repository.getProfile();
      if (isClosed) return;
      emit(ProfileLoaded(user: user));
    } catch (e) {
      if (isClosed) return;
      emit(ProfileError('Failed to load profile: $e'));
    }
  }

  void updateProfile({String? name, String? preferredLanguage}) async {
    try {
      final user = await _repository.updateProfile(
        name: name,
        preferredLanguage: preferredLanguage,
      );
      if (isClosed) return;
      emit(ProfileLoaded(user: user));
    } catch (e) {
      if (isClosed) return;
      emit(ProfileError('Failed to update profile: $e'));
    }
  }

  void uploadAvatar() async {
    final file = await _repository.pickImage();
    if (file == null) return;
    emit(ProfileLoading());
    try {
      final user = await _repository.uploadAvatar(file);
      if (isClosed) return;
      emit(ProfileLoaded(user: user));
    } catch (e) {
      if (isClosed) return;
      emit(ProfileError('Failed to upload avatar: $e'));
    }
  }

  void loadDevices() async {
    emit(ProfileLoading());
    try {
      final devices = await _repository.getDevices();
      if (isClosed) return;
      emit(ProfileDevicesLoaded(devices));
    } catch (e) {
      if (isClosed) return;
      emit(ProfileError('Failed to load devices: $e'));
    }
  }

  void removeDevice(String deviceId) async {
    try {
      await _repository.removeDevice(deviceId);
      if (isClosed) return;
      loadDevices();
    } catch (e) {
      if (isClosed) return;
      emit(ProfileError('Failed to remove device: $e'));
    }
  }
}
