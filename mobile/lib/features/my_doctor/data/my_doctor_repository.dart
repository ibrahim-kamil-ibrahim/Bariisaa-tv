import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';

class MyDoctorRepository {
  final ApiClient _apiClient;

  MyDoctorRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getHealthTips() async {
    try {
      final response = await _apiClient.get('/my-doctor/tips');
      return List<Map<String, dynamic>>.from(response.data['data']);
    } on DioException {
      return [];
    }
  }

  Future<List<Map<String, dynamic>>> getDoctors() async {
    try {
      final response = await _apiClient.get('/my-doctor/profiles');
      return List<Map<String, dynamic>>.from(response.data['data']);
    } on DioException {
      return [];
    }
  }
}
