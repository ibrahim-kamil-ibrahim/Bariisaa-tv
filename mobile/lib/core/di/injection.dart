import 'package:get_it/get_it.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../network/api_client.dart';
import '../storage/secure_storage.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/presentation/auth_cubit.dart';
import '../../features/habits/data/habits_repository.dart';
import '../../features/habits/presentation/habits_cubit.dart';
import '../../features/discovery/data/discovery_repository.dart';
import '../../features/discovery/presentation/discovery_cubit.dart';
import '../../features/favorites/data/favorites_repository.dart';
import '../../features/favorites/presentation/favorites_cubit.dart';
import '../../features/history/data/history_repository.dart';
import '../../features/history/presentation/history_cubit.dart';
import '../../features/profile/data/profile_repository.dart';
import '../../features/profile/presentation/profile_cubit.dart';
import '../../features/notifications/data/notifications_repository.dart';
import '../../features/notifications/presentation/notifications_cubit.dart';
import '../../features/subscription/data/subscription_repository.dart';
import '../../features/subscription/presentation/subscription_cubit.dart';
import '../../features/offline/data/offline_repository.dart';
import '../../features/offline/presentation/offline_cubit.dart';
import '../../features/reviews/data/reviews_repository.dart';
import '../../features/reviews/presentation/reviews_cubit.dart';
import '../../features/audio_player/data/audio_player_repository.dart';
import '../../features/audio_player/presentation/audio_player_cubit.dart';
import '../../features/author_profile/data/author_profile_repository.dart';
import '../../features/author_profile/presentation/author_profile_cubit.dart';
import '../../features/storytelling/data/storytelling_repository.dart';
import '../../features/storytelling/presentation/storytelling_cubit.dart';
import '../../features/music/data/music_repository.dart';
import '../../features/music/presentation/music_cubit.dart';
import '../../features/music/presentation/music_player_cubit.dart';
import '../../features/my_doctor/data/my_doctor_repository.dart';
import '../../features/my_doctor/presentation/my_doctor_cubit.dart';
import '../../features/my_captain/data/my_captain_repository.dart';
import '../../features/my_captain/presentation/my_captain_cubit.dart';
import '../../features/ebook_reader/data/ebook_reader_repository.dart';
import '../../features/messaging/data/messaging_repository.dart';
import '../../features/messaging/presentation/messaging_cubit.dart';
import '../../features/books/data/books_repository.dart';
import '../../features/books/presentation/books_cubit.dart';
import '../../features/screen_theme/screen_theme_repository.dart';
import '../../features/screen_theme/screen_theme_cubit.dart';
import '../../features/media/data/media_repository.dart';

final getIt = GetIt.instance;

