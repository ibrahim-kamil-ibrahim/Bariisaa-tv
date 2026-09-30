import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/author_profile_state.dart';
import '../data/author_profile_repository.dart';
import '../../../shared/models/models.dart';

class AuthorProfileCubit extends Cubit<AuthorProfileState> {
  final AuthorProfileRepository _repository;

  AuthorProfileCubit(this._repository) : super(AuthorProfileInitial());

  void loadAuthor(String authorId) async {
    emit(AuthorProfileLoading());
    try {
      final results = await Future.wait([
        _repository.getAuthor(authorId),
        _repository.getAuthorBooks(authorId),
      ]);
      emit(
        AuthorProfileLoaded(
          author: results[0] as AuthorModel,
          books: (results[1] as List<dynamic>).cast<BookModel>(),
        ),
      );
    } catch (e) {
      emit(AuthorProfileError('Failed to load author: $e'));
    }
  }
}
