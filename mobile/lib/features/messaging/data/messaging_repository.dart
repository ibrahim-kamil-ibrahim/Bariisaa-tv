import 'package:dio/dio.dart';
import '../../../core/network/api_client.dart';
import '../../../core/di/injection.dart';
import '../../../shared/models/models.dart';

class MessagingRepository {
  final ApiClient _apiClient = getIt<ApiClient>();

  Future<List<ConversationModel>> getConversations({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _apiClient.get(
        '/messages',
        queryParameters: {'page': page, 'limit': limit},
      );
      return (response.data['data'] as List)
          .map((e) => ConversationModel.fromJson(e))
          .toList();
    } on DioException {
      rethrow;
    }
  }

  Future<ConversationModel> getOrCreateConversation(String otherUserId) async {
    try {
      final response = await _apiClient.post(
        '/messages/conversation',
        data: {'userId': otherUserId},
      );
      return ConversationModel.fromJson(response.data['data']);
    } on DioException {
      rethrow;
    }
  }

  Future<List<MessageModel>> getMessages(
    String conversationId, {
    int page = 1,
    int limit = 50,
  }) async {
    try {
      final response = await _apiClient.get(
        '/messages/$conversationId',
        queryParameters: {'page': page, 'limit': limit},
      );
      return (response.data['data'] as List)
          .map((e) => MessageModel.fromJson(e))
          .toList();
    } on DioException {
      rethrow;
    }
  }

  Future<MessageModel> sendMessage(String receiverId, String content) async {
    try {
      final response = await _apiClient.post(
        '/messages',
        data: {'receiverId': receiverId, 'content': content},
      );
      return MessageModel.fromJson(response.data['data']);
    } on DioException {
      rethrow;
    }
  }

  Future<void> markAsRead(String conversationId) async {
    try {
      await _apiClient.post('/messages/$conversationId/read');
    } on DioException {
      rethrow;
    }
  }

  Future<int> getUnreadCount() async {
    try {
      final response = await _apiClient.get('/messages/unread');
      return response.data['data']['unreadCount'] as int;
    } on DioException {
      return 0;
    }
  }

  Future<List<UserModel>> searchUsers(String query) async {
    try {
      final response = await _apiClient.get(
        '/messages/users/search',
        queryParameters: {'q': query},
      );
      return (response.data['data'] as List)
          .map((e) => UserModel.fromJson(e))
          .toList();
    } on DioException {
      rethrow;
    }
  }
}
