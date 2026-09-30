import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/navigation/app_router.dart';
import '../../../core/theme/app_theme.dart';
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

  // Step 2: Age scroll controller (created once, reused)
  late final FixedExtentScrollController _ageScrollController;

  // State
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
        backgroundColor: AppTheme.deepNavy,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
            onPressed: _step > 0 ? _prevStep : () => context.pop(),
          ),
          title: Text(
            'Step ${_step + 1} of 6',
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          centerTitle: true,
        ),
        body: SafeArea(
          child: Column(
            children: [
              _buildProgressIndicator(),
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
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        children: List.generate(6, (i) {
          final isActive = i <= _step;
          return Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.symmetric(horizontal: 3),
              height: 4,
              decoration: BoxDecoration(
                color: isActive ? AppTheme.gold : Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ── Step 1: Full Name ────────────────────────────────────────────────────────
  static const _stepMascots = [
    MascotBubble(emoji: '👋', size: 90, label: 'Hi friend!'),
    MascotBubble(emoji: '🎂', size: 90, label: 'Pick your age!'),
    MascotBubble(emoji: '🌈', size: 90, label: 'You do you!'),
    MascotBubble(emoji: '🦸', size: 90, label: 'Pick your hero!'),
    MascotBubble(emoji: '🔐', size: 70, label: 'Grown-up step'),
    MascotBubble(emoji: '🎉', size: 90, label: 'All done!'),
  ];

  Widget _buildStep1Name() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          _stepMascots[0],
          const SizedBox(height: 8),
          const Text(
            "What's your name?",
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              fontFamily: 'Baloo2',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Let's get to know you!",
            style: TextStyle(
              fontSize: 15,
              color: Colors.white.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 32),
          TextFormField(
            controller: _nameController,
            style: const TextStyle(color: Colors.white, fontSize: 18),
            textCapitalization: TextCapitalization.words,
            decoration: _inputDecoration('Enter your full name'),
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
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          _stepMascots[1],
          const SizedBox(height: 8),
          const Text(
            'How old are you?',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              fontFamily: 'Baloo2',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Pick your age from the wheel',
            style: TextStyle(
              fontSize: 15,
              color: Colors.white.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 32),
          Expanded(
            child: ListWheelScrollView.useDelegate(
              controller: _ageScrollController,
              itemExtent: 56,
              physics: const FixedExtentScrollPhysics(),
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
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
          _buildContinueButton(() {
            if (_validateCurrentStep()) _nextStep();
          }),
        ],
      ),
    );
  }

  // ── Step 3: Gender ───────────────────────────────────────────────────────────

  Widget _buildStep3Gender() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          _stepMascots[2],
          const SizedBox(height: 8),
          const Text(
            "What's your gender?",
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              fontFamily: 'Baloo2',
            ),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              Expanded(child: _buildGenderCard('Boy', '👦', 'BOY')),
              const SizedBox(width: 16),
              Expanded(child: _buildGenderCard('Girl', '👧', 'GIRL')),
              const SizedBox(width: 16),
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
        padding: const EdgeInsets.symmetric(vertical: 32),
        decoration: BoxDecoration(
          color: selected
              ? AppTheme.gold.withValues(alpha: 0.15)
              : Colors.white.withValues(alpha: 0.06),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected
                ? AppTheme.gold
                : Colors.white.withValues(alpha: 0.12),
            width: selected ? 2 : 1,
          ),
        ),
        child: Column(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: selected ? AppTheme.gold : Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Step 4: Avatar ───────────────────────────────────────────────────────────

  Widget _buildStep4Avatar() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 16),
          _stepMascots[3],
          const SizedBox(height: 8),
          const Text(
            'Choose your avatar',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w800,
              color: Colors.white,
              fontFamily: 'Baloo2',
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Pick one that looks like you!',
            style: TextStyle(
              fontSize: 15,
              color: Colors.white.withValues(alpha: 0.6),
            ),
          ),
          const SizedBox(height: 32),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
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
                          ? AppTheme.gold.withValues(alpha: 0.2)
                          : Colors.white.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: selected ? AppTheme.gold : Colors.transparent,
                        width: 3,
                      ),
                    ),
                    child: Center(
                      child: Text(emoji, style: const TextStyle(fontSize: 48)),
                    ),
                  ),
                );
              },
            ),
          ),
          _buildContinueButton(() {
            if (_validateCurrentStep()) _nextStep();
          }),
        ],
      ),
    );
  }

  // ── Step 5: Account (Username + Password) ──────────────────────────────────────

  Widget _buildStep5Account() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A2332), Color(0xFF0F1A2E)],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            MascotBubble(
              emoji: '🔐',
              size: 72,
              label: 'Grown-up step',
              backgroundColor: AppTheme.accentBlue.withValues(alpha: 0.18),
            ),
            const SizedBox(height: 12),
            const Text(
              'Create your account',
              style: TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: Colors.white,
                fontFamily: 'Baloo2',
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Pick a username and set your password',
              style: TextStyle(
                fontSize: 15,
                color: Colors.white.withValues(alpha: 0.6),
              ),
            ),
            const SizedBox(height: 24),
            _buildLabel('Username'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _usernameController,
              style: const TextStyle(color: Colors.white),
              textCapitalization: TextCapitalization.none,
              decoration: _inputDecoration('Choose a username', borderColor: AppTheme.sunnyYellow),
            ),
            const SizedBox(height: 16),
            _buildLabel('Password'),
            const SizedBox(height: 8),
            TextFormField(
              controller: _passwordController,
              style: const TextStyle(color: Colors.white),
              obscureText: _obscurePassword,
              decoration: _inputDecoration('At least 8 characters', borderColor: AppTheme.sunnyYellow)
                  .copyWith(
                suffixIcon: IconButton(
                  icon: Icon(
                    _obscurePassword ? Icons.visibility_off : Icons.visibility,
                    color: Colors.white54,
                  ),
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                ),
              ),
            ),
            const SizedBox(height: 28),
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
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: loading ? null : _submit,
                    child: loading
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text(
                            'Create Account',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                  ),
                );
              },
            ),
            const SizedBox(height: 12),
            Text(
              'Your parent may need to help with this step.',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Colors.white.withValues(alpha: 0.5),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  // ── Shared ───────────────────────────────────────────────────────────────────

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  Widget _buildContinueButton(VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.primaryYellow,
          foregroundColor: AppTheme.textNavy,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        onPressed: onPressed,
        child: const Text(
          'Continue',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, {Color? borderColor}) {
    final bc = borderColor ?? Colors.white.withValues(alpha: 0.15);
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: Colors.white.withValues(alpha: 0.4)),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.08),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: bc),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: bc),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: AppTheme.sunnyYellow, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Colors.redAccent),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
      ),
      errorStyle: const TextStyle(color: Colors.redAccent),
    );
  }
}
