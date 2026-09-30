import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/navigation/app_router.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/audio_player_cubit.dart';
import '../domain/audio_player_state.dart';

class MiniPlayerWidget extends StatelessWidget {
  const MiniPlayerWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AudioPlayerCubit, AudioPlayerState>(
      builder: (context, state) {
        if (state is! AudioPlayerLoaded) return const SizedBox.shrink();
        final book = state.book;
        return KidsMiniPlayer(
          title: book.title,
          coverUrl: book.coverUrl,
          isPlaying: state.isPlaying,
          onTap: () => context.push(AppRoutes.audioPlayer, extra: book),
          onPlayPause: () => context.read<AudioPlayerCubit>().togglePlayPause(),
        );
      },
    );
  }
}
