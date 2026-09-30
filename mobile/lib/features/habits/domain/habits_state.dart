import 'package:equatable/equatable.dart';

abstract class HabitsState extends Equatable {
  const HabitsState();
  @override
  List<Object?> get props => [];
}

class HabitsInitial extends HabitsState {}

class HabitsLoading extends HabitsState {}

class HabitsLoaded extends HabitsState {
  final List<dynamic> habits;
  final List<dynamic>? myStats;
  const HabitsLoaded(this.habits, {this.myStats});
  @override
  List<Object?> get props => [habits, myStats];
}

class HabitsError extends HabitsState {
  final String message;
  const HabitsError(this.message);
  @override
  List<Object?> get props => [message];
}
