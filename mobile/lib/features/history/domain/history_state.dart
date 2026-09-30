import 'package:equatable/equatable.dart';
import '../../../shared/models/models.dart';

abstract class HistoryState extends Equatable {
  const HistoryState();

  @override
  List<Object?> get props => [];
}

class HistoryInitial extends HistoryState {}

class HistoryLoading extends HistoryState {}

class HistoryLoaded extends HistoryState {
  final List<BookModel> readingHistory;
  final List<BookModel> listeningHistory;

  const HistoryLoaded({
    this.readingHistory = const [],
    this.listeningHistory = const [],
  });

  @override
  List<Object?> get props => [readingHistory, listeningHistory];
}

class HistoryError extends HistoryState {
  final String message;

  const HistoryError(this.message);

  @override
  List<Object?> get props => [message];
}
