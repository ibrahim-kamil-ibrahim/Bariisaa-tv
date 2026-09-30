import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class MessagingState extends Equatable {
  const MessagingState();

  @override
  List<Object?> get props => [];
}

class MessagingInitial extends MessagingState {}

class MessagingLoading extends MessagingState {}

class ConversationsLoaded extends MessagingState {
  final List<ConversationModel> conversations;
  final bool hasMore;

  const ConversationsLoaded({required this.conversations, this.hasMore = true});

  @override
  List<Object?> get props => [conversations, hasMore];
}

class MessagesLoaded extends MessagingState {
  final String conversationId;
  final List<MessageModel> messages;
  final bool hasMore;

  const MessagesLoaded({
    required this.conversationId,
    required this.messages,
    this.hasMore = true,
  });

  MessagesLoaded copyWith({
    String? conversationId,
    List<MessageModel>? messages,
    bool? hasMore,
  }) {
    return MessagesLoaded(
      conversationId: conversationId ?? this.conversationId,
      messages: messages ?? this.messages,
      hasMore: hasMore ?? this.hasMore,
    );
  }

  @override
  List<Object?> get props => [conversationId, messages, hasMore];
}

class MessageSent extends MessagingState {
  final MessageModel message;

  const MessageSent(this.message);

  @override
  List<Object?> get props => [message];
}

class UnreadCountLoaded extends MessagingState {
  final int unreadCount;

  const UnreadCountLoaded(this.unreadCount);

  @override
  List<Object?> get props => [unreadCount];
}

class UsersSearchResults extends MessagingState {
  final List<UserModel> users;

  const UsersSearchResults(this.users);

  @override
  List<Object?> get props => [users];
}

class MessagingError extends MessagingState {
  final String message;

  const MessagingError(this.message);

  @override
  List<Object?> get props => [message];
}
