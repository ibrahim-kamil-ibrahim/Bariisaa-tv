import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/models/models.dart';
import '../presentation/offline_cubit.dart';
import '../domain/offline_state.dart';

String _statusEmoji(String status) {
  switch (status) {
    case 'completed':
      return '✅';
    case 'failed':
      return '❌';
    case 'downloading':
      return '⬇️';
    case 'paused':
      return '⏸️';
    default:
      return '⏳';
  }
}

class DownloadManagerScreen extends StatefulWidget {
  const DownloadManagerScreen({super.key});

  @override
  State<DownloadManagerScreen> createState() => _DownloadManagerScreenState();
}

class _DownloadManagerScreenState extends State<DownloadManagerScreen> {
  @override
  void initState() {
    super.initState();
    context.read<OfflineCubit>().loadDownloads();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Downloads',
      ),
      body: BlocBuilder<OfflineCubit, OfflineState>(
        builder: (context, state) {
          if (state is OfflineLoading) {
            return ListView.builder(
              itemCount: 4,
              itemBuilder: (_, _) => const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: ShimmerListTile(),
              ),
            );
          }
          if (state is OfflineError) {
            return FunErrorState(
              message: state.message,
              onRetry: () => context.read<OfflineCubit>().loadDownloads(),
            );
          }
          if (state is OfflineLoaded) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildStorageInfo(context, state),
                Expanded(
                  child: state.downloads.isEmpty
                      ? FunEmptyState(
                          emoji: '📥',
                          title: 'No downloads yet',
                          subtitle: 'Download books to read offline!',
                          action: BigTapButton(
                            onPressed: () => context.push(AppRoutes.discovery),
                            child: Text(
                              'Browse Books',
                              style: AppStyles.nunito(
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.darkText,
                              ),
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: () async {
                            context.read<OfflineCubit>().loadDownloads();
                          },
                          child: ListView.separated(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: state.downloads.length,
                            separatorBuilder: (_, _) =>
                                const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = state.downloads[index];
                              return _buildDownloadItem(context, item);
                            },
                          ),
                        ),
                ),
              ],
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildStorageInfo(BuildContext context, OfflineLoaded state) {
    final mbUsed = state.storageUsed / (1024 * 1024);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          const Text('💾', style: TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Storage Used',
                  style: AppStyles.nunito(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.creamText,
                  ),
                ),
                Text(
                  '${mbUsed.toStringAsFixed(1)} MB',
                  style: AppStyles.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.creamText,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => _clearAllDownloads(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppTheme.playfulRed.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                'Clear All',
                style: AppStyles.nunito(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.creamText,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDownloadItem(BuildContext context, DownloadItemModel item) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: AppTheme.cardDecoration(),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: item.coverUrl != null
                ? CachedNetworkImage(
                    imageUrl: AppConstants.resolveUrl(item.coverUrl!),
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    memCacheWidth: 112,
                    memCacheHeight: 112,
                    placeholder: (_, _) => Container(color: AppTheme.softGrey),
                    errorWidget: (_, _, _) => Container(
                      color: AppTheme.softGrey,
                      child: const Text('📚', style: TextStyle(fontSize: 24)),
                    ),
                  )
                : Container(
                    width: 56,
                    height: 56,
                    color: AppTheme.softGrey,
                    child: const Text('📚', style: TextStyle(fontSize: 24)),
                  ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: AppStyles.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.creamText,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      _statusEmoji(item.status),
                      style: const TextStyle(fontSize: 14),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      item.isDownloading
                          ? 'Downloading...'
                          : item.isPaused
                          ? 'Paused'
                          : item.isCompleted
                          ? 'Ready'
                          : item.isFailed
                          ? 'Failed'
                          : 'Pending',
                      style: AppStyles.nunito(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.creamText,
                      ),
                    ),
                  ],
                ),
                if (item.isDownloading || item.isPaused) ...[
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: item.progress,
                      backgroundColor: AppTheme.softGrey,
                      color: AppTheme.skyBlue,
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${(item.progress * 100).toInt()}%',
                    style: AppStyles.nunito(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.creamText,
                    ),
                  ),
                ],
              ],
            ),
          ),
          PopupMenuButton<String>(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            itemBuilder: (_) => [
              if (item.isDownloading)
                PopupMenuItem(
                  value: 'pause',
                  child: ListTile(
                    leading: const Text('⏸️', style: TextStyle(fontSize: 18)),
                    title: Text(
                      'Pause',
                      style: AppStyles.nunito(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.creamText,
                      ),
                    ),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              if (item.isPaused)
                PopupMenuItem(
                  value: 'resume',
                  child: ListTile(
                    leading: const Text('▶️', style: TextStyle(fontSize: 18)),
                    title: Text(
                      'Resume',
                      style: AppStyles.nunito(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.creamText,
                      ),
                    ),
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              PopupMenuItem(
                value: 'delete',
                child: ListTile(
                  leading: const Text('🗑️', style: TextStyle(fontSize: 18)),
                  title: Text(
                    'Delete',
                    style: AppStyles.nunito(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.creamText,
                    ),
                  ),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
            onSelected: (v) {
              switch (v) {
                case 'pause':
                  context.read<OfflineCubit>().pauseDownload(item.bookId);
                  break;
                case 'resume':
                  context.read<OfflineCubit>().resumeDownload(item);
                  break;
                case 'delete':
                  context.read<OfflineCubit>().deleteDownload(
                    item.bookId,
                    item.type,
                  );
                  break;
              }
            },
          ),
        ],
      ),
    );
  }

  void _clearAllDownloads(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'Clear All?',
          style: AppStyles.baloo2(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppTheme.creamText,
          ),
        ),
        content: Text(
          'Delete all downloaded files?',
          style: AppStyles.nunito(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppTheme.creamText,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: AppStyles.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.creamText,
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              Navigator.pop(ctx);
              context.read<OfflineCubit>().clearAllDownloads();
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.playfulRed,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                'Clear',
                style: AppStyles.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
