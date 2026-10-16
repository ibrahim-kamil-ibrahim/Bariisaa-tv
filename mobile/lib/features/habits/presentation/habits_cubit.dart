import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/habits_state.dart';
import '../data/habits_repository.dart';

class HabitsCubit extends Cubit<HabitsState> {
  final HabitsRepository _repository;

  HabitsCubit(this._repository) : super(HabitsInitial());

  Future<void> loadHabits() async {
    emit(HabitsLoading());
    try {
      final habits = await _repository.fetchHabits();
      if (isClosed) return;
      emit(HabitsLoaded(habits));
    } catch (e) {
      if (isClosed) return;
      emit(HabitsError('Failed to load habits: $e'));
    }
  }

  Future<void> loadMyStats() async {
    emit(HabitsLoading());
    try {
      final habits = await _repository.fetchHabits();
      List<dynamic>? stats;
      try {
        final res = await _repository.fetchMyStats();
        stats = res['userHabits'] as List<dynamic>?;
      } catch (_) {
        // Guests have no personal stats; still show the habits list.
      }
      if (isClosed) return;
      emit(HabitsLoaded(habits, myStats: stats));
    } catch (e) {
      if (isClosed) return;
      emit(HabitsError('Failed to load stats: $e'));
    }
  }

  Future<void> completeHabit(String id) async {
    try {
      await _repository.completeHabit(id);
      if (isClosed) return;
      await loadMyStats();
    } catch (e) {
      if (isClosed) return;
      emit(HabitsError('Failed to complete habit: $e'));
    }
  }
}
