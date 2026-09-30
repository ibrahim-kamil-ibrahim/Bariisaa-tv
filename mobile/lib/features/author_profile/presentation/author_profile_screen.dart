import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/di/injection.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../data/author_profile_repository.dart';
import '../presentation/author_profile_cubit.dart';
import '../domain/author_profile_state.dart';

class AuthorProfileScreen extends StatelessWidget {
  final String authorId;

  const AuthorProfileScreen({super.key, required this.authorId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          AuthorProfileCubit(getIt<AuthorProfileRepository>())
            ..loadAuthor(authorId),
      child: Scaffold(
        backgroundColor: AppTheme.creamBg,
        body: BlocBuilder<AuthorProfileCubit, AuthorProfileState>(
          builder: (context, state) {
            if (state is AuthorProfileLoading) {
              return const LoadingMascot(
                emoji: '⏳',
                message: 'Loading author...',
              );
            }
            if (state is AuthorProfileError) {
              return FunErrorState(
                message: state.message,
                onRetry: () =>
                    context.read<AuthorProfileCubit>().loadAuthor(authorId),
              );
            }
            if (state is AuthorProfileLoaded) {
              return _buildContent(context, state);
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, AuthorProfileLoaded state) {
    final author = state.author;
    final resolvedPhoto =
        author.photoUrl != null ? AppConstants.resolveUrl(author.photoUrl!) : null;
    final initial =
        author.name.isNotEmpty ? author.name[0].toUpperCase() : '?';

    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          stretch: true,
          backgroundColor: AppTheme.darkNavy,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(
              fit: StackFit.expand,
              children: [
                if (resolvedPhoto != null)
                  CachedNetworkImage(
                    imageUrl: resolvedPhoto,
                    fit: BoxFit.cover,
                    memCacheWidth: 800,
                    memCacheHeight: 600,
                    maxWidthDiskCache: 1200,
                    placeholder: (_, _) => Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [AppTheme.darkNavy, AppTheme.deepNavy],
                        ),
                      ),
                    ),
                    errorWidget: (_, _, _) => _heroFallback(initial),
                  )
                else
                  _heroFallback(initial),
                const DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.transparent,
                        Color(0xCC1F2A4A),
                        AppTheme.darkNavy,
                      ],
                      stops: [0.0, 0.5, 0.85, 1.0],
                    ),
                  ),
                ),
                Positioned(
                  left: 20,
                  right: 20,
                  bottom: 20,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        author.name,
                        style: AppStyles.baloo2(
                          fontSize: 28,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.white,
                          height: 1.1,
                        ),
                      ),
                      if (author.bio != null && author.bio!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          author.bio!,
                          style: AppStyles.nunito(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.white.withValues(alpha: 0.85),
                            height: 1.4,
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
          leading: Padding(
            padding: const EdgeInsets.all(8),
            child: GestureDetector(
              onTap: () => context.pop(),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.darkNavy.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.arrow_back_rounded,
                  size: 24,
                  color: AppTheme.white,
                ),
              ),
            ),
          ),
        ),

        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      colors: [AppTheme.gold, Color(0xFFFFC93D)],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.gold.withValues(alpha: 0.35),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      initial,
                      style: AppStyles.baloo2(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.deepNavy,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        author.name,
                        style: AppStyles.baloo2(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                        ),
                      ),
                      Text(
                        '${state.books.length} ${state.books.length == 1 ? 'book' : 'books'}',
                        style: AppStyles.nunito(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.charcoal,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        if (state.books.isNotEmpty) ...[
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.62,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              delegate: SliverChildBuilderDelegate((context, index) {
                final book = state.books[index];
                final resolvedCover = book.coverUrl != null
                    ? AppConstants.resolveUrl(book.coverUrl!)
                    : null;
                return KidsBookCard(
                  title: book.title,
                  coverUrl: resolvedCover,
                  authorName: null,
                  rating: book.avgRating,
                  isAudio: book.audioFile != null,
                  onTap: () => context.push(
                    AppRoutes.bookDetail.replaceFirst(':id', book.id),
                  ),
                );
              }, childCount: state.books.length),
            ),
          ),
        ] else ...[
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Column(
                children: [
                  const Text('📚', style: TextStyle(fontSize: 56)),
                  const SizedBox(height: 12),
                  Text(
                    'No books yet',
                    style: AppStyles.baloo2(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'This author hasn\'t published any books.',
                    style: AppStyles.nunito(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.charcoal,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
        const SliverPadding(padding: EdgeInsets.only(bottom: 32)),
      ],
    );
  }

  Widget _heroFallback(String initial) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppTheme.sunnyYellow, AppTheme.skyBlue],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Text(
          initial,
          style: AppStyles.baloo2(
            fontSize: 64,
            fontWeight: FontWeight.w800,
            color: AppTheme.white,
          ),
        ),
      ),
    );
  }
}
