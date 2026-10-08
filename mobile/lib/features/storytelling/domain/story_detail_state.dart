import 'package:equatable/equatable.dart';

abstract class StoryDetailState extends Equatable {
  const StoryDetailState();

  @override
  List<Object?> get props => [];
}

class StoryDetailInitial extends StoryDetailState {}

class StoryDetailLoading extends StoryDetailState {}

class StoryDetailLoaded extends StoryDetailState {
  final Map<String, dynamic> story;

  const StoryDetailLoaded(this.story);

  @override
  List<Object?> get props => [story];
}

class StoryDetailError extends StoryDetailState {
  final String message;

  const StoryDetailError(this.message);

  @override
  List<Object?> get props => [message];
}
