import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../../../shared/widgets/app_background.dart';
import '../presentation/my_doctor_cubit.dart';
import '../domain/my_doctor_state.dart';

class MyDoctorScreen extends StatefulWidget {
  const MyDoctorScreen({super.key});

  @override
  State<MyDoctorScreen> createState() => _MyDoctorScreenState();
}

class _MyDoctorScreenState extends State<MyDoctorScreen> {
  @override
  void initState() {
    super.initState();
    context.read<MyDoctorCubit>().loadHealthData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'My Doctor',
      ),
      body: BlocBuilder<MyDoctorCubit, MyDoctorState>(
          builder: (context, state) {
            if (state is MyDoctorLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is MyDoctorError) {
              return FunErrorState(
                message: state.message,
                onRetry: () => context.read<MyDoctorCubit>().loadHealthData(),
              );
            }
            if (state is MyDoctorLoaded) {
              if (state.healthTips.isEmpty && state.doctors.isEmpty) {
                return FunEmptyState(
                  emoji: '🩺',
                  title: 'No Health Content',
                  subtitle:
                      'Health tips and doctor profiles will appear here once added.',
                );
              }
              return _buildContent(state);
            }
            return const Center(child: CircularProgressIndicator());
          },
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: -1),
    );
  }

  Widget _buildContent(MyDoctorLoaded state) {
    return RefreshIndicator(
      onRefresh: () async => context.read<MyDoctorCubit>().loadHealthData(),
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildQuickActions(),
            const SizedBox(height: 24),
            if (state.healthTips.isNotEmpty) ...[
              const BadgedSectionHeader(emoji: '🔥', title: 'Top Tips'),
              ...state.healthTips.map((tip) {
                final title = tip['title'] as String? ?? 'Health Tip';
                final emoji =
                    (tip['emoji'] as String?) ?? _defaultTipEmoji(title);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: _buildTipCard(title, emoji),
                );
              }),
              const SizedBox(height: 24),
            ],
            if (state.doctors.isNotEmpty) ...[
              const BadgedSectionHeader(emoji: '✨', title: 'Doctors'),
              SizedBox(
                height: 160,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: state.doctors.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 12),
                  itemBuilder: (context, index) =>
                      _buildDoctorCard(state.doctors[index], index),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTipCard(String title, String emoji) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 24)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: AppStyles.nunito(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.creamText,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDoctorCard(Map<String, dynamic> doctor, int index) {
    final name = doctor['name'] as String? ?? 'Doctor';
    final specialty = doctor['specialty'] as String?;
    final photoUrl = doctor['photoUrl'] as String?;
    final available = doctor['available'] as bool? ?? true;
    return Container(
      width: 130,
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.gridCardDecoration(AppTheme.mintGreen),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (photoUrl != null && photoUrl.isNotEmpty)
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.network(
                photoUrl,
                width: 48,
                height: 48,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Text(
                  _doctorEmoji(index),
                  style: const TextStyle(fontSize: 32),
                ),
              ),
            )
          else
            Text(_doctorEmoji(index), style: const TextStyle(fontSize: 32)),
          const SizedBox(height: 8),
          Text(
            name,
            style: AppStyles.nunito(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: AppTheme.creamText,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (specialty != null) ...[
            const SizedBox(height: 2),
            Text(
              specialty,
              style: AppStyles.nunito(
                fontSize: 10,
                fontWeight: FontWeight.w500,
                color: AppTheme.softWhite,
              ),
            ),
          ],
          if (!available)
            Container(
              margin: const EdgeInsets.only(top: 4),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.cardPurple,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'Offline',
                style: AppStyles.nunito(
                  fontSize: 8,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.softWhite,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      {'emoji': '📅', 'label': 'Appointment'},
      {'emoji': '💊', 'label': 'Medicine'},
      {'emoji': 'ℹ️', 'label': 'Health Info'},
      {'emoji': '🚨', 'label': 'Emergency'},
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: actions.map((a) {
        return Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: AppTheme.gridCardDecoration(AppTheme.mintGreen),
              child: Text(a['emoji']!, style: const TextStyle(fontSize: 28)),
            ),
            const SizedBox(height: 6),
            Text(
              a['label']!,
              style: AppStyles.nunito(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppTheme.darkNavy,
              ),
            ),
          ],
        );
      }).toList(),
    );
  }

  String _defaultTipEmoji(String title) {
    final lower = title.toLowerCase();
    if (lower.contains('water') || lower.contains('drink')) return '💧';
    if (lower.contains('sleep')) return '😴';
    if (lower.contains('active') || lower.contains('exercise')) return '🏃';
    if (lower.contains('eat') ||
        lower.contains('food') ||
        lower.contains('diet'))
      return '🥗';
    if (lower.contains('hand') || lower.contains('wash')) return '🧼';
    return '💡';
  }

  String _doctorEmoji(int index) {
    const emojis = ['👩‍⚕️', '🦷', '👁️', '💉', '🩺', '🧑‍⚕️'];
    return emojis[index % emojis.length];
  }
}
