import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/di/injection.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/models/models.dart';
import '../domain/messaging_state.dart';
import '../data/messaging_repository.dart';
import '../presentation/messaging_cubit.dart';

class ConversationsListScreen extends StatefulWidget {
  const ConversationsListScreen({super.key});

  @override
  State<ConversationsListScreen> createState() =>
      _ConversationsListScreenState();
}

class _ConversationsListScreenState extends State<ConversationsListScreen> {
  @override
  void initState() {
    super.initState();
    context.read<MessagingCubit>().loadConversations();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: AppBar(
        backgroundColor: AppTheme.creamBg,
        elevation: 0,
        leading: KidsIconButton(
          onTap: () => context.go(AppRoutes.discovery),
          child: const Icon(Icons.arrow_back_rounded, color: AppTheme.darkNavy),
        ),
        title: Text(
          'Messages',
          style: AppStyles.baloo2(
            fontSize: AppTheme.titleSize,
            fontWeight: FontWeight.w700,
            color: AppTheme.darkNavy,
          ),
        ),
        actions: [
          KidsIconButton(
            onTap: () => _showNewMessageDialog(context),
            child: const Icon(
              Icons.person_add_rounded,
              color: AppTheme.skyBlue,
            ),
          ),
        ],
      ),
      body: BlocBuilder<MessagingCubit, MessagingState>(
        builder: (context, state) {
          if (state is MessagingLoading) {
            return const Center(
              child: LoadingMascot(emoji: '💬', message: 'Loading messages...'),
            );
          }

          if (state is MessagingError) {
            return FunErrorState(
              message: state.message,
              onRetry: () => context.read<MessagingCubit>().loadConversations(),
            );
          }

          if (state is ConversationsLoaded) {
            if (state.conversations.isEmpty) {
              return const FunEmptyState(
                emoji: '💬',
                title: 'No conversations yet',
                subtitle: 'Start a conversation by tapping the + button',
              );
            }

            return RefreshIndicator(
              onRefresh: () =>
                  context.read<MessagingCubit>().loadConversations(),
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: state.conversations.length,
                separatorBuilder: (_, _) =>
                    const Divider(height: 1, indent: 72),
                itemBuilder: (context, index) {
                  final conversation = state.conversations[index];
                  return _buildConversationTile(context, conversation);
                },
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildConversationTile(
    BuildContext context,
    ConversationModel conversation,
  ) {
    final otherUser = conversation.otherUser;
    final lastMessage = conversation.lastMessage;
    final hasUnread = conversation.unreadCount > 0;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: CircleAvatar(
        radius: 28,
        backgroundColor: AppTheme.skyBlue.withValues(alpha: 0.15),
        backgroundImage: otherUser?.avatarUrl != null
            ? NetworkImage(AppConstants.resolveUrl(otherUser!.avatarUrl!))
            : null,
        child: otherUser?.avatarUrl == null
            ? Text(
                (otherUser?.name ?? '?')[0].toUpperCase(),
                style: AppStyles.nunito(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.skyBlue,
                ),
              )
            : null,
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              otherUser?.name ?? 'Unknown',
              style: AppStyles.nunito(
                fontSize: 16,
                fontWeight: hasUnread ? FontWeight.w800 : FontWeight.w600,
                color: AppTheme.darkText,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (lastMessage != null)
            Text(
              _formatTime(lastMessage.createdAt),
              style: AppStyles.nunito(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: hasUnread ? AppTheme.skyBlue : AppTheme.softGrey,
              ),
            ),
        ],
      ),
      subtitle: Row(
        children: [
          Expanded(
            child: Text(
              lastMessage?.content ?? 'Start a conversation',
              style: AppStyles.nunito(
                fontSize: 14,
                fontWeight: hasUnread ? FontWeight.w700 : FontWeight.w500,
                color: hasUnread ? AppTheme.darkText : AppTheme.softGrey,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (hasUnread)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.skyBlue,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '${conversation.unreadCount}',
                style: AppStyles.nunito(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
        ],
      ),
      onTap: () {
        if (otherUser != null) {
          context.push('/chat/${conversation.id}', extra: otherUser);
        }
      },
    );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final diff = now.difference(time);

    if (diff.inDays == 0) {
      return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    } else if (diff.inDays == 1) {
      return 'Yesterday';
    } else if (diff.inDays < 7) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days[time.weekday - 1];
    } else {
      return '${time.day}/${time.month}';
    }
  }

  void _showNewMessageDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => const _NewMessageSheet(),
    );
  }
}

class _NewMessageSheet extends StatefulWidget {
  const _NewMessageSheet();

  @override
  State<_NewMessageSheet> createState() => _NewMessageSheetState();
}

class _NewMessageSheetState extends State<_NewMessageSheet> {
  final _searchController = TextEditingController();
  final _cubit = MessagingCubit(getIt());
  bool _opening = false;

  @override
  void dispose() {
    _searchController.dispose();
    _cubit.close();
    super.dispose();
  }

  Future<void> _openConversationWith(UserModel user) async {
    if (_opening) return;
    _opening = true;
    final messenger = ScaffoldMessenger.of(context);
    final router = GoRouter.of(context);
    final repo = getIt<MessagingRepository>();
    try {
      final conversation = await repo.getOrCreateConversation(user.id);
      if (!mounted) return;
      // Load the conversation into the shared cubit before popping, so the
      // chat screen has its messages ready.
      await getIt<MessagingCubit>().openConversation(user.id);
      if (!mounted) return;
      Navigator.pop(context);
      router.push('/chat/${conversation.id}', extra: user);
    } catch (_) {
      _opening = false;
      if (!mounted) return;
      messenger.showSnackBar(
        SnackBar(
          content: Text(
            'Could not start chat with ${user.name}',
            style: AppStyles.nunito(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppTheme.white,
            ),
          ),
          backgroundColor: AppTheme.playfulRed,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _cubit,
      child: DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (context, scrollController) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.softGrey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'New Message',
                  style: AppStyles.baloo2(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.darkNavy,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search users...',
                    prefixIcon: const Icon(
                      Icons.search,
                      color: AppTheme.softGrey,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: AppTheme.creamBg,
                  ),
                  onChanged: (value) {
                    if (value.length >= 2) {
                      _cubit.searchUsers(value);
                    }
                  },
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: BlocBuilder<MessagingCubit, MessagingState>(
                    builder: (context, state) {
                      if (state is UsersSearchResults) {
                        if (state.users.isEmpty) {
                          return const Center(
                            child: Text(
                              'No users found',
                              style: TextStyle(color: AppTheme.softGrey),
                            ),
                          );
                        }
                        return ListView.builder(
                          controller: scrollController,
                          itemCount: state.users.length,
                          itemBuilder: (context, index) {
                            final user = state.users[index];
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: AppTheme.skyBlue.withValues(
                                  alpha: 0.15,
                                ),
                                backgroundImage: user.avatarUrl != null
                                    ? NetworkImage(AppConstants.resolveUrl(user.avatarUrl!))
                                    : null,
                                child: user.avatarUrl == null
                                    ? Text(
                                        user.name[0].toUpperCase(),
                                        style: const TextStyle(
                                          color: AppTheme.skyBlue,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      )
                                    : null,
                              ),
                              title: Text(user.name),
                              subtitle: Text(
                                user.email ?? '',
                                style: const TextStyle(
                                  color: AppTheme.softGrey,
                                ),
                              ),
                              onTap: () => _openConversationWith(user),
                            );
                          },
                        );
                      }

                      if (state is MessagingLoading) {
                        return const Center(
                          child: SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: AppTheme.skyBlue,
                            ),
                          ),
                        );
                      }

                      return const Center(
                        child: Text(
                          'Type to search users',
                          style: TextStyle(color: AppTheme.softGrey),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
