import 'package:equatable/equatable.dart';

abstract class StorytellingState extends Equatable {
  const StorytellingState();

  @override
  List<Object?> get props => [];
}

class StorytellingInitial extends StorytellingState {}

class StorytellingLoading extends StorytellingState {}

class StorytellingLoaded extends StorytellingState {
  final List<Map<String, dynamic>> stories;
  final List<Map<String, dynamic>> categories;

  const StorytellingLoaded({required this.stories, required this.categories});

  @override
  List<Object?> get props => [stories, categories];
}

class StorytellingError extends StorytellingState {
  final String message;

  const StorytellingError(this.message);

  @override
  List<Object?> get props => [message];
}
