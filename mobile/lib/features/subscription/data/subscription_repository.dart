import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/models.dart';

class SubscriptionRepository {
  final ApiClient _apiClient = getIt<ApiClient>();

  Future<List<SubscriptionPlanModel>> getPlans() async {
    try {
      final response = await _apiClient.get('/subscriptions/plans');
      return (response.data['data'] as List)
          .map((e) => SubscriptionPlanModel.fromJson(e))
          .toList();
    } on DioException {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> createSubscription({
    required String planId,
    required String paymentGateway,
    String? couponCode,
  }) async {
    if (!await getIt<SecureStorageService>().isLoggedIn()) {
      throw Exception('Not authenticated');
    }
    final data = <String, dynamic>{
      'planId': planId,
      'gateway': paymentGateway.toUpperCase(),
    };
    if (couponCode != null) data['couponCode'] = couponCode;
    final response = await _apiClient.post(
      '/subscriptions/subscribe',
      data: data,
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<SubscriptionModel?> getCurrentSubscription() async {
    if (await getIt<SecureStorageService>().isDevMode()) return null;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return null;
    try {
      final response = await _apiClient.get('/subscriptions/current');
      if (response.data['data'] == null) return null;
      return SubscriptionModel.fromJson(response.data['data']);
    } on DioException {
      return null;
    }
  }

  Future<void> cancelSubscription() async {
    if (await getIt<SecureStorageService>().isDevMode()) return;
    if (!await getIt<SecureStorageService>().isLoggedIn()) return;
    try {
      await _apiClient.post('/subscriptions/cancel');
    } on DioException catch (e) {
      throw Exception(_handleError(e));
    }
  }

  String _handleError(DioException e) {
    if (e.response?.data is Map && e.response!.data['message'] is String) {
      return e.response!.data['message'] as String;
    }
    return 'Failed to cancel subscription. Please try again.';
  }

  Future<List<PaymentModel>> getPaymentHistory({
    int page = 1,
    int limit = 20,
  }) async {
    if (await getIt<SecureStorageService>().isDevMode()) return [];
    if (!await getIt<SecureStorageService>().isLoggedIn()) return [];
    try {
      final response = await _apiClient.get(
        '/payments',
        queryParameters: {'page': page, 'limit': limit},
      );
      return (response.data['data'] as List)
          .map((e) => PaymentModel.fromJson(e))
          .toList();
    } on DioException {
      rethrow;
    }
  }

  Future<bool> applyCoupon(String code) async {
    if (!await getIt<SecureStorageService>().isLoggedIn()) return false;
    try {
      final response = await _apiClient.post(
        '/payments/validate-coupon',
        data: {'code': code},
      );
      return response.data['data']['valid'] as bool;
    } on DioException {
      return false;
    }
  }
}
