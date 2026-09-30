import 'package:equatable/equatable.dart';

abstract class MusicPlayerState extends Equatable {
  const MusicPlayerState();
  @override
  List<Object?> get props => [];
}

class MusicPlayerInitial extends MusicPlayerState {}

class MusicPlayerLoading extends MusicPlayerState {}

class MusicPlayerLoaded extends MusicPlayerState {
  final String id;
  final String title;
  final String? artist;
  final String? coverUrl;
  final String? audioUrl;
  final String? pdfUrl;
  final double price;
  final Duration position;
  final Duration duration;
  final bool isPlaying;
  final double playbackSpeed;
  final int? sleepTimerMinutes;
  final List<Map<String, dynamic>> playlist;
  final int currentIndex;

  const MusicPlayerLoaded({
    required this.id,
    required this.title,
    this.artist,
    this.coverUrl,
    this.audioUrl,
    this.pdfUrl,
    this.price = 0,
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.isPlaying = false,
    this.playbackSpeed = 1.0,
    this.sleepTimerMinutes,
    this.playlist = const [],
    this.currentIndex = 0,
  });

  MusicPlayerLoaded copyWith({
    Duration? position,
    Duration? duration,
    bool? isPlaying,
    double? playbackSpeed,
    int? sleepTimerMinutes,
    String? audioUrl,
    int? currentIndex,
    List<Map<String, dynamic>>? playlist,
  }) {
    return MusicPlayerLoaded(
      id: id,
      title: title,
      artist: artist,
      coverUrl: coverUrl,
      audioUrl: audioUrl ?? this.audioUrl,
      pdfUrl: pdfUrl,
      price: price,
      position: position ?? this.position,
      duration: duration ?? this.duration,
      isPlaying: isPlaying ?? this.isPlaying,
      playbackSpeed: playbackSpeed ?? this.playbackSpeed,
      sleepTimerMinutes: sleepTimerMinutes,
      playlist: playlist ?? this.playlist,
      currentIndex: currentIndex ?? this.currentIndex,
    );
  }

  @override
  List<Object?> get props => [
    id,
    title,
    position,
    duration,
    isPlaying,
    playbackSpeed,
    sleepTimerMinutes,
    currentIndex,
    playlist,
  ];
}

class MusicPlayerError extends MusicPlayerState {
  final String message;
  const MusicPlayerError(this.message);
  @override
  List<Object?> get props => [message];
}