Future<void> setupDependencies() async {
  getIt.registerLazySingleton<ApiClient>(() => ApiClient());
  getIt.registerLazySingleton<SecureStorageService>(
    () => SecureStorageService(),
  );
  getIt.registerLazySingleton<AuthRepository>(
    () => AuthRepository(getIt<ApiClient>(), getIt<SecureStorageService>()),
  );
  getIt.registerLazySingleton<AuthCubit>(
    () => AuthCubit(getIt<AuthRepository>()),
  );

  getIt.registerLazySingleton<DiscoveryRepository>(
    () =>
        DiscoveryRepository(getIt<ApiClient>(), getIt<SecureStorageService>()),
  );
  getIt.registerLazySingleton<FavoritesRepository>(() => FavoritesRepository());
  getIt.registerLazySingleton<HistoryRepository>(() => HistoryRepository());
  getIt.registerLazySingleton<ProfileRepository>(() => ProfileRepository());
  getIt.registerLazySingleton<NotificationsRepository>(
    () => NotificationsRepository(),
  );
  getIt.registerLazySingleton<SubscriptionRepository>(
    () => SubscriptionRepository(),
  );
  getIt.registerLazySingleton<OfflineRepository>(() => OfflineRepository());
  getIt.registerLazySingleton<ReviewsRepository>(() => ReviewsRepository());
  getIt.registerLazySingleton<AudioPlayerRepository>(
    () => AudioPlayerRepository(
      getIt<ApiClient>(),
      getIt<SecureStorageService>(),
    ),
  );
  getIt.registerLazySingleton<AuthorProfileRepository>(
    () => AuthorProfileRepository(),
  );
  getIt.registerLazySingleton<StorytellingRepository>(
    () => StorytellingRepository(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<StorytellingCubit>(
    () => StorytellingCubit(getIt<StorytellingRepository>()),
  );
  getIt.registerLazySingleton<MusicRepository>(
    () => MusicRepository(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<MusicCubit>(
    () => MusicCubit(getIt<MusicRepository>()),
  );
  getIt.registerFactory<MusicPlayerCubit>(
    () => MusicPlayerCubit(getIt<MusicRepository>()),
  );
  getIt.registerLazySingleton<MyDoctorRepository>(
    () => MyDoctorRepository(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<MyDoctorCubit>(
    () => MyDoctorCubit(getIt<MyDoctorRepository>()),
  );
  getIt.registerLazySingleton<MyCaptainRepository>(
    () => MyCaptainRepository(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<MyCaptainCubit>(
    () => MyCaptainCubit(getIt<MyCaptainRepository>()),
  );
  getIt.registerLazySingleton<HabitsRepository>(
    () => HabitsRepository(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<HabitsCubit>(
    () => HabitsCubit(getIt<HabitsRepository>()),
  );
  getIt.registerLazySingleton<EbookReaderRepository>(
    () => EbookReaderRepository(
      getIt<ApiClient>(),
      getIt<SecureStorageService>(),
    ),
  );
  getIt.registerLazySingleton<MessagingRepository>(() => MessagingRepository());
  getIt.registerLazySingleton<MessagingCubit>(
    () => MessagingCubit(getIt<MessagingRepository>()),
  );
  getIt.registerLazySingleton<BooksRepository>(
    () => BooksRepository(getIt<ApiClient>(), getIt<SecureStorageService>()),
  );
  getIt.registerLazySingleton<BooksCubit>(
    () => BooksCubit(getIt<BooksRepository>(), getIt<HistoryRepository>()),
  );
  getIt.registerLazySingleton<ScreenThemeRepository>(
    () => ScreenThemeRepository(),
  );
  getIt.registerLazySingleton<MediaRepository>(
    () => MediaRepository(getIt<ApiClient>()),
  );
  getIt.registerLazySingleton<ScreenThemeCubit>(
    () => ScreenThemeCubit(getIt<ScreenThemeRepository>()),
  );
}

List<BlocProvider> createProviders() {
  return [
    BlocProvider<AuthCubit>.value(value: getIt<AuthCubit>()),
    BlocProvider<DiscoveryCubit>(
      create: (_) => DiscoveryCubit(getIt<DiscoveryRepository>()),
    ),
    BlocProvider<FavoritesCubit>(
      create: (_) => FavoritesCubit(getIt<FavoritesRepository>()),
    ),
    BlocProvider<HistoryCubit>(
      create: (_) => HistoryCubit(getIt<HistoryRepository>()),
    ),
    BlocProvider<ProfileCubit>(
      create: (_) => ProfileCubit(getIt<ProfileRepository>()),
    ),
    BlocProvider<NotificationsCubit>(
      create: (_) => NotificationsCubit(getIt<NotificationsRepository>()),
    ),
    BlocProvider<SubscriptionCubit>(
      create: (_) => SubscriptionCubit(getIt<SubscriptionRepository>()),
    ),
    BlocProvider<OfflineCubit>(
      create: (_) => OfflineCubit(getIt<OfflineRepository>()),
    ),
    BlocProvider<ReviewsCubit>(
      create: (_) => ReviewsCubit(getIt<ReviewsRepository>()),
    ),
    BlocProvider<AudioPlayerCubit>(
      create: (_) => AudioPlayerCubit(getIt<AudioPlayerRepository>()),
    ),
    BlocProvider<AuthorProfileCubit>(
      create: (_) => AuthorProfileCubit(getIt<AuthorProfileRepository>()),
    ),
    BlocProvider<StorytellingCubit>.value(value: getIt<StorytellingCubit>()),
    BlocProvider<MusicCubit>.value(value: getIt<MusicCubit>()),
    BlocProvider<MyDoctorCubit>.value(value: getIt<MyDoctorCubit>()),
    BlocProvider<MyCaptainCubit>.value(value: getIt<MyCaptainCubit>()),
    BlocProvider<HabitsCubit>.value(value: getIt<HabitsCubit>()),
    BlocProvider<MessagingCubit>.value(value: getIt<MessagingCubit>()),
    BlocProvider<BooksCubit>.value(value: getIt<BooksCubit>()),
    BlocProvider<ScreenThemeCubit>.value(value: getIt<ScreenThemeCubit>()),
  ];
}
