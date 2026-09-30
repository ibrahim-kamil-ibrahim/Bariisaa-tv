import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:just_audio/just_audio.dart';
import '../domain/audio_player_state.dart';
import '../data/audio_player_repository.dart';
import '../../../shared/models/models.dart';
import '../../../core/constants/app_constants.dart';

class AudioPlayerCubit extends Cubit<AudioPlayerState> {
  final AudioPlayerRepository _repository;
  final AudioPlayer _player = AudioPlayer();
  Timer? _sleepTimer;
  Timer? _progressTimer;
  StreamSubscription? _positionSub;
  StreamSubscription? _durationSub;
  StreamSubscription? _playerStateSub;
  bool _closed = false;

  AudioPlayerCubit(this._repository) : super(AudioPlayerInitial()) {
    _positionSub = _player.positionStream.listen((position) {
      if (_closed) return;
      if (state is AudioPlayerLoaded) {
        final loaded = state as AudioPlayerLoaded;
        emit(loaded.copyWith(position: position, isPlaying: _player.playing));
      }
    });
    _durationSub = _player.durationStream.listen((duration) {
      if (_closed) return;
      if (state is AudioPlayerLoaded && duration != null) {
        emit((state as AudioPlayerLoaded).copyWith(duration: duration));
      }
    });
    _playerStateSub = _player.playerStateStream.listen((playerState) {
      if (_closed) return;
      if (state is AudioPlayerLoaded) {
        emit(
          (state as AudioPlayerLoaded).copyWith(isPlaying: playerState.playing),
        );
      }
    });
  }

  AudioPlayer get player => _player;

  Future<void> loadBook(BookModel book) async {
    if (isClosed) return;
    emit(AudioPlayerLoading());
    try {
      final audioUrl = book.audioFile?.fileUrl;
      if (audioUrl == null || audioUrl.isEmpty) {
        if (isClosed) return;
        emit(const AudioPlayerError('No audio file available'));
        return;
      }
      await _player.setAudioSource(
        AudioSource.uri(Uri.parse(_normalizeUrl(audioUrl))),
      );
      if (isClosed) return;
      // Bookmarks are non-fatal — an offline/guest user can still listen.
      List<BookmarkModel> bookmarks = [];
      try {
        bookmarks = await _repository.getBookmarks(book.id);
      } catch (_) {
        // Bookmarks are non-fatal
      }
      if (isClosed) return;
      emit(AudioPlayerLoaded(book: book, bookmarks: bookmarks));
      _startProgressSync(book.id);
    } catch (e) {
      if (isClosed) return;
      emit(AudioPlayerError('Failed to load audio: $e'));
    }
  }

  /// Android emulator cannot reach `localhost` (it is the emulator itself);
  /// rewrite it to the host-machine alias 10.0.2.2.
  String _normalizeUrl(String url) {
    if (!kIsWeb &&
        !kReleaseMode &&
        (defaultTargetPlatform == TargetPlatform.android ||
         defaultTargetPlatform == TargetPlatform.iOS)) {
      return url.replaceFirst('://localhost:', '://10.0.2.2:');
    }
    return url;
  }

  void play() {
    if (isClosed) return;
    _player.play();
  }

  void pause() {
    if (isClosed) return;
    _player.pause();
  }

  void togglePlayPause() {
    if (isClosed) return;
    if (_player.playing) {
      _player.pause();
    } else {
      _player.play();
    }
  }

  void seek(Duration position) {
    if (isClosed) return;
    _player.seek(position);
  }

  void skipForward() {
    if (isClosed) return;
    final current = _player.position;
    seek(
      Duration(
        seconds: current.inSeconds + AppConstants.audioSkipForward.toInt(),
      ),
    );
  }

  void skipBackward() {
    if (isClosed) return;
    final current = _player.position;
    seek(
      Duration(
        seconds: (current.inSeconds - AppConstants.audioSkipBackward.toInt())
            .clamp(0, current.inSeconds),
      ),
    );
  }

  void setPlaybackSpeed(double speed) {
    if (isClosed) return;
    _player.setSpeed(speed);
    if (state is AudioPlayerLoaded) {
      emit((state as AudioPlayerLoaded).copyWith(playbackSpeed: speed));
    }
  }

  void setSleepTimer(int minutes) {
    if (isClosed) return;
    _sleepTimer?.cancel();
    _sleepTimer = Timer(Duration(minutes: minutes), () {
      if (isClosed) return; // ✅ Guard in timer callback
      _player.pause();
      if (state is AudioPlayerLoaded) {
        emit(
          (state as AudioPlayerLoaded).copyWith(
            sleepTimerMinutes: null,
            isPlaying: false,
          ),
        );
      }
    });
    if (state is AudioPlayerLoaded) {
      emit((state as AudioPlayerLoaded).copyWith(sleepTimerMinutes: minutes));
    }
  }

  void cancelSleepTimer() {
    if (isClosed) return;
    _sleepTimer?.cancel();
    if (state is AudioPlayerLoaded) {
      emit((state as AudioPlayerLoaded).copyWith(clearSleepTimer: true));
    }
  }

  void seekToChapter(int index) {
    if (isClosed) return;
    if (state is AudioPlayerLoaded) {
      final loaded = state as AudioPlayerLoaded;
      final chapters = loaded.book.audioFile?.chapters ?? [];
      if (index >= 0 && index < chapters.length) {
        final chapter = chapters[index];
        seek(Duration(seconds: chapter.startSeconds));
        emit(loaded.copyWith(currentChapterIndex: index));
      } else if (chapters.isEmpty || index <= 0) {
        seek(Duration.zero);
      }
    }
  }

  Future<void> addBookmark({String? label}) async {
    if (isClosed) return;
    if (state is AudioPlayerLoaded) {
      final loaded = state as AudioPlayerLoaded;
      try {
        await _repository.addBookmark(
          bookId: loaded.book.id,
          type: 'AUDIO',
          label: label,
          timestampSeconds: _player.position.inSeconds,
        );
        if (isClosed) return;
        final bookmarks = await _repository.getBookmarks(loaded.book.id);
        if (isClosed) return;
        emit(loaded.copyWith(bookmarks: bookmarks));
      } catch (e) {
        if (kDebugMode) debugPrint('addBookmark failed: $e');
      }
    }
  }

  Future<void> deleteBookmark(String bookmarkId) async {
    if (isClosed) return;
    if (state is AudioPlayerLoaded) {
      try {
        await _repository.deleteBookmark(bookmarkId);
        if (isClosed) return;
        final bookmarks = await _repository.getBookmarks(
          (state as AudioPlayerLoaded).book.id,
        );
        if (isClosed) return;
        emit((state as AudioPlayerLoaded).copyWith(bookmarks: bookmarks));
      } catch (e) {
        if (kDebugMode) debugPrint('deleteBookmark failed: $e');
      }
    }
  }

  void _startProgressSync(String bookId) {
    _progressTimer?.cancel();
    _progressTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (isClosed) return;
      if (state is! AudioPlayerLoaded) return;
      final loaded = state as AudioPlayerLoaded;
      if (!loaded.isPlaying) return;
      _repository.saveProgress(
        bookId: bookId,
        positionSeconds: _player.position.inSeconds,
      );
    });
  }

  @override
  Future<void> close() {
    _closed = true;
    _positionSub?.cancel();
    _durationSub?.cancel();
    _playerStateSub?.cancel();
    _player.dispose();
    _sleepTimer?.cancel();
    _progressTimer?.cancel();
    return super.close();
  }
}
