import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/widgets/content_cards.dart';
import '../../../shared/models/models.dart';
import '../presentation/discovery_cubit.dart';
import '../domain/discovery_state.dart';

class CategoryBrowseScreen extends StatefulWidget {
  final String categoryId;
  const CategoryBrowseScreen({super.key, required this.categoryId});

  @override
  State<CategoryBrowseScreen> createState() => _CategoryBrowseScreenState();
}

class _CategoryBrowseScreenState extends State<CategoryBrowseScreen> {
  List<CategoryModel> _categories = [];
  String? _activeCategoryId;

  static const List<Color> _chipColors = [
    AppTheme.skyBlue,
    AppTheme.softPurple,
    AppTheme.mintGreen,
    AppTheme.sunnyYellow,
  ];

  @override
  void initState() {
    super.initState();
    _activeCategoryId = widget.categoryId;
    context.read<DiscoveryCubit>().loadCategories();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Categories',
      ),
      body: BlocListener<DiscoveryCubit, DiscoveryState>(
        listener: (context, state) {
          if (state is CategoriesLoaded &&
              state.categories.isNotEmpty &&
              mounted) {
            setState(() => _categories = state.categories);
            final cubit = context.read<DiscoveryCubit>();
            Future.microtask(() {
              if (mounted) {
                cubit.searchBooks(
                  query: '',
                  categoryId: _activeCategoryId ?? widget.categoryId,
                );
              }
            });
          }
        },
        child: BlocBuilder<DiscoveryCubit, DiscoveryState>(
          builder: (context, state) {
            return Column(
              children: [
                if (_categories.isNotEmpty) _buildChips(),
                Expanded(child: _buildBody(state)),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildChips() {
    return SizedBox(
      height: 60,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _categories.length,
        separatorBuilder: (_, _) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final selected = cat.id == (_activeCategoryId ?? widget.categoryId);
          final color = _chipColors[index % _chipColors.length];
          return GestureDetector(
            onTap: () {
              setState(() => _activeCategoryId = cat.id);
              context.read<DiscoveryCubit>().searchBooks(
                query: '',
                categoryId: cat.id,
              );
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: selected ? color.withValues(alpha: 0.2) : AppTheme.white,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: selected ? color : AppTheme.softPurple,
                  width: 2,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    cat.iconEmoji != null && cat.iconEmoji!.isNotEmpty
                        ? cat.iconEmoji!
                        : '📚',
                    style: const TextStyle(fontSize: 18),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    cat.name,
                    style: AppStyles.nunito(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBody(DiscoveryState state) {
    if (state is SearchLoaded) {
      if (state.results.isEmpty) {
        return const FunEmptyState(emoji: '📚', title: 'No books here yet');
      }
      return GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.62,
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
        ),
        itemCount: state.results.length,
        itemBuilder: (context, index) => _bookCard(state.results[index]),
      );
    }
    if (state is DiscoveryError) {
      return FunErrorState(
        message: state.message,
        onRetry: () => context.read<DiscoveryCubit>().searchBooks(
          query: '',
          categoryId: _activeCategoryId ?? widget.categoryId,
        ),
      );
    }
    // DiscoveryLoading / CategoriesLoaded (transient) / initial
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.62,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: 6,
      itemBuilder: (_, _) => const ContentCardSkeleton(),
    );
  }

  Widget _bookCard(BookModel book) {
    final isAudio = book.audioFile != null;
    Future<Object?> onTap() =>
        context.push(AppRoutes.bookDetail.replaceFirst(':id', book.id));
    if (isAudio) {
      return AudioBookCard(
        title: book.title,
        coverUrl: book.coverUrl,
        author: book.authors.isNotEmpty ? book.authors.first.name : null,
        rating: book.avgRating,
        durationSeconds: book.audioFile?.durationSeconds,
        isPremium: book.isPremium,
        onTap: onTap,
        onPlay: onTap,
      );
    }
    return EbookCard(
      title: book.title,
      coverUrl: book.coverUrl,
      author: book.authors.isNotEmpty ? book.authors.first.name : null,
      rating: book.avgRating,
      isPremium: book.isPremium,
      onTap: onTap,
      onRead: onTap,
    );
  }
}
