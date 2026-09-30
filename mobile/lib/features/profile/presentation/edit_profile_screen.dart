import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:naik_mobile/shared/styles.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../presentation/profile_cubit.dart';
import '../domain/profile_state.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nameController = TextEditingController();
  final _languageController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _initialized = false;
  File? _pendingAvatar;

  @override
  void dispose() {
    _nameController.dispose();
    _languageController.dispose();
    super.dispose();
  }

  void _setInitialValues(ProfileLoaded state) {
    if (_initialized) return;
    _initialized = true;
    _nameController.text = state.user.name;
    _languageController.text = state.user.preferredLanguage;
  }

  void _pickAvatar() {
    context.read<ProfileCubit>().uploadAvatar();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.creamBg,
      appBar: BariisaaAppBar(
        title: 'Edit Profile',
      ),
      body: BlocConsumer<ProfileCubit, ProfileState>(
        listener: (context, state) {
          if (state is ProfileLoaded) {
            _setInitialValues(state);
          }
          if (state is ProfileSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  state.message,
                  style: AppStyles.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.white,
                  ),
                ),
                backgroundColor: AppTheme.freshGreen,
              ),
            );
            Navigator.pop(context);
          }
          if (state is ProfileError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  state.message,
                  style: AppStyles.nunito(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.white,
                  ),
                ),
                backgroundColor: AppTheme.playfulRed,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is ProfileLoaded && _nameController.text.isEmpty) {
            _nameController.text = state.user.name;
          }

          String? avatarUrl;
          if (state is ProfileLoaded) {
            avatarUrl = state.user.avatarUrl;
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 48),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  // Avatar with camera button
                  GestureDetector(
                    onTap: _pickAvatar,
                    child: Stack(
                      children: [
                        CircleAvatar(
                          radius: 60,
                          backgroundColor: AppTheme.sunnyYellow.withValues(
                            alpha: 0.2,
                          ),
                          backgroundImage: _pendingAvatar != null
                              ? FileImage(_pendingAvatar!)
                              : (avatarUrl != null && avatarUrl.isNotEmpty
                                  ? CachedNetworkImageProvider(AppConstants.resolveUrl(avatarUrl))
                                  : null) as ImageProvider?,
                          child: (_pendingAvatar == null &&
                                  (avatarUrl == null || avatarUrl.isEmpty))
                              ? const Text('👤', style: TextStyle(fontSize: 52))
                              : null,
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: AppTheme.deepNavy,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.camera_alt,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tap to change photo',
                    style: AppStyles.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.charcoal.withValues(alpha: 0.5),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Username (read-only)
                  if (state is ProfileLoaded && state.user.username != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                      decoration: AppTheme.cardDecoration(),
                      child: Row(
                        children: [
                          const Padding(
                            padding: EdgeInsets.all(2),
                            child: Text('🏷️', style: TextStyle(fontSize: 18)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Username',
                                  style: AppStyles.nunito(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.charcoal.withValues(
                                      alpha: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  state.user.username!,
                                  style: AppStyles.nunito(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    color: AppTheme.creamText,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  if (state is ProfileLoaded && state.user.username != null)
                    const SizedBox(height: 16),

                  // Name field
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: AppTheme.cardDecoration(),
                    child: TextFormField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        hintText: 'Your name',
                        hintStyle: AppStyles.nunito(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.creamText,
                        ),
                        prefixIcon: const Padding(
                          padding: EdgeInsets.all(14),
                          child: Text('✏️', style: TextStyle(fontSize: 18)),
                        ),
                        border: InputBorder.none,
                      ),
                      style: AppStyles.nunito(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.creamText,
                      ),
                      validator: (v) => v == null || v.trim().isEmpty
                          ? 'Name is required'
                          : null,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Language field
                  if (state is ProfileLoaded)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      decoration: AppTheme.cardDecoration(),
                      child: TextFormField(
                        controller: _languageController,
                        decoration: InputDecoration(
                          hintText: 'Language',
                          hintStyle: AppStyles.nunito(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.creamText,
                          ),
                          prefixIcon: const Padding(
                            padding: EdgeInsets.all(14),
                            child: Text('🌐', style: TextStyle(fontSize: 18)),
                          ),
                          border: InputBorder.none,
                        ),
                        style: AppStyles.nunito(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.creamText,
                        ),
                      ),
                    ),
                  const SizedBox(height: 32),

                  // Save button
                  BigTapButton(
                    onPressed: state is ProfileLoading
                        ? null
                        : () {
                            if (_formKey.currentState?.validate() ?? false) {
                              context.read<ProfileCubit>().updateProfile(
                                name: _nameController.text.trim(),
                                preferredLanguage: _languageController.text
                                    .trim(),
                              );
                            }
                          },
                    child: Text(
                      'Save Changes',
                      style: AppStyles.nunito(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
