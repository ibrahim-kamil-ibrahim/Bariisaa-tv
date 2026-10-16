import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../shared/styles.dart';
import '../../../shared/widgets/shared_widgets.dart';
import '../domain/auth_state.dart';
import 'auth_cubit.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  int _step = 0;
  final _pageController = PageController();

  // Step 1: Name
  final _nameController = TextEditingController();
  // Step 5: Username + Password
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  // Step 2: Age
  final _ageController = TextEditingController();

  late final FixedExtentScrollController _ageScrollController;

  String? _selectedGender;
  String? _selectedAvatar;
  bool _obscurePassword = true;

  static const _avatarEmojis = [
    '🦁',
    '🐯',
    '🐻',
    '🦊',
    '🐸',
    '🐵',
    '🐶',
    '🐱',
    '🐼',
  ];

  @override
  void initState() {
    super.initState();
    _ageController.text = '11';
    _ageScrollController = FixedExtentScrollController(initialItem: 8);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _passwordController.dispose();
    _ageController.dispose();
    _ageScrollController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _nextStep() {
    if (_step < 4) {
      setState(() => _step++);
      _pageController.animateToPage(
        _step,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _prevStep() {
    if (_step > 0) {
      setState(() => _step--);
      _pageController.animateToPage(
        _step,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  bool _validateCurrentStep() {
    switch (_step) {
      case 0:
        if (_nameController.text.trim().length < 2) {
          _showError('Please enter your name');
          return false;
        }
        return true;
      case 1:
        final age = int.tryParse(_ageController.text);
        if (age == null || age < 3 || age > 17) {
          _showError('Please select a valid age (3-17)');
          return false;
        }
        return true;
      case 2:
        if (_selectedGender == null) {
          _showError('Please select your gender');
          return false;
        }
        return true;
      case 3:
        if (_selectedAvatar == null) {
          _showError('Please choose an avatar');
          return false;
        }
        return true;
      case 4:
        return _validateAccountStep();
      default:
        return true;
    }
  }

  bool _validateAccountStep() {
    final username = _usernameController.text.trim();
    if (username.length < 3) {
      _showError('Username must be at least 3 characters');
      return false;
    }
    if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(username)) {
      _showError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    if (_passwordController.text.length < 8) {
      _showError('Password must be at least 8 characters');
      return false;
    }
    return true;
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  }

  void _submit() {
    if (!_validateCurrentStep()) return;
    final name = _nameController.text.trim();
    final age = int.tryParse(_ageController.text);
    context.read<AuthCubit>().signupUsername(
      name: name,
      username: _usernameController.text.trim(),
      password: _passwordController.text,
      age: age,
      gender: _selectedGender,
      avatar: _selectedAvatar,
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state is AuthAuthenticated) {
          context.go(AppRoutes.discovery);
        } else if (state is AuthError) {
          _showError(state.message);
        }
      },
      child: Scaffold(
        backgroundColor: AppTheme.sunnyYellow,
        body: Stack(
          children: [
            Positioned(
              top: -80,
              left: -60,
              child: _blob(200, AppTheme.skyBlueLight, 0.35),
            ),
            Positioned(
              bottom: -100,
              right: -70,
              child: _blob(240, AppTheme.white, 0.30),
            ),
            SafeArea(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 10,
                    ),
                    child: Row(
                      children: [
                        IconButton(
                          style: IconButton.styleFrom(
                            backgroundColor: AppTheme.white,
                            foregroundColor: AppTheme.darkNavy,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          onPressed: _step > 0 ? _prevStep : () => context.pop(),
                          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Step ${_step + 1} of 5',
                                style: AppStyles.nunito(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.darkNavy.withValues(
                                    alpha: 0.7,
                                  ),
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 6),
                              _buildProgressIndicator(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: PageView(
                      controller: _pageController,
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        _buildStep1Name(),
                        _buildStep2Age(),
                        _buildStep3Gender(),
                        _buildStep4Avatar(),
                        _buildStep5Account(),
                      ],
                    ),
                  ),
                ],
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

  Widget _buildProgressIndicator() {
    return Row(
      children: List.generate(5, (i) {
        final isActive = i <= _step;
        return Expanded(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            height: 6,
            decoration: BoxDecoration(
              color: isActive ? AppTheme.deepNavy : AppTheme.white,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
        );
      }),
    );
  }

  static const _stepMascots = [
    MascotBubble(emoji: '👋', size: 90, label: 'Hi friend!'),
    MascotBubble(emoji: '🎂', size: 90, label: 'Pick your age!'),
    MascotBubble(emoji: '🌈', size: 90, label: 'You do you!'),
    MascotBubble(emoji: '🦸', size: 90, label: 'Pick your hero!'),
    MascotBubble(emoji: '🔐', size: 70, label: 'Grown-up step'),
  ];

  /// Shared white card shell for every signup step.
  Widget _stepCard({required Widget child}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: AppTheme.offWhite,
          borderRadius: BorderRadius.circular(32),
          boxShadow: [
            BoxShadow(
              color: AppTheme.darkNavy.withValues(alpha: 0.15),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
        child: child,
      ),
    );
  }

  // ── Step 1: Full Name ────────────────────────────────────────────────────────

  Widget _buildStep1Name() {
    return _stepCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stepMascots[0],
          const SizedBox(height: 8),
          Text(
            "What's your name?",
            style: AppStyles.baloo2(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            "Let's get to know you!",
            style: AppStyles.nunito(fontSize: 15, color: AppTheme.charcoal),
          ),
          const SizedBox(height: 24),
          _buildLabel('Full Name'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _nameController,
            style: AppStyles.nunito(fontSize: 16, color: AppTheme.darkNavy),
            textCapitalization: TextCapitalization.words,
            textInputAction: TextInputAction.next,
            decoration: _inputDecoration(
              'Enter your full name',
              icon: Icons.face_outlined,
            ),
            autofocus: true,
          ),
          const Spacer(),
          _buildContinueButton(() {
            if (_validateCurrentStep()) _nextStep();
          }),
        ],
      ),
    );
  }

  // ── Step 2: Age ──────────────────────────────────────────────────────────────

  Widget _buildStep2Age() {
    return _stepCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stepMascots[1],
          const SizedBox(height: 8),
          Text(
            'How old are you?',
            style: AppStyles.baloo2(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Pick your age from the wheel',
            style: AppStyles.nunito(fontSize: 15, color: AppTheme.charcoal),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: AppTheme.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppTheme.softGrey),
              ),
              child: ListWheelScrollView.useDelegate(
                controller: _ageScrollController,
                itemExtent: 56,
                physics: const FixedExtentScrollPhysics(),
                diameterRatio: 1.6,
                useMagnifier: true,
                magnification: 1.15,
                onSelectedItemChanged: (i) {
                  _ageController.text = '${i + 3}';
                },
                childDelegate: ListWheelChildBuilderDelegate(
                  childCount: 15,
                  builder: (context, i) {
                    final age = i + 3;
                    return Center(
                      child: Text(
                        '$age',
                        style: AppStyles.baloo2(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.darkNavy,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          _buildContinueButton(() {
            if (_validateCurrentStep()) _nextStep();
          }),
        ],
      ),
    );
  }

  // ── Step 3: Gender ───────────────────────────────────────────────────────────

  Widget _buildStep3Gender() {
    return _stepCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stepMascots[2],
          const SizedBox(height: 8),
          Text(
            "What's your gender?",
            style: AppStyles.baloo2(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: _buildGenderCard('Boy', '👦', 'BOY')),
              const SizedBox(width: 12),
              Expanded(child: _buildGenderCard('Girl', '👧', 'GIRL')),
              const SizedBox(width: 12),
              Expanded(child: _buildGenderCard('Other', '🦋', 'OTHER')),
            ],
          ),
          const Spacer(),
          _buildContinueButton(() {
            if (_validateCurrentStep()) _nextStep();
          }),
        ],
      ),
    );
  }

  Widget _buildGenderCard(String label, String emoji, String value) {
    final selected = _selectedGender == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedGender = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(vertical: 26),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.sunnyYellow.withValues(alpha: 0.25)
              : AppTheme.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: selected ? AppTheme.sunnyYellow : AppTheme.softGrey,
            width: selected ? 2.5 : 1,
          ),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: AppTheme.sunnyYellow.withValues(alpha: 0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 5),
                  ),
                ]
              : null,
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 44)),
            const SizedBox(height: 10),
            Text(
              label,
              style: AppStyles.baloo2(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: selected ? AppTheme.darkNavy : AppTheme.charcoal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 4: Avatar ───────────────────────────────────────────────────────────

  Widget _buildStep4Avatar() {
    return _stepCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stepMascots[3],
          const SizedBox(height: 8),
          Text(
            'Choose your avatar',
            style: AppStyles.baloo2(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Pick one that looks like you!',
            style: AppStyles.nunito(fontSize: 15, color: AppTheme.charcoal),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 14,
                crossAxisSpacing: 14,
              ),
              itemCount: _avatarEmojis.length,
              itemBuilder: (context, i) {
                final emoji = _avatarEmojis[i];
                final selected = _selectedAvatar == emoji;
                return GestureDetector(
                  onTap: () => setState(() => _selectedAvatar = emoji),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    decoration: BoxDecoration(
                      color: selected
                          ? AppTheme.sunnyYellow.withValues(alpha: 0.3)
                          : AppTheme.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected
                            ? AppTheme.sunnyYellow
                            : AppTheme.softGrey,
                        width: selected ? 3 : 1,
                      ),
                      boxShadow: selected
                          ? [
                              BoxShadow(
                                color: AppTheme.sunnyYellow.withValues(
                                  alpha: 0.45,
                                ),
                                blurRadius: 12,
                                offset: const Offset(0, 5),
                              ),
                            ]
                          : null,
                    ),
                    child: Center(
                      child: Text(emoji, style: const TextStyle(fontSize: 44)),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 14),
          _buildContinueButton(() {
            if (_validateCurrentStep()) _nextStep();
          }),
        ],
      ),
    );
  }

  // ── Step 5: Account (Username + Password) ──────────────────────────────────────

  Widget _buildStep5Account() {
    return _stepCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _stepMascots[4],
          const SizedBox(height: 8),
          Text(
            'Create your account',
            style: AppStyles.baloo2(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: AppTheme.darkNavy,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Pick a username and set your password',
            style: AppStyles.nunito(fontSize: 15, color: AppTheme.charcoal),
          ),
          const SizedBox(height: 22),
          _buildLabel('Username'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _usernameController,
            style: AppStyles.nunito(fontSize: 15, color: AppTheme.darkNavy),
            textCapitalization: TextCapitalization.none,
            textInputAction: TextInputAction.next,
            decoration: _inputDecoration(
              'Choose a username',
              icon: Icons.alternate_email_rounded,
            ),
          ),
          const SizedBox(height: 16),
          _buildLabel('Password'),
          const SizedBox(height: 8),
          TextFormField(
            controller: _passwordController,
            style: AppStyles.nunito(fontSize: 15, color: AppTheme.darkNavy),
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _submit(),
            decoration: _inputDecoration(
              'At least 8 characters',
              icon: Icons.lock_outline_rounded,
            ).copyWith(
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_off_rounded
                      : Icons.visibility_rounded,
                  color: AppTheme.silver,
                ),
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
          ),
          const SizedBox(height: 24),
          BlocBuilder<AuthCubit, AuthState>(
            builder: (context, state) {
              final loading = state is AuthSignupLoading;
              return SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.sunnyYellow,
                    foregroundColor: AppTheme.deepNavy,
                    elevation: 0,
                    shadowColor: AppTheme.sunnyYellow.withValues(alpha: 0.5),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(18),
                    ),
                  ),
                  onPressed: loading ? null : _submit,
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
                          'Create Account',
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
          const SizedBox(height: 12),
          Center(
            child: Text(
              'Your parent may need to help with this step.',
              textAlign: TextAlign.center,
              style: AppStyles.nunito(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppTheme.silver,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Shared ───────────────────────────────────────────────────────────────────

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

  Widget _buildContinueButton(VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.sunnyYellow,
          foregroundColor: AppTheme.deepNavy,
          elevation: 0,
          shadowColor: AppTheme.sunnyYellow.withValues(alpha: 0.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
          ),
        ),
        onPressed: onPressed,
        child: Text(
          'Continue',
          style: AppStyles.baloo2(
            fontSize: 17,
            fontWeight: FontWeight.w800,
            color: AppTheme.deepNavy,
          ),
        ),
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
