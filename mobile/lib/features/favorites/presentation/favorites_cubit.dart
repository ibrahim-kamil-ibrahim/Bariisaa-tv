import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/favorites_state.dart';
import '../data/favorites_repository.dart';

class FavoritesCubit extends Cubit<FavoritesState> {
  final FavoritesRepository _repository;

  FavoritesCubit(this._repository) : super(FavoritesInitial());

  void loadFavorites() async {
    emit(FavoritesLoading());
    try {
      final books = await _repository.getFavorites();
      if (isClosed) return;
      emit(FavoritesLoaded(books));
    } catch (e) {
      if (isClosed) return;
      emit(FavoritesError('Failed to load favorites: $e'));
    }
  }

  void removeFavorite(String bookId) async {
    try {
      await _repository.removeFavorite(bookId);
      if (isClosed) return;
      loadFavorites();
    } catch (e) {
      if (isClosed) return;
      emit(FavoritesError('Failed to remove: $e'));
    }
  }
}
