import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/storytelling_state.dart';
import '../data/storytelling_repository.dart';

class StorytellingCubit extends Cubit<StorytellingState> {
  final StorytellingRepository _repository;

  StorytellingCubit(this._repository) : super(StorytellingInitial());

  void loadStories() async {
    emit(StorytellingLoading());
    try {
      final results = await Future.wait<dynamic>([
        _repository.getStories(),
        _repository.getStoryCategories(),
      ]);
      if (isClosed) return;
      emit(StorytellingLoaded(stories: (results[0] as List).cast<Map<String, dynamic>>(), categories: (results[1] as List).cast<Map<String, dynamic>>()));
    } catch (e) {
      if (isClosed) return;
      emit(StorytellingError('Failed to load stories: $e'));
    }
  }
}
