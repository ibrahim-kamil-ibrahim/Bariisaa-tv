import 'package:flutter_bloc/flutter_bloc.dart';
import 'screen_theme_repository.dart';

/// Holds the active screen themes keyed by `screenKey`.
/// Screens read via `context.watch<ScreenThemeCubit>().themeFor('home')`.
class ScreenThemeCubit extends Cubit<Map<String, ScreenThemeModel>> {
  final ScreenThemeRepository _repository;

  ScreenThemeCubit(this._repository) : super(const {});

  Future<void> load() async {
    try {
      final themes = await _repository.fetchThemes();
      emit({for (final t in themes) t.screenKey: t});
    } catch (_) {
      // Leave state empty — screens fall back to bundled assets.
      // No logging needed here as this is expected for first-run or offline.
    }
  }

  ScreenThemeModel? themeFor(String screenKey) => state[screenKey];
}
