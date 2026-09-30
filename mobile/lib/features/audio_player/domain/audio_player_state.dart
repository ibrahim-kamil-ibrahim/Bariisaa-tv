import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class AudioPlayerState extends Equatable {
  const AudioPlayerState();

  @override
  List<Object?> get props => [];
}

class AudioPlayerInitial extends AudioPlayerState {}

class AudioPlayerLoading extends AudioPlayerState {}

class AudioPlayerLoaded extends AudioPlayerState {
  final BookModel book;
  final bool isPlaying;
  final Duration position;
  final Duration duration;
  final double playbackSpeed;
  final int? sleepTimerMinutes;
  final List<BookmarkModel> bookmarks;
  final int currentChapterIndex;

  const AudioPlayerLoaded({
    required this.book,
    this.isPlaying = false,
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.playbackSpeed = 1.0,
    this.sleepTimerMinutes,
    this.bookmarks = const [],
    this.currentChapterIndex = 0,
  });

  AudioPlayerLoaded copyWith({
    BookModel? book,
    bool? isPlaying,
    Duration? position,
    Duration? duration,
    double? playbackSpeed,
    bool clearSleepTimer = false,
    int? sleepTimerMinutes,
    List<BookmarkModel>? bookmarks,
    int? currentChapterIndex,
  }) {
    return AudioPlayerLoaded(
      book: book ?? this.book,
      isPlaying: isPlaying ?? this.isPlaying,
      position: position ?? this.position,
      duration: duration ?? this.duration,
      playbackSpeed: playbackSpeed ?? this.playbackSpeed,
      sleepTimerMinutes: clearSleepTimer
          ? null
          : (sleepTimerMinutes ?? this.sleepTimerMinutes),
      bookmarks: bookmarks ?? this.bookmarks,
      currentChapterIndex: currentChapterIndex ?? this.currentChapterIndex,
    );
  }

  @override
  List<Object?> get props => [
    book,
    isPlaying,
    position,
    duration,
    playbackSpeed,
    sleepTimerMinutes,
    bookmarks,
    currentChapterIndex,
  ];
}

class AudioPlayerError extends AudioPlayerState {
  final String message;

  const AudioPlayerError(this.message);

  @override
  List<Object?> get props => [message];
}
