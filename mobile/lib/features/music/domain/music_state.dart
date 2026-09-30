import 'package:equatable/equatable.dart';

abstract class MusicState extends Equatable {
  const MusicState();

  @override
  List<Object?> get props => [];
}

class MusicInitial extends MusicState {}

class MusicLoading extends MusicState {}

class MusicLoaded extends MusicState {
  final List<Map<String, dynamic>> music;
  final List<Map<String, dynamic>> genres;
  final String? selectedGenre;

  const MusicLoaded({
    required this.music,
    required this.genres,
    this.selectedGenre,
  });

  List<Map<String, dynamic>> get featured =>
      music.where((t) => t['isFeatured'] == true).toList();

  List<Map<String, dynamic>> get filteredMusic {
    if (selectedGenre == null) return music;
    return music.where((t) => t['genre'] == selectedGenre).toList();
  }

  MusicLoaded copyWith({String? selectedGenre}) {
    return MusicLoaded(
      music: music,
      genres: genres,
      selectedGenre: selectedGenre,
    );
  }

  @override
  List<Object?> get props => [music, genres, selectedGenre];
}

class MusicError extends MusicState {
  final String message;

  const MusicError(this.message);

  @override
  List<Object?> get props => [message];
}
