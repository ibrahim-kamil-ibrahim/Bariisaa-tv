import 'package:flutter_bloc/flutter_bloc.dart';
import '../data/messaging_repository.dart';
import '../domain/messaging_state.dart';

class MessagingCubit extends Cubit<MessagingState> {
  final MessagingRepository _repository;

  MessagingCubit(this._repository) : super(MessagingInitial());

  Future<void> loadConversations() async {
    emit(MessagingLoading());
    try {
      final conversations = await _repository.getConversations();
      if (isClosed) return;
      emit(ConversationsLoaded(conversations: conversations));
    } catch (e) {
      if (isClosed) return;
      emit(MessagingError(e.toString()));
    }
  }

  Future<void> loadMessages(String conversationId) async {
    emit(MessagingLoading());
    try {
      final messages = await _repository.getMessages(conversationId);
      if (isClosed) return;
      emit(MessagesLoaded(conversationId: conversationId, messages: messages));
      await _repository.markAsRead(conversationId);
    } catch (e) {
      if (isClosed) return;
      emit(MessagingError(e.toString()));
    }
  }

  Future<void> sendMessage(String receiverId, String content) async {
    try {
      final message = await _repository.sendMessage(receiverId, content);
      if (isClosed) return;
      if (state is MessagesLoaded) {
        final current = state as MessagesLoaded;
        emit(current.copyWith(messages: [...current.messages, message]));
      } else {
        emit(MessageSent(message));
      }
    } catch (e) {
      if (isClosed) return;
      emit(MessagingError(e.toString()));
    }
  }

  Future<void> loadUnreadCount() async {
    try {
      final count = await _repository.getUnreadCount();
      if (isClosed) return;
      emit(UnreadCountLoaded(count));
    } catch (e) {
      // silently fail
    }
  }

  Future<void> searchUsers(String query) async {
    try {
      final users = await _repository.searchUsers(query);
      if (isClosed) return;
      emit(UsersSearchResults(users));
    } catch (e) {
      if (isClosed) return;
      emit(MessagingError(e.toString()));
    }
  }

  Future<void> openConversation(String otherUserId) async {
    emit(MessagingLoading());
    try {
      final conversation = await _repository.getOrCreateConversation(
        otherUserId,
      );
      final messages = await _repository.getMessages(conversation.id);
      if (isClosed) return;
      emit(MessagesLoaded(conversationId: conversation.id, messages: messages));
      await _repository.markAsRead(conversation.id);
    } catch (e) {
      if (isClosed) return;
      emit(MessagingError(e.toString()));
    }
  }
}
