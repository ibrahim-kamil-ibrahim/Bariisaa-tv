import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart'
    show kIsWeb, kReleaseMode, defaultTargetPlatform;
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pdfrx/pdfrx.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/models/models.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/constants/app_constants.dart';
import '../presentation/ebook_reader_cubit.dart';
import '../domain/ebook_reader_state.dart';
import '../../screen_theme/themed_screen_scaffold.dart';

class EbookReaderScreen extends StatelessWidget {
  final BookModel book;
  const EbookReaderScreen({super.key, required this.book});

  @override
  Widget build(BuildContext context) {
    return _EbookReaderContent(book: book);
  }
}

class _EbookReaderContent extends StatefulWidget {
  final BookModel book;
  const _EbookReaderContent({required this.book});

  @override
  State<_EbookReaderContent> createState() => _EbookReaderContentState();
}

class _EbookReaderContentState extends State<_EbookReaderContent>
    with SingleTickerProviderStateMixin {
  bool _showSettings = false;
  bool _hasShownCompletion = false;
  bool _pdfFailed = false;
  final ScrollController _scrollController = ScrollController();
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    );
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients || _hasShownCompletion) return;
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 10) {
      _hasShownCompletion = true;
      _showCompletionSheet();
    }
  }

  void _showCompletionSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🎉', style: TextStyle(fontSize: 64)),
            const SizedBox(height: 12),
            Text(
              'Finished!',
              style: AppStyles.baloo2(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You completed "${widget.book.title}"',
              textAlign: TextAlign.center,
              style: AppStyles.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.charcoal,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: GestureDetector(
                onTap: () {
                  Navigator.pop(ctx);
                  context.push(
                    AppRoutes.reviews.replaceFirst(':bookId', widget.book.id),
                  );
                },
                child: Container(
                  height: 56,
                  alignment: Alignment.center,
                  decoration: AppTheme.funButtonDecoration(
                    AppTheme.sunnyYellow,
                  ),
                  child: Text(
                    'Rate & Review',
                    style: AppStyles.nunito(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.deepNavy,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: GestureDetector(
                onTap: () {
                  Navigator.pop(ctx);
                  context.push(
                    AppRoutes.bookDetail.replaceFirst(':id', widget.book.id),
                  );
                },
                child: Container(
                  height: 56,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: AppTheme.white,
                    borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                    border: Border.all(color: AppTheme.skyBlue, width: 2),
                  ),
                  child: Text(
                    'See Details',
                    style: AppStyles.nunito(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.skyBlue,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.go(AppRoutes.books);
              },
              child: Text(
                'Back to Library',
                style: AppStyles.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.charcoal,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ThemedScreenScaffold(
        screenKey: 'ebook_reader',
        child: BlocBuilder<EbookReaderCubit, EbookReaderState>(
          builder: (context, state) {
            if (state is EbookReaderLoading)
              return const LoadingMascot(message: 'Opening book...');
            if (state is EbookReaderError)
              return FunErrorState(
                message: state.message,
                onRetry: () =>
                    context.read<EbookReaderCubit>().loadBook(widget.book),
              );
            if (state is EbookReaderLoaded) return _buildReader(context, state);
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Color _bg(String theme) {
    if (theme == 'dark') return const Color(0xFF1A1A2E);
    if (theme == 'sepia') return const Color(0xFFF5E6CC);
    return AppTheme.creamBg;
  }

  Color _text(String theme) {
    if (theme == 'dark') return AppTheme.white;
    if (theme == 'sepia') return const Color(0xFF5D4037);
    return AppTheme.darkText;
  }

  String _normalizeUrl(String url) {
    if (!kIsWeb &&
        !kReleaseMode &&
        (defaultTargetPlatform == TargetPlatform.android ||
         defaultTargetPlatform == TargetPlatform.iOS)) {
      return url.replaceFirst('://localhost:', '://10.0.2.2:');
    }
    return url;
  }

  /// pdfrx requires pdfium.dll which is only available on Android & iOS.
  /// On Windows/Linux/macOS desktop the native asset is not bundled so we
  /// skip the PDF engine and show a text preview instead.
  bool get _isPdfSupported =>
      !kIsWeb && !Platform.isWindows && !Platform.isLinux && !Platform.isMacOS;

  Widget _buildReader(BuildContext context, EbookReaderLoaded state) {
    final bgColor = _bg(state.theme);
    final textColor = _text(state.theme);
    final pdfUrl = state.book.pdfFile?.fileUrl;

    Widget pdfWidget;
    if (!_isPdfSupported) {
      // Desktop platform — pdfium.dll not available, show text preview.
      pdfWidget = _buildTextContent(
        context,
        state,
        textColor,
        pdfUnavailable: pdfUrl != null,
      );
    } else if (_pdfFailed) {
      pdfWidget = _buildTextContent(
        context,
        state,
        textColor,
        pdfUnavailable: true,
      );
    } else if (state.localPdfPath != null) {
      pdfWidget = PdfViewer.file(
        state.localPdfPath!,
        params: PdfViewerParams(
          onPageChanged: (page) {
            if (page != null) {
              context.read<EbookReaderCubit>().setCurrentPage(page - 1);
            }
          },
          errorBannerBuilder: (context, error, stackTrace, documentRef) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && !_pdfFailed) setState(() => _pdfFailed = true);
            });
            return const SizedBox.shrink();
          },
        ),
      );
    } else if (pdfUrl != null && pdfUrl.isNotEmpty) {
      pdfWidget = PdfViewer.uri(
        Uri.parse(_normalizeUrl(pdfUrl)),
        params: PdfViewerParams(
          onPageChanged: (page) {
            if (page != null) {
              context.read<EbookReaderCubit>().setCurrentPage(page - 1);
            }
          },
          errorBannerBuilder: (context, error, stackTrace, documentRef) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted && !_pdfFailed) setState(() => _pdfFailed = true);
            });
            return const SizedBox.shrink();
          },
        ),
      );
    } else {
      pdfWidget = _buildTextContent(context, state, textColor);
    }

    return Stack(
      children: [
        // Reading content
        Column(
          children: [
            Expanded(
              child: GestureDetector(
                onDoubleTap: () {
                  setState(() => _showSettings = !_showSettings);
                  if (_showSettings) {
                    _fadeController.forward();
                  } else {
                    _fadeController.reverse();
                  }
                },
                child: Container(color: bgColor, child: pdfWidget),
              ),
            ),
            // Bottom page indicator
            Container(
              color: bgColor,
              padding: const EdgeInsets.only(bottom: 16),
              child: Center(
                child: Text(
                  'Page ${state.currentPage + 1}',
                  style: AppStyles.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textColor.withValues(alpha: 0.5),
                  ),
                ),
              ),
            ),
          ],
        ),

        // Controls overlay
        if (_showSettings)
          FadeTransition(
            opacity: _fadeAnimation,
            child: Column(
              children: [
                // Top bar
                SafeArea(
                  bottom: false,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    color: bgColor.withValues(alpha: 0.95),
                    child: Row(
                      children: [
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: textColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: KidsIconButton(
                            onTap: () => Navigator.pop(context),
                            child: Icon(Icons.arrow_back, color: textColor),
                          ),
                        ),
                        Expanded(
                          child: Text(
                            state.book.title,
                            style: AppStyles.nunito(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: textColor,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.center,
                          ),
                        ),
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            color: textColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: KidsIconButton(
                            onTap: () {
                              setState(() => _showSettings = false);
                              _fadeController.reverse();
                            },
                            child: Icon(Icons.close, color: textColor),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const Spacer(),

                // Settings panel
                SafeArea(
                  top: false,
                  child: _buildSettingsPanel(
                    context,
                    state,
                    textColor,
                    bgColor,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildTextContent(
    BuildContext context,
    EbookReaderLoaded state,
    Color textColor, {
    bool pdfUnavailable = false,
  }) {
    return SingleChildScrollView(
      controller: _scrollController,
      padding: const EdgeInsets.all(28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (pdfUnavailable) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.sunnyYellow.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Text('📖', style: TextStyle(fontSize: 20)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'PDF file is not uploaded or unreachable — showing text preview.',
                      style: AppStyles.nunito(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: textColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
          Text(
            state.book.title,
            style: AppStyles.baloo2(
              fontSize: state.fontSize + 10,
              fontWeight: FontWeight.w700,
              color: textColor,
            ),
          ),
          const SizedBox(height: 20),
          Text(
            state.book.description ?? 'No content available.',
            style: AppStyles.nunito(
              fontSize: state.fontSize,
              fontWeight: FontWeight.w600,
              color: textColor,
              height: 1.8,
            ),
          ),
          const SizedBox(height: 40),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: textColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                'Page ${state.currentPage + 1}',
                style: AppStyles.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: textColor.withValues(alpha: 0.5),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsPanel(
    BuildContext context,
    EbookReaderLoaded state,
    Color textColor,
    Color bgColor,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Reading mode — 3 clearly different kid-safe themes
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _themeBlob(
                'light',
                '☀️',
                AppTheme.sunnyYellow,
                state.theme == 'light',
                textColor,
              ),
              const SizedBox(width: 16),
              _themeBlob(
                'sepia',
                '📜',
                const Color(0xFF8D6E63),
                state.theme == 'sepia',
                textColor,
              ),
              const SizedBox(width: 16),
              _themeBlob(
                'dark',
                '🌙',
                const Color(0xFF37474F),
                state.theme == 'dark',
                textColor,
              ),
            ],
          ),

          const SizedBox(height: 20),

          // Font size — big A- / A+ stepper (no slider)
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _fontStepButton(
                'A−',
                () => context.read<EbookReaderCubit>().decreaseFontSize(),
                textColor,
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  '${state.fontSize.toInt()}',
                  style: AppStyles.nunito(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: textColor,
                  ),
                ),
              ),
              _fontStepButton(
                'A+',
                () => context.read<EbookReaderCubit>().increaseFontSize(),
                textColor,
              ),
            ],
          ),

          const SizedBox(height: 16),

          // More — font family + bookmarks
          GestureDetector(
            onTap: () => _showMoreReaderOptions(context, state, textColor),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: textColor.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.tune_rounded, size: 22, color: textColor),
                  const SizedBox(width: 8),
                  Text(
                    'More',
                    style: AppStyles.nunito(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: textColor,
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _fontStepButton(String label, VoidCallback onTap, Color textColor) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 60,
        height: 60,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: textColor.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(18),
        ),
        child: Text(
          label,
          style: AppStyles.baloo2(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: textColor,
          ),
        ),
      ),
    );
  }

  Widget _themeBlob(
    String theme,
    String emoji,
    Color color,
    bool isSelected,
    Color textColor,
  ) {
    return GestureDetector(
      onTap: () => context.read<EbookReaderCubit>().setTheme(theme),
      child: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: isSelected ? color : color.withValues(alpha: 0.2),
          shape: BoxShape.circle,
          border: isSelected ? Border.all(color: textColor, width: 3) : null,
        ),
        child: Center(child: Text(emoji, style: const TextStyle(fontSize: 28))),
      ),
    );
  }

  void _showMoreReaderOptions(
    BuildContext context,
    EbookReaderLoaded state,
    Color textColor,
  ) {
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
              'More',
              style: AppStyles.baloo2(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () {
                Navigator.pop(ctx);
                _showFontPicker(context, state, textColor);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.creamBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.softPurple, width: 1.5),
                ),
                child: Row(
                  children: [
                    Icon(Icons.text_fields, size: 24, color: AppTheme.skyBlue),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Font',
                        style: AppStyles.nunito(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: AppTheme.charcoal,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () {
                Navigator.pop(ctx);
                _showBookmarks(context, state, textColor);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.creamBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.softPurple, width: 1.5),
                ),
                child: Row(
                  children: [
                    const Text('⭐', style: TextStyle(fontSize: 20)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Bookmarks',
                        style: AppStyles.nunito(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: AppTheme.charcoal,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: () async {
                Navigator.pop(ctx);
                try {
                  await context.read<EbookReaderCubit>().addBookmark();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Bookmark added!',
                          style: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.white,
                          ),
                        ),
                        backgroundColor: AppTheme.mintGreen,
                      ),
                    );
                  }
                } catch (_) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          'Bookmark failed',
                          style: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.playfulRed,
                          ),
                        ),
                        backgroundColor: AppTheme.white,
                      ),
                    );
                  }
                }
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.creamBg,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.softPurple, width: 1.5),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.bookmark_add_rounded,
                      size: 24,
                      color: AppTheme.skyBlue,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Add Bookmark',
                        style: AppStyles.nunito(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                        ),
                      ),
                    ),
                    const Icon(
                      Icons.chevron_right_rounded,
                      color: AppTheme.charcoal,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFontPicker(
    BuildContext context,
    EbookReaderLoaded state,
    Color textColor,
  ) {
    final fonts = AppConstants.fontFamilies;
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
              'Choose Font',
              style: AppStyles.baloo2(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: fonts.map((font) {
                final isSelected = state.fontFamily == font;
                return GestureDetector(
                  onTap: () {
                    context.read<EbookReaderCubit>().setFontFamily(font);
                    Navigator.pop(ctx);
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.sunnyYellow
                          : AppTheme.creamBg,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(
                        color: isSelected
                            ? AppTheme.sunnyYellow
                            : AppTheme.softPurple,
                        width: 3,
                      ),
                    ),
                    child: Text(
                      font,
                      style: TextStyle(
                        fontFamily: font,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.darkNavy,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  void _showBookmarks(
    BuildContext context,
    EbookReaderLoaded state,
    Color textColor,
  ) {
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
              'Bookmarks',
              style: AppStyles.baloo2(
                fontSize: 26,
                fontWeight: FontWeight.w700,
                color: AppTheme.darkNavy,
              ),
            ),
            const SizedBox(height: 16),
            if (state.bookmarks.isEmpty)
              Padding(
                padding: const EdgeInsets.all(20),
                child: Text(
                  'No bookmarks yet',
                  style: AppStyles.nunito(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.charcoal,
                  ),
                  textAlign: TextAlign.center,
                ),
              )
            else
              ...state.bookmarks.map(
                (b) => Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 14,
                  ),
                  decoration: AppTheme.gridCardDecoration(AppTheme.skyBlue),
                  child: Row(
                    children: [
                      const Text('⭐', style: TextStyle(fontSize: 20)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          b.label ?? 'Page ${b.position ?? "?"}',
                          style: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.darkNavy,
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          context.read<EbookReaderCubit>().deleteBookmark(b.id);
                          Navigator.pop(ctx);
                        },
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: AppTheme.funButtonDecoration(
                            AppTheme.softAmber,
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.delete_outline,
                              size: 20,
                              color: AppTheme.deepNavy,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
