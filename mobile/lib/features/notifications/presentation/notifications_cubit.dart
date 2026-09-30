import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/notifications_state.dart';
import '../data/notifications_repository.dart';
import '../../../shared/models/models.dart';

class NotificationsCubit extends Cubit<NotificationsState> {
  final NotificationsRepository _repository;

  NotificationsCubit(this._repository) : super(NotificationsInitial());

  void loadNotifications() async {
    emit(NotificationsLoading());
    try {
      final results = await Future.wait<dynamic>([
        _repository.getNotifications(),
        _repository.getUnreadCount(),
      ]);
      if (isClosed) return;
      emit(
        NotificationsLoaded(
          notifications: results[0] as List<NotificationModel>,
          unreadCount: results[1] as int,
        ),
      );
    } catch (e) {
      if (isClosed) return;
      emit(NotificationsError('Failed to load notifications: $e'));
    }
  }

  void markAsRead(String notificationId) async {
    try {
      await _repository.markAsRead(notificationId);
      loadNotifications();
    } catch (e) {
      if (kDebugMode) debugPrint('markAsRead failed: $e');
    }
  }

  void markAllAsRead() async {
    try {
      await _repository.markAllAsRead();
      if (state is NotificationsLoaded) {
        final updated = (state as NotificationsLoaded).notifications
            .map(
              (n) => NotificationModel(
                id: n.id,
                title: n.title,
                body: n.body,
                type: n.type,
                isRead: true,
                createdAt: n.createdAt,
              ),
            )
            .toList();
        emit(NotificationsLoaded(notifications: updated, unreadCount: 0));
      }
    } catch (e) {
      if (kDebugMode) debugPrint('markAllAsRead failed: $e');
    }
  }

  void deleteNotification(String notificationId) async {
    try {
      await _repository.deleteNotification(notificationId);
      loadNotifications();
    } catch (e) {
      if (kDebugMode) debugPrint('deleteNotification failed: $e');
    }
  }
}
