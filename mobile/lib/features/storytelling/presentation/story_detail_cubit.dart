import 'package:dio/dio.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/story_detail_state.dart';
import '../data/storytelling_repository.dart';

/// Loads one story for the story detail screen.
///
/// Kept separate from [StorytellingCubit] (the shared list singleton) so the
/// screen owns its own instance and disposing it never disturbs the list.
class StoryDetailCubit extends Cubit<StoryDetailState> {
  final StorytellingRepository _repository;

  StoryDetailCubit(this._repository) : super(StoryDetailInitial());

  Future<void> loadStory(String storyId) async {
    emit(StoryDetailLoading());
    try {
      final story = await _repository.getStory(storyId);
      if (isClosed) return;
      emit(StoryDetailLoaded(story));
    } on DioException catch (e) {
      if (isClosed) return;
      emit(StoryDetailError(_messageOf(e)));
    } catch (e) {
      if (isClosed) return;
      emit(StoryDetailError('Failed to load story: $e'));
    }
  }

  String _messageOf(DioException e) {
    final data = e.response?.data;
    if (data is Map && data['message'] is String) {
      return data['message'] as String;
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      return 'No internet connection';
    }
    return 'Failed to load story';
  }
}
