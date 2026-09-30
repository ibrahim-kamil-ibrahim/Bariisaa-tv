import 'package:equatable/equatable.dart';

abstract class MyCaptainState extends Equatable {
  const MyCaptainState();

  @override
  List<Object?> get props => [];
}

class MyCaptainInitial extends MyCaptainState {}

class MyCaptainLoading extends MyCaptainState {}

class MyCaptainLoaded extends MyCaptainState {
  final List<Map<String, dynamic>> achievements;
  final Map<String, dynamic> profile;
  final List<Map<String, dynamic>> leaderboard;

  const MyCaptainLoaded({
    required this.achievements,
    required this.profile,
    this.leaderboard = const [],
  });

  @override
  List<Object?> get props => [achievements, profile, leaderboard];
}

class MyCaptainError extends MyCaptainState {
  final String message;

  const MyCaptainError(this.message);

  @override
  List<Object?> get props => [message];
}
