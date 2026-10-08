import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../features/splash/presentation/splash_screen.dart';
import '../di/injection.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/auth/presentation/auth_cubit.dart';
import '../../features/discovery/presentation/discovery_screen.dart';
import '../../features/discovery/presentation/book_detail_screen.dart';
import '../../features/discovery/presentation/search_results_screen.dart';
import '../../features/discovery/presentation/category_browse_screen.dart';
import '../../features/favorites/presentation/favorites_screen.dart';
import '../../features/history/presentation/history_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/profile/presentation/edit_profile_screen.dart';
import '../../features/profile/presentation/devices_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../../features/subscription/presentation/paywall_screen.dart';
import '../../features/subscription/presentation/plans_screen.dart';
import '../../features/subscription/presentation/payment_success_screen.dart';
import '../../features/subscription/presentation/payment_failure_screen.dart';
import '../../features/subscription/presentation/payment_history_screen.dart';
import '../../features/offline/presentation/download_manager_screen.dart';
import '../../features/reviews/presentation/reviews_screen.dart';
import '../../features/reviews/presentation/write_review_screen.dart';
import '../../features/author_profile/presentation/author_profile_screen.dart';
import '../../features/audio_player/presentation/audio_player_screen.dart';
import '../../features/ebook_reader/presentation/ebook_reader_screen.dart';
import '../../features/ebook_reader/presentation/ebook_reader_cubit.dart';
import '../../features/ebook_reader/data/ebook_reader_repository.dart';
import '../../features/storytelling/presentation/storytelling_screen.dart';
import '../../features/storytelling/presentation/story_detail_screen.dart';
import '../../features/music/presentation/music_screen.dart';
import '../../features/music/presentation/music_player_screen.dart';
import '../../features/music/presentation/music_player_cubit.dart';
import '../../features/my_doctor/presentation/my_doctor_screen.dart';
import '../../features/my_captain/presentation/my_captain_screen.dart';
import '../../features/habits/presentation/habits_screen.dart';
import '../../features/books/presentation/books_screen.dart';
import '../../features/messaging/presentation/conversations_list_screen.dart';
import '../../features/messaging/presentation/chat_room_screen.dart';
import '../../features/media/presentation/video_player_screen.dart';
import '../../shared/models/models.dart';
import '../../shared/widgets/menu_all_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String discovery = '/discovery';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String favorites = '/favorites';
  static const String history = '/history';
  static const String profile = '/profile';
  static const String editProfile = '/edit-profile';
  static const String devices = '/devices';
  static const String notifications = '/notifications';
  static const String plans = '/plans';
  static const String paymentSuccess = '/payment-success';
  static const String paymentFailure = '/payment-failure';
  static const String paymentHistory = '/payment-history';
  static const String paywall = '/paywall';
  static const String downloads = '/downloads';
  static const String bookDetail = '/book/:id';
  static const String searchResults = '/search';
  static const String categoryBrowse = '/category/:id';
  static const String authorProfile = '/author/:id';
  static const String reviews = '/reviews/:bookId';
  static const String writeReview = '/write-review/:bookId';
  static const String audioPlayer = '/audio-player';
  static const String ebookReader = '/ebook-reader';
  static const String books = '/books';
  static const String storytelling = '/storytelling';
  static const String storyDetail = '/storytelling/:id';
  static const String music = '/music';
  static const String musicPlayer = '/music-player';
  static const String myDoctor = '/my-doctor';
  static const String myCaptain = '/my-captain';
  static const String habits = '/habits';
  static const String menuAll = '/menu-all';
  static const String conversations = '/conversations';
  static const String chat = '/chat/:conversationId';
  static const String videoPlayer = '/video/:id';
}

final rootNavigatorKey = GlobalKey<NavigatorState>();

GoRouter? _cachedRouter;

