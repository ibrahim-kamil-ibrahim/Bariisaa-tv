import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:just_audio/just_audio.dart';
import 'music_player_state.dart';
import '../data/music_repository.dart';
import '../../../core/constants/app_constants.dart';

class MusicPlayerCubit extends Cubit<MusicPlayerState> {
  final MusicRepository _repository;
  final AudioPlayer _player = AudioPlayer();
  Timer? _sleepTimer;
  StreamSubscription? _positionSub;
  StreamSubscription? _durationSub;
  StreamSubscription? _playerStateSub;
  bool _closed = false;

  MusicPlayerCubit(this._repository) : super(MusicPlayerInitial()) {
    _positionSub = _player.positionStream.listen((position) {
      if (_closed) return;
      if (state is MusicPlayerLoaded) {
        final loaded = state as MusicPlayerLoaded;
        emit(loaded.copyWith(position: position, isPlaying: _player.playing));
      }
    });
    _durationSub = _player.durationStream.listen((duration) {
      if (_closed) return;
      if (state is MusicPlayerLoaded && duration != null) {
        emit((state as MusicPlayerLoaded).copyWith(duration: duration));
      }
    });
    _playerStateSub = _player.playerStateStream.listen((playerState) {
      if (_closed) return;
      if (state is MusicPlayerLoaded) {
        emit(
          (state as MusicPlayerLoaded).copyWith(isPlaying: playerState.playing),
        );
      }
      // Auto-advance to next track
      if (playerState.processingState == ProcessingState.completed) {
        next();
      }
    });
  }

  AudioPlayer get player => _player;

  Future<void> loadTrack(
    Map<String, dynamic> track, {
    List<Map<String, dynamic>> playlist = const [],
    int index = 0,
  }) async {
    if (isClosed) return;
    emit(MusicPlayerLoading());
    try {
      final id = track['id'] as String? ?? '';
      final audioUrl = track['audioUrl'] as String? ?? '';
      final resolvedUrl = await _repository.getPlayUrl(id);

      if (isClosed) return;
      final loaded = MusicPlayerLoaded(
        id: id,
        title: track['title'] as String? ?? 'Untitled',
        artist: track['artist'] as String?,
        coverUrl: track['coverUrl'] as String?,
        audioUrl: resolvedUrl ?? audioUrl,
        pdfUrl: track['pdfUrl'] as String?,
        price: (track['price'] as num?)?.toDouble() ?? 0,
        playlist: playlist,
        currentIndex: index,
      );
      emit(loaded);

      if (loaded.audioUrl != null && loaded.audioUrl!.isNotEmpty) {
        await _player.setUrl(AppConstants.resolveUrl(loaded.audioUrl!));
        _player.play();
      }
    } catch (e) {
      if (isClosed) return;
      emit(MusicPlayerError('Failed to load track: $e'));
    }
  }

  void togglePlayPause() {
    if (state is! MusicPlayerLoaded) return;
    if (_player.playing) {
      _player.pause();
    } else {
      _player.play();
    }
  }

  void seek(Duration position) {
    _player.seek(position);
  }

  void skipForward() {
    if (state is! MusicPlayerLoaded) return;
    final current = state as MusicPlayerLoaded;
    final newPos = current.position + const Duration(seconds: 30);
    _player.seek(newPos > current.duration ? current.duration : newPos);
  }

  void skipBackward() {
    if (state is! MusicPlayerLoaded) return;
    final current = state as MusicPlayerLoaded;
    final newPos = current.position - const Duration(seconds: 10);
    _player.seek(newPos < Duration.zero ? Duration.zero : newPos);
  }

  Future<void> next() async {
    if (state is! MusicPlayerLoaded) return;
    final current = state as MusicPlayerLoaded;
    if (current.playlist.isEmpty) return;
    final nextIndex = (current.currentIndex + 1) % current.playlist.length;
    await loadTrack(
      current.playlist[nextIndex],
      playlist: current.playlist,
      index: nextIndex,
    );
  }

  Future<void> previous() async {
    if (state is! MusicPlayerLoaded) return;
    final current = state as MusicPlayerLoaded;
    if (current.playlist.isEmpty) return;
    final prevIndex =
        (current.currentIndex - 1 + current.playlist.length) %
        current.playlist.length;
    await loadTrack(
      current.playlist[prevIndex],
      playlist: current.playlist,
      index: prevIndex,
    );
  }

  void setPlaybackSpeed(double speed) {
    _player.setSpeed(speed);
    if (state is MusicPlayerLoaded) {
      emit((state as MusicPlayerLoaded).copyWith(playbackSpeed: speed));
    }
  }

  void startSleepTimer(int minutes) {
    _sleepTimer?.cancel();
    _sleepTimer = Timer(Duration(minutes: minutes), () {
      _player.pause();
    });
    if (state is MusicPlayerLoaded) {
      emit((state as MusicPlayerLoaded).copyWith(sleepTimerMinutes: minutes));
    }
  }

  void cancelSleepTimer() {
    _sleepTimer?.cancel();
    _sleepTimer = null;
    if (state is MusicPlayerLoaded) {
      emit((state as MusicPlayerLoaded).copyWith(sleepTimerMinutes: null));
    }
  }

  @override
  Future<void> close() {
    _closed = true;
    _sleepTimer?.cancel();
    _positionSub?.cancel();
    _durationSub?.cancel();
    _playerStateSub?.cancel();
    _player.dispose();
    return super.close();
  }
}
