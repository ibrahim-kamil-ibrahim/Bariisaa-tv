import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class AuthorProfileState extends Equatable {
  const AuthorProfileState();

  @override
  List<Object?> get props => [];
}

class AuthorProfileInitial extends AuthorProfileState {}

class AuthorProfileLoading extends AuthorProfileState {}

class AuthorProfileLoaded extends AuthorProfileState {
  final AuthorModel author;
  final List<BookModel> books;

  const AuthorProfileLoaded({required this.author, this.books = const []});

  @override
  List<Object?> get props => [author, books];
}

class AuthorProfileError extends AuthorProfileState {
  final String message;

  const AuthorProfileError(this.message);

  @override
  List<Object?> get props => [message];
}
