import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/profile_cubit.dart';
import '../domain/profile_state.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  @override
  void initState() {
    super.initState();
    context.read<ProfileCubit>().loadDevices();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Devices',
      ),
      body: BlocBuilder<ProfileCubit, ProfileState>(
        builder: (context, state) {
          if (state is ProfileLoading) {
            return const LoadingMascot(message: 'Loading devices...');
          }
          if (state is ProfileDevicesLoaded) {
            if (state.devices.isEmpty) {
              return FunEmptyState(
                emoji: '📱',
                title: 'No devices yet',
                subtitle: 'Your devices will appear here',
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.devices.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final device = state.devices[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: AppTheme.cardDecoration(),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.skyBlue.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          device.platform == 'android' ? '🤖' : '🍎',
                          style: const TextStyle(fontSize: 24),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              device.deviceName,
                              style: AppStyles.nunito(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.creamText,
                              ),
                            ),
                            Text(
                              'Last active: ${_formatDate(device.lastActiveAt)}',
                              style: AppStyles.nunito(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.creamText,
                              ),
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => _confirmRemove(context, device.id),
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.playfulRed.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            '🗑️',
                            style: TextStyle(fontSize: 18),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          }
          if (state is ProfileError) {
            return FunErrorState(
              message: state.message,
              onRetry: () => context.read<ProfileCubit>().loadDevices(),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  void _confirmRemove(BuildContext context, String deviceId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(
          'Remove Device?',
          style: AppStyles.baloo2(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: AppTheme.creamText,
          ),
        ),
        content: Text(
          'This device will be logged out.',
          style: AppStyles.nunito(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppTheme.creamText,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: AppStyles.nunito(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.creamText,
              ),
            ),
          ),
          GestureDetector(
            onTap: () {
              Navigator.pop(ctx);
              context.read<ProfileCubit>().removeDevice(deviceId);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: AppTheme.playfulRed,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Text(
                'Remove',
                style: AppStyles.nunito(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
