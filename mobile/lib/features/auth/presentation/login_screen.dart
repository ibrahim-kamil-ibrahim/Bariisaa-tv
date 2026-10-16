import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/styles.dart';
import '../domain/auth_state.dart';
import 'auth_cubit.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _login() {
    if (!_formKey.currentState!.validate()) return;
    context.read<AuthCubit>().loginUsername(
      username: _identifierController.text.trim(),
      password: _passwordController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          if (context.canPop()) {
            context.pop(true);
          } else {
            context.go(AppRoutes.discovery);
          }
        } else if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message), backgroundColor: Colors.red),
          );
        }
      },
      child: Scaffold(
        backgroundColor: AppTheme.sunnyYellow,
        body: Stack(
          children: [
            Positioned(
              top: -80,
              right: -60,
              child: _blob(200, AppTheme.skyBlueLight, 0.35),
            ),
            Positioned(
              bottom: -100,
              left: -70,
              child: _blob(240, AppTheme.white, 0.30),
            ),
            Positioned(
              top: 180,
              left: -40,
              child: _blob(120, AppTheme.softPurple, 0.25),
            ),
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(24, 32, 24, 28),
                    decoration: BoxDecoration(
                      color: AppTheme.offWhite,
                      borderRadius: BorderRadius.circular(32),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.darkNavy.withValues(alpha: 0.18),
                          blurRadius: 30,
                          offset: const Offset(0, 14),
                        ),
                      ],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: AppTheme.skyBlue,
                                  borderRadius: BorderRadius.circular(18),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppTheme.skyBlue.withValues(
                                        alpha: 0.4,
                                      ),
                                      blurRadius: 12,
                                      offset: const Offset(0, 5),
                                    ),
                                  ],
                                ),
                                child: const Center(
                                  child: Text(
                                    '👋',
                                    style: TextStyle(fontSize: 28),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Welcome Back!',
                                      style: AppStyles.baloo2(
                                        fontSize: 26,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.darkNavy,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Sign in to keep watching',
                                      style: AppStyles.nunito(
                                        fontSize: 14,
                                        color: AppTheme.charcoal,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 28),
                          _buildLabel('Username'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _identifierController,
                            style: AppStyles.nunito(
                              fontSize: 15,
                              color: AppTheme.darkNavy,
                            ),
                            textInputAction: TextInputAction.next,
                            decoration: _inputDecoration(
                              'Enter your username',
                              icon: Icons.person_outline_rounded,
                            ),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) {
                                return 'Required';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 18),
                          _buildLabel('Password'),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _passwordController,
                            style: AppStyles.nunito(
                              fontSize: 15,
                              color: AppTheme.darkNavy,
                            ),
                            obscureText: _obscurePassword,
                            textInputAction: TextInputAction.done,
                            onFieldSubmitted: (_) => _login(),
                            decoration: _inputDecoration(
                              'Enter your password',
                              icon: Icons.lock_outline_rounded,
                            ).copyWith(
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword
                                      ? Icons.visibility_off_rounded
                                      : Icons.visibility_rounded,
                                  color: AppTheme.silver,
                                ),
                                onPressed: () => setState(
                                  () => _obscurePassword = !_obscurePassword,
                                ),
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) return 'Required';
                              return null;
                            },
                          ),
                          const SizedBox(height: 4),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () {},
                              child: Text(
                                'Forgot Password?',
                                style: AppStyles.nunito(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.accentBlue,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          BlocBuilder<AuthCubit, AuthState>(
                            builder: (context, state) {
                              final loading = state is AuthLoginLoading;
                              return SizedBox(
                                width: double.infinity,
                                height: 56,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.sunnyYellow,
                                    foregroundColor: AppTheme.deepNavy,
                                    elevation: 0,
                                    shadowColor: AppTheme.sunnyYellow.withValues(
                                      alpha: 0.5,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(18),
                                    ),
                                  ),
                                  onPressed: loading ? null : _login,
                                  child: loading
                                      ? const SizedBox(
                                          width: 24,
                                          height: 24,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2.5,
                                            color: AppTheme.deepNavy,
                                          ),
                                        )
                                      : Text(
                                          'Login',
                                          style: AppStyles.baloo2(
                                            fontSize: 17,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.deepNavy,
                                          ),
                                        ),
                                ),
                              );
                            },
                          ),
                          const SizedBox(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Don't have an account? ",
                                style: AppStyles.nunito(
                                  fontSize: 14,
                                  color: AppTheme.charcoal,
                                ),
                              ),
                              GestureDetector(
                                onTap: () =>
                                    context.pushReplacement(AppRoutes.signup),
                                child: Text(
                                  'Create Account',
                                  style: AppStyles.nunito(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    color: AppTheme.accentBlue,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Center(
                            child: TextButton(
                              onPressed: () {
                                context.read<AuthCubit>().continueAsGuest();
                                context.go(AppRoutes.discovery);
                              },
                              child: Text(
                                'Skip for now',
                                style: AppStyles.nunito(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.silver,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _blob(double size, Color color, double opacity) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withValues(alpha: opacity),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: AppStyles.nunito(
        fontSize: 13,
        fontWeight: FontWeight.w800,
        color: AppTheme.charcoal,
        letterSpacing: 0.4,
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, {IconData? icon}) {
    return InputDecoration(
      hintText: hint,
      hintStyle: AppStyles.nunito(fontSize: 14, color: AppTheme.silver),
      prefixIcon: icon != null
          ? Icon(icon, color: AppTheme.silver, size: 22)
          : null,
      filled: true,
      fillColor: AppTheme.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppTheme.softGrey),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: BorderSide(color: AppTheme.softGrey),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.skyBlue, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.errorRed),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: AppTheme.errorRed, width: 2),
      ),
      errorStyle: AppStyles.nunito(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        color: AppTheme.errorRed,
      ),
    );
  }
}
