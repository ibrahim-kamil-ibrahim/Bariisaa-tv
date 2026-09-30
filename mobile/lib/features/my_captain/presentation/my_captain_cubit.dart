import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/my_captain_state.dart';
import '../data/my_captain_repository.dart';

class MyCaptainCubit extends Cubit<MyCaptainState> {
  final MyCaptainRepository _repository;

  MyCaptainCubit(this._repository) : super(MyCaptainInitial());

  void loadCaptainData() async {
    emit(MyCaptainLoading());
    try {
      final profile = await _repository.getCaptainProfile();
      final achievements = await _repository.getAchievements();
      final leaderboard = await _repository.getLeaderboard();
      emit(
        MyCaptainLoaded(
          achievements: achievements,
          profile: profile,
          leaderboard: leaderboard,
        ),
      );
    } catch (e) {
      emit(MyCaptainError('Hmm, something went wrong. Let\'s try again!'));
    }
  }
}