GoRouter createRouter() {
  if (_cachedRouter != null) return _cachedRouter!;
  _cachedRouter = GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.books,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const BooksScreen(),
      ),
      GoRoute(
        path: AppRoutes.storytelling,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const StorytellingScreen(),
      ),
      GoRoute(
        path: AppRoutes.storyDetail,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) {
          final id = state.pathParameters['id'];
          if (id == null || id.isEmpty)
            return const Scaffold(
              body: Center(child: Text('Story not found')),
            );
          return StoryDetailScreen(storyId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.music,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const MusicScreen(),
      ),
      GoRoute(
        path: AppRoutes.musicPlayer,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) {
          final extra = state.extra;
          if (extra is! Map<String, dynamic>) {
            return const Scaffold(
              body: Center(child: Text('No track provided')),
            );
          }
          final playlist =
              extra['playlist'] as List<Map<String, dynamic>>? ?? [];
          final index = extra['index'] as int? ?? 0;
          return BlocProvider(
            create: (_) => getIt<MusicPlayerCubit>(),
            child: MusicPlayerScreen(
              track: extra,
              playlist: playlist,
              index: index,
            ),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.myDoctor,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const MyDoctorScreen(),
      ),
      GoRoute(
        path: AppRoutes.myCaptain,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const MyCaptainScreen(),
      ),
      GoRoute(
        path: AppRoutes.discovery,
        builder: (context, state) => const DiscoveryScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        builder: (context, state) => BlocProvider.value(
          value: context.read<AuthCubit>(),
          child: const LoginScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.signup,
        builder: (context, state) => BlocProvider.value(
          value: context.read<AuthCubit>(),
          child: const SignupScreen(),
        ),
      ),
      GoRoute(
        path: AppRoutes.menuAll,
        builder: (context, state) => const MenuAllScreen(),
      ),
      GoRoute(
        path: AppRoutes.habits,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const HabitsScreen(),
      ),
      GoRoute(
        path: AppRoutes.conversations,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const ConversationsListScreen(),
      ),
      GoRoute(
        path: AppRoutes.chat,
        builder: (context, state) {
          final conversationId = state.pathParameters['conversationId'];
          final otherUser = state.extra;
          if (conversationId == null || otherUser is! UserModel) {
            return const Scaffold(body: Center(child: Text('Invalid chat')));
          }
          return ChatRoomScreen(
            conversationId: conversationId,
            otherUser: otherUser,
          );
        },
      ),
      GoRoute(
        path: AppRoutes.favorites,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const FavoritesScreen(),
      ),
      GoRoute(
        path: AppRoutes.profile,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.history,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) =>
            HistoryScreen(initialTab: state.uri.queryParameters['tab']),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        builder: (context, state) => const EditProfileScreen(),
      ),
      GoRoute(
        path: AppRoutes.devices,
        builder: (context, state) => const DevicesScreen(),
      ),
      GoRoute(
        path: AppRoutes.plans,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const PlansScreen(),
      ),
      GoRoute(
        path: AppRoutes.paywall,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const PaywallScreen(),
      ),
      GoRoute(
        path: AppRoutes.paymentSuccess,
        builder: (context, state) => const PaymentSuccessScreen(),
      ),
      GoRoute(
        path: AppRoutes.paymentFailure,
        builder: (context, state) => const PaymentFailureScreen(),
      ),
      GoRoute(
        path: AppRoutes.paymentHistory,
        builder: (context, state) => const PaymentHistoryScreen(),
      ),
      GoRoute(
        path: AppRoutes.downloads,
        parentNavigatorKey: rootNavigatorKey,
        builder: (context, state) => const DownloadManagerScreen(),
      ),
      GoRoute(
        path: AppRoutes.bookDetail,
        builder: (context, state) {
          final id = state.pathParameters['id'];
          if (id == null || id.isEmpty)
            return const Scaffold(body: Center(child: Text('Book not found')));
          return BookDetailScreen(bookId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.searchResults,
        builder: (context, state) =>
            SearchResultsScreen(query: state.uri.queryParameters['q'] ?? ''),
      ),
      GoRoute(
        path: AppRoutes.categoryBrowse,
        builder: (context, state) {
          final id = state.pathParameters['id'];
          if (id == null || id.isEmpty)
            return const Scaffold(
              body: Center(child: Text('Category not found')),
            );
          return CategoryBrowseScreen(categoryId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.authorProfile,
        builder: (context, state) {
          final id = state.pathParameters['id'];
          if (id == null || id.isEmpty)
            return const Scaffold(
              body: Center(child: Text('Author not found')),
            );
          return AuthorProfileScreen(authorId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.reviews,
        builder: (context, state) {
          final id = state.pathParameters['bookId'];
          if (id == null || id.isEmpty)
            return const Scaffold(
              body: Center(child: Text('Reviews not found')),
            );
          return ReviewsScreen(bookId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.writeReview,
        builder: (context, state) {
          final id = state.pathParameters['bookId'];
          if (id == null || id.isEmpty)
            return const Scaffold(body: Center(child: Text('Book not found')));
          return WriteReviewScreen(bookId: id);
        },
      ),
      GoRoute(
        path: AppRoutes.audioPlayer,
        builder: (context, state) {
          final extra = state.extra;
          if (extra is! BookModel) {
            return const Scaffold(
              body: Center(child: Text('No book provided')),
            );
          }
          return AudioPlayerScreen(book: extra);
        },
      ),
      GoRoute(
        path: AppRoutes.ebookReader,
        builder: (context, state) {
          final extra = state.extra;
          if (extra is! BookModel) {
            return const Scaffold(
              body: Center(child: Text('No book provided')),
            );
          }
          return BlocProvider(
            create: (_) =>
                EbookReaderCubit(getIt<EbookReaderRepository>())
                  ..loadBook(extra),
            child: EbookReaderScreen(book: extra),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.videoPlayer,
        builder: (context, state) {
          final id = state.pathParameters['id'];
          final title = state.extra;
          if (id == null || id.isEmpty)
            return const Scaffold(body: Center(child: Text('Video not found')));
          return VideoPlayerScreen(
            videoId: id,
            title: title is String ? title : 'Video',
          );
        },
      ),
    ],
  );
  return _cachedRouter!;
}
