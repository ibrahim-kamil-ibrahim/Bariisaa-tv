import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/music_state.dart';
import '../data/music_repository.dart';

class MusicCubit extends Cubit<MusicState> {
  final MusicRepository _repository;

  MusicCubit(this._repository) : super(MusicInitial());

  void loadMusic() async {
    emit(MusicLoading());
    try {
      final results = await Future.wait([
        _repository.getMusic(),
        _repository.getMusicGenres(),
      ]);
      emit(MusicLoaded(music: results[0], genres: results[1]));
    } catch (e) {
      emit(MusicError('Failed to load music: $e'));
    }
  }

  void selectGenre(String? genre) {
    final state = this.state;
    if (state is MusicLoaded) {
      emit(state.copyWith(selectedGenre: genre));
    }
  }

  /// Resolve the real playback URL for a track (signed/local), cache it in the
  /// loaded state, and return it so the caller can open the player with it.
  Future<String?> resolvePlayUrl(String trackId) async {
    final url = await _repository.getPlayUrl(trackId);
    return url;
  }
}
