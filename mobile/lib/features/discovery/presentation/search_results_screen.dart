import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/discovery_cubit.dart';
import '../domain/discovery_state.dart';

class SearchResultsScreen extends StatefulWidget {
  final String query;
  const SearchResultsScreen({super.key, this.query = ''});

  @override
  State<SearchResultsScreen> createState() => _SearchResultsScreenState();
}

class _SearchResultsScreenState extends State<SearchResultsScreen> {
  final _searchController = TextEditingController();
  String? _selectedCategoryId;
  String? _selectedLanguage;

  @override
  void initState() {
    super.initState();
    _searchController.text = widget.query;
    context.read<DiscoveryCubit>().loadCategories();
    if (widget.query.isNotEmpty) {
      context.read<DiscoveryCubit>().searchBooks(query: widget.query);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: AppBar(
        backgroundColor: AppTheme.creamBg,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: GestureDetector(
            onTap: () => context.pop(),
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.softPurple, width: 2),
              ),
              child: const Icon(Icons.arrow_back, color: AppTheme.darkNavy),
            ),
          ),
        ),
        title: Container(
          decoration: BoxDecoration(
            color: AppTheme.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.softPurple, width: 2),
          ),
          child: TextField(
            controller: _searchController,
            autofocus: true,
            decoration: InputDecoration(
              hintText: 'What do you want to hear today?',
              hintStyle: AppStyles.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.charcoal,
              ),
              prefixIcon: const Padding(
                padding: EdgeInsets.all(14),
                child: Text('🔍', style: TextStyle(fontSize: 20)),
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 16),
            ),
            onSubmitted: (v) {
              if (v.trim().isNotEmpty) {
                context.read<DiscoveryCubit>().searchBooks(
                  query: v.trim(),
                  categoryId: _selectedCategoryId,
                  language: _selectedLanguage,
                );
              }
            },
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.all(8),
            child: GestureDetector(
              onTap: () => _showFilters(context),
              child: Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.softPurple, width: 2),
                ),
                child: const Center(
                  child: Text('🔎', style: TextStyle(fontSize: 20)),
                ),
              ),
            ),
          ),
        ],
      ),
      body: BlocBuilder<DiscoveryCubit, DiscoveryState>(
        builder: (context, state) {
          if (state is DiscoveryLoading) {
            return const LoadingMascot(message: 'Searching...');
          }
          if (state is DiscoveryError) {
            return FunErrorState(
              message: state.message,
              onRetry: () => context.read<DiscoveryCubit>().searchBooks(
                query: widget.query,
              ),
            );
          }
          if (state is SearchLoaded) {
            if (state.results.isEmpty) {
              return const FunEmptyState(
                emoji: '😕',
                title: 'No results',
                subtitle: 'Try different keywords',
              );
            }
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${state.results.length} found',
                    style: AppStyles.nunito(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.darkNavy,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: GridView.builder(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.5,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                      itemCount: state.results.length,
                      itemBuilder: (context, index) {
                        final book = state.results[index];
                        return KidsBookCard(
                          title: book.title,
                          coverUrl: book.coverUrl,
                          authorName: book.authors.isNotEmpty
                              ? book.authors.first.name
                              : null,
                          rating: book.avgRating,
                          onTap: () => context.push(
                            AppRoutes.bookDetail.replaceFirst(':id', book.id),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            );
          }
          return const FunEmptyState(
            emoji: '🔍',
            title: 'Search for books',
            subtitle: 'Type a title or author name',
          );
        },
      ),
    );
  }

  void _showFilters(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Filters',
              style: AppStyles.baloo2(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppTheme.creamBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.softPurple, width: 2),
              ),
              child: TextField(
                decoration: InputDecoration(
                  hintText: 'Category ID',
                  hintStyle: AppStyles.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.charcoal,
                  ),
                  prefixIcon: const Padding(
                    padding: EdgeInsets.all(14),
                    child: Text('📂', style: TextStyle(fontSize: 18)),
                  ),
                  border: InputBorder.none,
                ),
                onChanged: (v) => _selectedCategoryId = v.isNotEmpty ? v : null,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: AppTheme.creamBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.softPurple, width: 2),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String>(
                  value: _selectedLanguage,
                  hint: Row(
                    children: [
                      const Text('🌐', style: TextStyle(fontSize: 18)),
                      const SizedBox(width: 8),
                      Text(
                        'Language',
                        style: AppStyles.nunito(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.charcoal,
                        ),
                      ),
                    ],
                  ),
                  isExpanded: true,
                  items: const [
                    DropdownMenuItem(value: null, child: Text('All')),
                    DropdownMenuItem(value: 'en', child: Text('English')),
                    DropdownMenuItem(value: 'hi', child: Text('Hindi')),
                    DropdownMenuItem(value: 'bn', child: Text('Bengali')),
                  ],
                  onChanged: (v) => _selectedLanguage = v,
                ),
              ),
            ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: () {
                Navigator.pop(ctx);
                if (_searchController.text.trim().isNotEmpty) {
                  context.read<DiscoveryCubit>().searchBooks(
                    query: _searchController.text.trim(),
                    categoryId: _selectedCategoryId,
                    language: _selectedLanguage,
                  );
                }
              },
              child: Container(
                height: 56,
                alignment: Alignment.center,
                decoration: AppTheme.funButtonDecoration(AppTheme.sunnyYellow),
                child: Text(
                  'Apply Filters',
                  style: AppStyles.nunito(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.deepNavy,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
