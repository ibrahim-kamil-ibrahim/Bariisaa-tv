import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/notifications_cubit.dart';
import '../domain/notifications_state.dart';

String _notifEmoji(String type) {
  switch (type) {
    case 'new_book':
      return '📚';
    case 'promo':
      return '🎉';
    case 'subscription':
      return '⭐';
    case 'update':
      return '🔄';
    default:
      return '🔔';
  }
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    context.read<NotificationsCubit>().loadNotifications();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Notifications',
        showMenu: false,
        actions: [
          KidsIconButton(
            tooltip: 'Mark all read',
            onTap: () => context.read<NotificationsCubit>().markAllAsRead(),
            child: const Icon(
              Icons.done_all,
              size: 24,
              color: AppTheme.darkNavy,
            ),
          ),
        ],
      ),
      body: BlocBuilder<NotificationsCubit, NotificationsState>(
        builder: (context, state) {
          if (state is NotificationsLoading) {
            return ListView.builder(
              itemCount: 6,
              itemBuilder: (_, _) => const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: ShimmerListTile(),
              ),
            );
          }
          if (state is NotificationsError) {
            return FunErrorState(
              message: state.message,
              onRetry: () =>
                  context.read<NotificationsCubit>().loadNotifications(),
            );
          }
          if (state is NotificationsLoaded) {
            if (state.notifications.isEmpty) {
              return const FunEmptyState(
                emoji: '🔔',
                title: 'All caught up!',
                subtitle: 'No notifications yet',
              );
            }
            return RefreshIndicator(
              onRefresh: () async {
                context.read<NotificationsCubit>().loadNotifications();
              },
              child: _GroupedNotificationList(state: state),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _GroupedNotificationList extends StatelessWidget {
  final NotificationsLoaded state;
  const _GroupedNotificationList({required this.state});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = <dynamic>[];
    final week = <dynamic>[];
    final earlier = <dynamic>[];
    for (final n in state.notifications) {
      final days = now.difference(n.createdAt).inDays;
      if (days < 1) {
        today.add(n);
      } else if (days < 7) {
        week.add(n);
      } else {
        earlier.add(n);
      }
    }

    final items = <dynamic>[
      if (today.isNotEmpty) _GroupHeader(emoji: '☀️', label: 'Today'),
      ...today,
      if (week.isNotEmpty) _GroupHeader(emoji: '📅', label: 'This Week'),
      ...week,
      if (earlier.isNotEmpty) _GroupHeader(emoji: '🕰️', label: 'Earlier'),
      ...earlier,
    ];

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        if (item is _GroupHeader) {
          return _groupHeaderWidget(item.emoji, item.label);
        }
        return _notifTile(context, item);
      },
    );
  }

  Widget _groupHeaderWidget(String emoji, String label) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 8),
          Text(
            label,
            style: AppStyles.baloo2(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.charcoal,
            ),
          ),
        ],
      ),
    );
  }

  Widget _notifTile(BuildContext context, dynamic notif) {
    return Dismissible(
      key: Key(notif.id),
      direction: DismissDirection.endToStart,
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: AppTheme.playfulRed,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Text('🗑️', style: TextStyle(fontSize: 24)),
      ),
      onDismissed: (_) =>
          context.read<NotificationsCubit>().deleteNotification(notif.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: notif.isRead
              ? AppTheme.white
              : AppTheme.skyBlue.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(16),
          border: notif.isRead
              ? null
              : Border.all(color: AppTheme.skyBlue.withValues(alpha: 0.3)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_notifEmoji(notif.type), style: const TextStyle(fontSize: 28)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notif.title,
                    style: AppStyles.nunito(
                      fontSize: 16,
                      fontWeight: notif.isRead
                          ? FontWeight.w600
                          : FontWeight.w800,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notif.body,
                    style: AppStyles.nunito(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.charcoal,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (!notif.isRead)
              Container(
                margin: const EdgeInsets.only(top: 4),
                width: 12,
                height: 12,
                decoration: const BoxDecoration(
                  color: AppTheme.skyBlue,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _GroupHeader {
  final String emoji;
  final String label;
  const _GroupHeader({required this.emoji, required this.label});
}
