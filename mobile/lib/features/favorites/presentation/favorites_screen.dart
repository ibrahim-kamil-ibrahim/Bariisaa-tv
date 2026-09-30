import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/favorites_cubit.dart';
import '../domain/favorites_state.dart';
import '../../screen_theme/themed_screen_scaffold.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    context.read<FavoritesCubit>().loadFavorites();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Favorites',
      ),
      body: ThemedScreenScaffold(
        screenKey: 'favorites',
        child: BlocBuilder<FavoritesCubit, FavoritesState>(
          builder: (context, state) {
            if (state is FavoritesLoading) {
              return GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.5,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                ),
                itemCount: 4,
                itemBuilder: (_, _) => const ShimmerBookCard(),
              );
            }
            if (state is FavoritesError) {
              return FunErrorState(
                message: state.message,
                onRetry: () => context.read<FavoritesCubit>().loadFavorites(),
              );
            }
            if (state is FavoritesLoaded) {
              if (state.books.isEmpty) {
                return FunEmptyState(
                  emoji: '💛',
                  title: 'No favorites yet',
                  subtitle: 'Tap the ⭐ to save books!',
                  action: GestureDetector(
                    onTap: () => context.push(AppRoutes.discovery),
                    child: Container(
                      height: 56,
                      alignment: Alignment.center,
                      decoration: AppTheme.funButtonDecoration(AppTheme.gold),
                      child: Text(
                        'Explore Books',
                        style: AppStyles.nunito(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.deepIndigo,
                        ),
                      ),
                    ),
                  ),
                );
              }
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: RefreshIndicator(
                      onRefresh: () async {
                        context.read<FavoritesCubit>().loadFavorites();
                      },
                      child: GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.5,
                              crossAxisSpacing: 12,
                              mainAxisSpacing: 12,
                            ),
                        itemCount: state.books.length,
                        itemBuilder: (context, index) {
                          final book = state.books[index];
                          return Stack(
                            children: [
                              KidsBookCard(
                                title: book.title,
                                coverUrl: book.coverUrl,
                                authorName: book.authors.isNotEmpty
                                    ? book.authors.first.name
                                    : null,
                                rating: book.avgRating,
                                onTap: () => context.push(
                                  AppRoutes.bookDetail.replaceFirst(
                                    ':id',
                                    book.id,
                                  ),
                                ),
                              ),
                              Positioned(
                                top: 4,
                                right: 4,
                                child: GestureDetector(
                                  onTap: () => context
                                      .read<FavoritesCubit>()
                                      .removeFavorite(book.id),
                                  child: Container(
                                    width: 40,
                                    height: 40,
                                    decoration: AppTheme.funButtonDecoration(
                                      AppTheme.playfulRed,
                                    ),
                                    child: const Center(
                                      child: Text(
                                        '⭐',
                                        style: TextStyle(fontSize: 20),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
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
      ),
    );
  }
}
