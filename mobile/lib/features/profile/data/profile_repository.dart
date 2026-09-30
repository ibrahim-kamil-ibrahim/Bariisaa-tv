import 'package:dio/dio.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class ProfileRepository {
  final ApiClient _apiClient = getIt<ApiClient>();

  Future<UserModel> getProfile() async {
    if (await getIt<SecureStorageService>().isDevMode()) {
      return UserModel(
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
        phone: '+251911111111',
        avatarUrl: null,
        emailVerified: true,
        phoneVerified: true,
        status: 'active',
        preferredLanguage: 'om',
        accountStatus: 'active',
        profileData: null,
      );
    }
    if (!await getIt<SecureStorageService>().isLoggedIn()) {
      throw Exception('Not authenticated');
    }
    final response = await _apiClient.get('/users/profile');
    return UserModel.fromJson(response.data['data']);
  }

  Future<UserModel> updateProfile({
    String? name,
    String? preferredLanguage,
  }) async {
    if (!await getIt<SecureStorageService>().isLoggedIn()) {
      throw Exception('Not authenticated');
    }
    final data = <String, dynamic>{};
    if (name != null) data['name'] = name;
    if (preferredLanguage != null)
      data['preferredLanguage'] = preferredLanguage;
    final response = await _apiClient.put('/users/profile', data: data);
    return UserModel.fromJson(response.data['data']);
  }

  Future<UserModel> uploadAvatar(File imageFile) async {
    if (!await getIt<SecureStorageService>().isLoggedIn()) {
      throw Exception('Not authenticated');
    }
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(
        imageFile.path,
        filename: 'avatar.jpg',
      ),
    });
    final response = await _apiClient.put('/users/avatar', data: formData);
    final avatarData = response.data['data'] as Map<String, dynamic>;
    // Backend only returns { id, avatarUrl } — merge with existing profile
    final currentProfile = await getProfile();
    return UserModel(
      id: currentProfile.id,
      username: currentProfile.username,
      email: currentProfile.email,
      phone: currentProfile.phone,
      name: currentProfile.name,
      avatarUrl: avatarData['avatarUrl'] as String?,
      emailVerified: currentProfile.emailVerified,
      phoneVerified: currentProfile.phoneVerified,
      status: currentProfile.status,
      preferredLanguage: currentProfile.preferredLanguage,
      accountStatus: currentProfile.accountStatus,
      profileData: currentProfile.profileData,
    );
  }

  Future<File?> pickImage() async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 512,
        maxHeight: 512,
      );
      if (picked != null) return File(picked.path);
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<List<DeviceModel>> getDevices() async {
    if (await getIt<SecureStorageService>().isDevMode()) return [];
    if (!await getIt<SecureStorageService>().isLoggedIn()) return [];
    final response = await _apiClient.get('/users/devices');
    return (response.data['data'] as List)
        .map((e) => DeviceModel.fromJson(e))
        .toList();
  }

  Future<void> removeDevice(String deviceId) async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    await _apiClient.delete('/users/devices/$deviceId');
  }
}
