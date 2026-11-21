import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_assets.dart';
import '../../../providers/auth_provider.dart';
import '../../../shared/widgets/brand_flame_logo.dart';

class LoginScreen extends ConsumerStatefulWidget {
  final bool initialIsLoginMode;
  const LoginScreen({super.key, this.initialIsLoginMode = true});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  // 'login' or 'register'
  late bool _isLoginMode;

  // Sign In Controllers
  final _identifierController = TextEditingController(text: 'Vyshwa');
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  // Create Account Controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _regPasswordController = TextEditingController();
  final _regConfirmPasswordController = TextEditingController();
  bool _obscureRegPassword = true;
  bool _obscureRegConfirmPassword = true;
  bool _termsAccepted = true;

  String? _localError;

  @override
  void initState() {
    super.initState();
    _isLoginMode = widget.initialIsLoginMode;
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _regPasswordController.dispose();
    _regConfirmPasswordController.dispose();
    super.dispose();
  }

  void _handleQuickDemo() {
    setState(() {
      _isLoginMode = true;
      _identifierController.text = '9092024444';
      _passwordController.text = 'Admin@123';
      _localError = null;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Demo credentials loaded (Afsana - ReNote Demo)'),
        backgroundColor: AppColors.primary,
        duration: Duration(seconds: 2),
      ),
    );
  }

