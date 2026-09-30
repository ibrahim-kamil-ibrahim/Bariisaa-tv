import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/my_doctor_state.dart';
import '../data/my_doctor_repository.dart';

class MyDoctorCubit extends Cubit<MyDoctorState> {
  final MyDoctorRepository _repository;

  MyDoctorCubit(this._repository) : super(MyDoctorInitial());

  void loadHealthData() async {
    emit(MyDoctorLoading());
    try {
      final healthTips = await _repository.getHealthTips();
      final doctors = await _repository.getDoctors();
      emit(MyDoctorLoaded(healthTips: healthTips, doctors: doctors));
    } catch (e) {
      emit(MyDoctorError('Hmm, something went wrong. Let\'s try again!'));
    }
  }
}
