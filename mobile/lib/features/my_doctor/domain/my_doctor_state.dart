import 'package:equatable/equatable.dart';

abstract class MyDoctorState extends Equatable {
  const MyDoctorState();

  @override
  List<Object?> get props => [];
}

class MyDoctorInitial extends MyDoctorState {}

class MyDoctorLoading extends MyDoctorState {}

class MyDoctorLoaded extends MyDoctorState {
  final List<Map<String, dynamic>> healthTips;
  final List<Map<String, dynamic>> doctors;

  const MyDoctorLoaded({required this.healthTips, required this.doctors});

  @override
  List<Object?> get props => [healthTips, doctors];
}

class MyDoctorError extends MyDoctorState {
  final String message;

  const MyDoctorError(this.message);

  @override
  List<Object?> get props => [message];
}