  Future<void> _handleLogin() async {
    setState(() => _localError = null);
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text;

    if (identifier.isEmpty) {
      setState(() => _localError = 'Phone number or email is required');
      return;
    }
    if (password.isEmpty) {
      setState(() => _localError = 'Password is required');
      return;
    }

    final success = await ref
        .read(authProvider.notifier)
        .login(identifier, password);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login Successful! Welcome to ReNote'),
          backgroundColor: AppColors.success,
        ),
      );
      context.go('/dashboard');
    }
  }

  Future<void> _handleRegister() async {
    setState(() => _localError = null);
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _regPasswordController.text;
    final confirmPassword = _regConfirmPasswordController.text;

    if (firstName.isEmpty) {
      setState(() => _localError = 'First name is required');
      return;
    }
    if (phone.isEmpty && email.isEmpty) {
      setState(() => _localError = 'Enter valid phone number or email');
      return;
    }
    if (password.length < 8) {
      setState(() => _localError = 'Password must be at least 8 characters');
      return;
    }
    if (password != confirmPassword) {
      setState(() => _localError = 'Passwords do not match');
      return;
    }
    if (!_termsAccepted) {
      setState(() => _localError = 'Must accept terms & privacy policy');
      return;
    }

    final success = await ref
        .read(authProvider.notifier)
        .register(
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          password: password,
        );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Welcome to ReNote! Account created successfully 🎉'),
          backgroundColor: AppColors.success,
        ),
      );
      context.go('/dashboard');
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final displayedError = _localError ?? authState.errorMessage;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      body: Stack(
        children: [
          // ── Background Ambient Radial Lights ──
          Positioned(
            top: -100,
            left: 0,
            right: 0,
            height: 320,
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.topCenter,
                  radius: 0.8,
                  colors: [
                    AppColors.primary.withValues(alpha: 0.15),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // ── Top Header Navigation Bar ──
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      // Brand Logo + Tagline
                      const BrandFlameLogo(size: 30),
                      const SizedBox(width: 8),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          RichText(
                            text: const TextSpan(
                              style: TextStyle(
                                fontSize: 19,
                                fontWeight: FontWeight.bold,
                                letterSpacing: -0.3,
                              ),
                              children: [
                                TextSpan(
                                  text: 'Re',
                                  style: TextStyle(color: Colors.white),
                                ),
                                TextSpan(
                                  text: 'Note',
                                  style: TextStyle(color: AppColors.primary),
                                ),
                              ],
                            ),
                          ),
                          const Text(
                            'Buy • Sell • Connect',
                            style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFF8E8E98),
                              fontWeight: FontWeight.w500,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),

                      // Quick Demo Button
                      GestureDetector(
                        onTap: _handleQuickDemo,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.3),
                            ),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                LucideIcons.zap,
                                size: 13,
                                color: AppColors.primary,
                              ),
                              SizedBox(width: 4),
                              Text(
                                'Quick Demo',
                                style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Main Scrollable Body ──
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 8,
                    ),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 440),
                        child: Column(
                          children: [
                            // ── Hero Illustration (login-hero.png) ──
                            Container(
                              height: 140,
                              margin: const EdgeInsets.only(top: 4, bottom: 12),
                              child: Stack(
                                alignment: Alignment.center,
                                children: [
                                  Container(
                                    width: 140,
                                    height: 140,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.primary.withValues(
                                            alpha: 0.18,
                                          ),
                                          blurRadius: 40,
                                          spreadRadius: 10,
                                        ),
                                      ],
                                    ),
                                  ),
                                  Image.asset(
                                    AppAssets.loginHero,
                                    height: 130,
                                    fit: BoxFit.contain,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            const Icon(
                                              LucideIcons.store,
                                              size: 72,
                                              color: AppColors.primary,
                                            ),
                                  ),
                                ],
                              ),
                            ),

                            // ── Verified Marketplace Pill ──
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              margin: const EdgeInsets.only(bottom: 12),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: AppColors.primary.withValues(
                                    alpha: 0.25,
                                  ),
                                ),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    LucideIcons.sparkles,
                                    size: 13,
                                    color: AppColors.primary,
                                  ),
                                  SizedBox(width: 5),
                                  Text(
                                    'Verified Marketplace',
                                    style: TextStyle(
                                      color: AppColors.primary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // ── Login / Register Glassmorphism Card ──
                            Container(
                              padding: const EdgeInsets.all(22),
                              decoration: BoxDecoration(
                                color: const Color(0xFF121215),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.08),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.6),
                                    blurRadius: 40,
                                    offset: const Offset(0, 16),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // ── Segmented Control Switcher ──
                                  Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF18181C),
                                      borderRadius: BorderRadius.circular(14),
                                      border: Border.all(
                                        color: Colors.white.withValues(
                                          alpha: 0.06,
                                        ),
                                      ),
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: GestureDetector(
                                            onTap: () => setState(() {
                                              _isLoginMode = true;
                                              _localError = null;
                                            }),
                                            child: AnimatedContainer(
                                              duration: const Duration(
                                                milliseconds: 180,
                                              ),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 9,
                                                  ),
                                              decoration: BoxDecoration(
                                                color: _isLoginMode
                                                    ? const Color(0xFF222228)
                                                    : Colors.transparent,
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                                border: _isLoginMode
                                                    ? Border.all(
                                                        color: Colors.white
                                                            .withValues(
                                                              alpha: 0.08,
                                                            ),
                                                      )
                                                    : null,
                                                boxShadow: _isLoginMode
                                                    ? [
                                                        BoxShadow(
                                                          color: Colors.black
                                                              .withValues(
                                                                alpha: 0.3,
                                                              ),
                                                          blurRadius: 4,
                                                        ),
                                                      ]
                                                    : null,
                                              ),
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(
                                                    LucideIcons.lock,
                                                    size: 14,
                                                    color: _isLoginMode
                                                        ? AppColors.primary
                                                        : const Color(
                                                            0xFF8E8E98,
                                                          ),
                                                  ),
                                                  const SizedBox(width: 6),
                                                  Flexible(
                                                    child: Text(
                                                      'Sign In',
                                                      overflow: TextOverflow
                                                          .ellipsis,
                                                      style: TextStyle(
                                                        fontSize: 13,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        color: _isLoginMode
                                                            ? Colors.white
                                                            : const Color(
                                                                0xFF8E8E98,
                                                              ),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        Expanded(
                                          child: GestureDetector(
                                            onTap: () => setState(() {
                                              _isLoginMode = false;
                                              _localError = null;
                                            }),
                                            child: AnimatedContainer(
                                              duration: const Duration(
                                                milliseconds: 180,
                                              ),
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    vertical: 9,
                                                  ),
                                              decoration: BoxDecoration(
                                                color: !_isLoginMode
                                                    ? const Color(0xFF222228)
                                                    : Colors.transparent,
                                                borderRadius:
                                                    BorderRadius.circular(10),
                                                border: !_isLoginMode
                                                    ? Border.all(
                                                        color: Colors.white
                                                            .withValues(
                                                              alpha: 0.08,
                                                            ),
                                                      )
                                                    : null,
                                                boxShadow: !_isLoginMode
                                                    ? [
                                                        BoxShadow(
                                                          color: Colors.black
                                                              .withValues(
                                                                alpha: 0.3,
                                                              ),
                                                          blurRadius: 4,
                                                        ),
                                                      ]
                                                    : null,
                                              ),
                                              child: Row(
                                                mainAxisAlignment:
                                                    MainAxisAlignment.center,
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(
                                                    LucideIcons.sparkles,
                                                    size: 14,
                                                    color: !_isLoginMode
                                                        ? AppColors.primary
                                                        : const Color(
                                                            0xFF8E8E98,
                                                          ),
                                                  ),
                                                  const SizedBox(width: 6),
                                                  Flexible(
                                                    child: Text(
                                                      'Create Account',
                                                      overflow: TextOverflow
                                                          .ellipsis,
                                                      style: TextStyle(
                                                        fontSize: 13,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        color: !_isLoginMode
                                                            ? Colors.white
                                                            : const Color(
                                                                0xFF8E8E98,
                                                              ),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 18),

                                  // ── Card Title & Subtitle ──
                                  Text(
                                    _isLoginMode
                                        ? 'Welcome back'
                                        : 'Create an account',
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                      letterSpacing: -0.3,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _isLoginMode
                                        ? 'Enter your email or phone number to sign in'
                                        : 'Get started in seconds to buy, sell, and connect',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF8E8E98),
                                    ),
                                  ),
                                  const SizedBox(height: 16),

                                  // ── Error Alert Banner ──
                                  if (displayedError != null) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 9,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF3F1315),
                                        borderRadius: BorderRadius.circular(10),
                                        border: Border.all(
                                          color: const Color(0xFFE53935)
                                              .withValues(alpha: 0.4),
                                        ),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(
                                            LucideIcons.alertCircle,
                                            color: Color(0xFFEF5350),
                                            size: 16,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(
                                            child: Text(
                                              displayedError,
                                              style: const TextStyle(
                                                color: Color(0xFFFFCDD2),
                                                fontSize: 12,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ),
                                          GestureDetector(
                                            onTap: () => setState(
                                              () => _localError = null,
                                            ),
                                            child: const Icon(
                                              LucideIcons.x,
                                              color: Color(0xFFEF5350),
                                              size: 14,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 14),
                                  ],

                                  // ── SIGN IN FORM ──
                                  if (_isLoginMode) ...[
                                    _buildLabel('Email or Phone Number'),
                                    const SizedBox(height: 6),
                                    _buildDarkInput(
                                      controller: _identifierController,
                                      hintText: 'Enter phone or email',
                                      prefixIcon: LucideIcons.smartphone,
                                    ),
                                    const SizedBox(height: 14),

                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        _buildLabel('Password'),
                                        GestureDetector(
                                          onTap: () {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                                  const SnackBar(
                                                    content: Text(
                                                      'Password reset available via OTP in Settings',
                                                    ),
                                                    backgroundColor:
                                                        AppColors.primary,
                                                  ),
                                                );
                                          },
                                          child: const Text(
                                            'Forgot Password?',
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: Color(0xFFEF5350),
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    _buildDarkInput(
                                      controller: _passwordController,
                                      hintText: 'Enter your password',
                                      prefixIcon: LucideIcons.lock,
                                      obscureText: _obscurePassword,
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _obscurePassword
                                              ? LucideIcons.eyeOff
                                              : LucideIcons.eye,
                                          size: 16,
                                          color: const Color(0xFF71717A),
                                        ),
                                        onPressed: () => setState(
                                          () => _obscurePassword =
                                              !_obscurePassword,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 18),

                                    // Sign In Button
                                    _buildPrimaryGradientButton(
                                      label: 'Sign In',
                                      isLoading: authState.isLoading,
                                      icon: LucideIcons.arrowRight,
                                      onPressed: _handleLogin,
                                    ),
                                  ] else ...[
                                    // ── CREATE ACCOUNT FORM ──
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              _buildLabel('First Name'),
                                              const SizedBox(height: 6),
                                              _buildDarkInput(
                                                controller:
                                                    _firstNameController,
                                                hintText: 'e.g. Rahul',
                                                prefixIcon: LucideIcons.user,
                                              ),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              _buildLabel('Last Name'),
                                              const SizedBox(height: 6),
                                              _buildDarkInput(
                                                controller: _lastNameController,
                                                hintText: 'e.g. Sharma',
                                              ),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    _buildLabel('Phone Number'),
                                    const SizedBox(height: 6),
                                    _buildDarkInput(
                                      controller: _phoneController,
                                      hintText: '10-digit mobile number',
                                      prefixIcon: LucideIcons.phone,
                                      keyboardType: TextInputType.phone,
                                    ),
                                    const SizedBox(height: 12),

                                    _buildLabel('Email (Optional)'),
                                    const SizedBox(height: 6),
                                    _buildDarkInput(
                                      controller: _emailController,
                                      hintText: 'name@example.com',
                                      prefixIcon: LucideIcons.mail,
                                      keyboardType: TextInputType.emailAddress,
                                    ),
                                    const SizedBox(height: 12),

                                    _buildLabel('Password'),
                                    const SizedBox(height: 6),
                                    _buildDarkInput(
                                      controller: _regPasswordController,
                                      hintText:
                                          'Min 8 chars, 1 uppercase, 1 special',
                                      prefixIcon: LucideIcons.lock,
                                      obscureText: _obscureRegPassword,
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _obscureRegPassword
                                              ? LucideIcons.eyeOff
                                              : LucideIcons.eye,
                                          size: 16,
                                          color: const Color(0xFF71717A),
                                        ),
                                        onPressed: () => setState(
                                          () => _obscureRegPassword =
                                              !_obscureRegPassword,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),

                                    _buildLabel('Confirm Password'),
                                    const SizedBox(height: 6),
                                    _buildDarkInput(
                                      controller: _regConfirmPasswordController,
                                      hintText: 'Repeat password',
                                      prefixIcon: LucideIcons.lock,
                                      obscureText: _obscureRegConfirmPassword,
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _obscureRegConfirmPassword
                                              ? LucideIcons.eyeOff
                                              : LucideIcons.eye,
                                          size: 16,
                                          color: const Color(0xFF71717A),
                                        ),
                                        onPressed: () => setState(
                                          () => _obscureRegConfirmPassword =
                                              !_obscureRegConfirmPassword,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 14),

                                    // Terms & Conditions Checkbox
                                    GestureDetector(
                                      onTap: () => setState(
                                        () => _termsAccepted = !_termsAccepted,
                                      ),
                                      child: Row(
                                        children: [
                                          Icon(
                                            _termsAccepted
                                                ? LucideIcons.checkSquare
                                                : LucideIcons.square,
                                            size: 17,
                                            color: _termsAccepted
                                                ? AppColors.primary
                                                : const Color(0xFF71717A),
                                          ),
                                          const SizedBox(width: 8),
                                          const Expanded(
                                            child: Text(
                                              'I accept the Terms & Conditions and Privacy Policy',
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: Color(0xFFA1A1AA),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 16),

                                    // Create Account Button
                                    _buildPrimaryGradientButton(
                                      label: 'Create Account',
                                      isLoading: authState.isLoading,
                                      icon: LucideIcons.sparkles,
                                      onPressed: _handleRegister,
                                    ),
                                  ],

                                  const SizedBox(height: 18),

                                  // ── OR Divider ──
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Container(
                                          height: 1,
                                          color: Colors.white.withValues(
                                            alpha: 0.08,
                                          ),
                                        ),
                                      ),
                                      const Padding(
                                        padding: EdgeInsets.symmetric(
                                          horizontal: 12,
                                        ),
                                        child: Text(
                                          'OR',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF71717A),
                                          ),
                                        ),
                                      ),
                                      Expanded(
                                        child: Container(
                                          height: 1,
                                          color: Colors.white.withValues(
                                            alpha: 0.08,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 14),

                                  // ── Continue with Google Button ──
                                  OutlinedButton(
                                    onPressed: () {
                                      ScaffoldMessenger.of(
                                        context,
                                      ).showSnackBar(
                                        const SnackBar(
                                          content: Text(
                                            'Google OAuth will open via ReNote OAuth Broker',
                                          ),
                                          backgroundColor: AppColors.primary,
                                        ),
                                      );
                                    },
                                    style: OutlinedButton.styleFrom(
                                      backgroundColor: const Color(0xFF16161A),
                                      side: BorderSide(
                                        color: Colors.white.withValues(
                                          alpha: 0.08,
                                        ),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        vertical: 12,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        _buildGoogleIcon(),
                                        const SizedBox(width: 8),
                                        const Text(
                                          'Continue with Google',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 20),

                            // ── Footer Value Highlights ──
                            Container(
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.02),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.04),
                                ),
                              ),
                              child: const Column(
                                children: [
                                  _ValueRow(
                                    icon: LucideIcons.shieldCheck,
                                    text: 'Safe transactions with verified local buyer & seller profiles',
                                  ),
                                  SizedBox(height: 8),
                                  _ValueRow(
                                    icon: LucideIcons.zap,
                                    text: 'Instant inquiries, direct chat, and real-time deal alerts',
                                  ),
                                  SizedBox(height: 8),
                                  _ValueRow(
                                    icon: LucideIcons.users,
                                    text: 'Connect directly with trusted people in your neighborhood',
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: Color(0xFFD4D4D8),
      ),
    );
  }

  Widget _buildDarkInput({
    required TextEditingController controller,
    required String hintText,
    IconData? prefixIcon,
    Widget? suffixIcon,
    bool obscureText = false,
    TextInputType? keyboardType,
  }) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        cursorColor: AppColors.primary,
        cursorWidth: 2.0,
        style: const TextStyle(
          color: Color(0xFF000000), // Pure Black entered text
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
        decoration: InputDecoration(
          isDense: true,
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 12,
          ),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFE4E4E7), width: 1),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFFE4E4E7), width: 1),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
          ),
          hintText: hintText,
          hintStyle: const TextStyle(color: Color(0xFF71717A), fontSize: 12),
          prefixIcon: prefixIcon != null
              ? Icon(prefixIcon, size: 16, color: const Color(0xFF71717A))
              : null,
          suffixIcon: suffixIcon,
        ),
      ),
    );
  }

  Widget _buildPrimaryGradientButton({
    required String label,
    required bool isLoading,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFE85D04), Color(0xFFFF6B1A)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.35),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: isLoading ? null : onPressed,
          child: Center(
            child: isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: Colors.white,
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Icon(icon, size: 16, color: Colors.white),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildGoogleIcon() {
    return Container(
      width: 18,
      height: 18,
      alignment: Alignment.center,
      child: const Text(
        'G',
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w900,
          color: Color(0xFF4285F4),
        ),
      ),
    );
  }
}

class _ValueRow extends StatelessWidget {
  final IconData icon;
  final String text;

  const _ValueRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.12),
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
          ),
          child: Icon(icon, size: 12, color: AppColors.primary),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFFA1A1AA),
              height: 1.3,
            ),
          ),
        ),
      ],
    );
  }
}
