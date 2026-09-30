import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/models/models.dart';
import '../presentation/history_cubit.dart';
import '../domain/history_state.dart';
import '../../screen_theme/themed_screen_scaffold.dart';

import 'package:naik_mobile/shared/styles.dart';

class HistoryScreen extends StatefulWidget {
  final String? initialTab;

  const HistoryScreen({super.key, this.initialTab});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTab == 'listening' ? 1 : 0,
    );
    context.read<HistoryCubit>().loadHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.skyBlue,
          unselectedLabelColor: AppTheme.creamText,
          indicatorColor: AppTheme.skyBlue,
          indicatorWeight: 3,
          tabs: const [
            Tab(text: 'Reading'),
            Tab(text: 'Listening'),
          ],
        ),
      ),
      body: ThemedScreenScaffold(
        screenKey: 'history',
        child: BlocBuilder<HistoryCubit, HistoryState>(
          builder: (context, state) {
            if (state is HistoryLoading) {
              return ListView.builder(
                itemCount: 6,
                itemBuilder: (_, _) => const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: ShimmerListTile(),
                ),
              );
            }
            if (state is HistoryError) {
              return ErrorStateWidget(
                message: state.message,
                onRetry: () => context.read<HistoryCubit>().loadHistory(),
              );
            }
            if (state is HistoryLoaded) {
              return TabBarView(
                controller: _tabController,
                children: [
                  _buildHistoryList(
                    context,
                    state.readingHistory,
                    'reading',
                    () => _confirmClearAll(context, 'reading'),
                  ),
                  _buildHistoryList(
                    context,
                    state.listeningHistory,
                    'listening',
                    () => _confirmClearAll(context, 'listening'),
                  ),
                ],
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Future<void> _confirmClearAll(BuildContext context, String type) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Text(
          'Clear ${type == 'reading' ? 'Reading' : 'Listening'} History?',
          style: AppStyles.nunito(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppTheme.darkNavy,
          ),
        ),
        content: Text(
          'This will remove all ${type == 'reading' ? 'reading' : 'listening'} history. You can always start again!',
          style: AppStyles.nunito(
            fontSize: 15,
            color: AppTheme.charcoal,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(
              'Cancel',
              style: AppStyles.nunito(
                fontWeight: FontWeight.w700,
                color: AppTheme.charcoal,
              ),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              'Clear',
              style: AppStyles.nunito(
                fontWeight: FontWeight.w800,
                color: AppTheme.playfulRed,
              ),
            ),
          ),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      if (type == 'reading') {
        context.read<HistoryCubit>().clearReading();
      } else {
        context.read<HistoryCubit>().clearListening();
      }
    }
  }

  Widget _buildHistoryList(
    BuildContext context,
    List<BookModel> books,
    String type,
    VoidCallback onClear,
  ) {
    if (books.isEmpty) {
      return EmptyStateWidget(
        icon: Icons.history,
        title: 'No $type history',
        subtitle: 'Start $type books to see them here',
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        context.read<HistoryCubit>().loadHistory();
      },
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: books.length + 1,
        separatorBuilder: (_, _) => const Divider(height: 1),
        itemBuilder: (context, index) {
          if (index == 0) {
            return Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                icon: const Icon(Icons.delete_sweep, size: 18),
                label: const Text('Clear All'),
                onPressed: onClear,
              ),
            );
          }
          final book = books[index - 1];
          return Dismissible(
            key: Key('${type}_${book.id}'),
            direction: DismissDirection.endToStart,
            background: Container(
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20),
              color: AppTheme.playfulRed,
              child: const Icon(Icons.delete, color: AppTheme.white),
            ),
            onDismissed: (_) =>
                context.read<HistoryCubit>().deleteItem(book.id, type),
            child: ListTile(
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: book.coverUrl != null ? AppConstants.resolveUrl(book.coverUrl!) : '',
                  width: 48,
                  height: 48,
                  fit: BoxFit.cover,
                  memCacheWidth: 96,
                  memCacheHeight: 96,
                  placeholder: (_, _) => Container(color: AppTheme.softGrey),
                  errorWidget: (_, _, _) => Container(
                    color: AppTheme.softGrey,
                    child: const Icon(
                      Icons.book,
                      size: 24,
                      color: AppTheme.softGrey,
                    ),
                  ),
                ),
              ),
              title: Text(
                book.title,
                style: const TextStyle(fontWeight: FontWeight.w600),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: Text(
                book.authors.isNotEmpty ? book.authors.first.name : '',
                maxLines: 1,
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                if (type == 'reading') {
                  context.push(AppRoutes.ebookReader, extra: book);
                } else {
                  context.push(AppRoutes.audioPlayer, extra: book);
                }
              },
            ),
          );
        },
      ),
    );
  }
}
