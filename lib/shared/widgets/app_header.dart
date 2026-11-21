import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';

class AppHeader extends ConsumerStatefulWidget implements PreferredSizeWidget {
  final String? title;
  final bool showBackButton;
  final List<Widget>? actions;

  const AppHeader({
    super.key,
    this.title,
    this.showBackButton = false,
    this.actions,
  });

  @override
  Size get preferredSize => const Size.fromHeight(58);

  @override
  ConsumerState<AppHeader> createState() => _AppHeaderState();
}

class _AppHeaderState extends ConsumerState<AppHeader> {
  String _selectedFY = 'FY 2025-26';
  final List<String> _fyOptions = [
    'FY 2024-25',
    'FY 2025-26',
    'FY 2026-27',
    'All FY',
  ];

  void _showFYPicker(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Select Financial Year',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        LucideIcons.x,
                        size: 20,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ..._fyOptions.map((fy) {
                  final isSelected = _selectedFY == fy;
                  return ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Icon(
                      LucideIcons.calendar,
                      size: 18,
                      color: isSelected
                          ? AppColors.primary
                          : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                    ),
                    title: Text(
                      fy,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.w500,
                        color: isSelected
                            ? AppColors.primary
                            : (isDark ? AppColors.darkTextPrimary : AppColors.textPrimary),
                      ),
                    ),
                    trailing: isSelected
                        ? const Icon(
                            LucideIcons.check,
                            size: 18,
                            color: AppColors.primary,
                          )
                        : null,
                    onTap: () {
                      setState(() => _selectedFY = fy);
                      Navigator.pop(ctx);
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  void _handleModuleChange(String route) {
    context.go(route);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final firstName =
        user?.firstName ?? (user?.fullName.split(' ').firstOrNull ?? 'User');
    String currentRoute = '';
    try {
      currentRoute = GoRouterState.of(context).uri.toString();
    } catch (_) {
      currentRoute = '';
    }

    // Active module label
    String currentModule = 'Estimations';
    if (currentRoute == '/dashboard') {
      currentModule = 'Dashboard';
    } else if (currentRoute.startsWith('/quotations') ||
        currentRoute.startsWith('/estimations')) {
      currentModule = 'Estimations';
    } else if (currentRoute.startsWith('/posters')) {
      currentModule = 'Posters';
    } else if (currentRoute.startsWith('/invoices')) {
      currentModule = 'Invoice';
    } else if (currentRoute.startsWith('/products')) {
      currentModule = 'Warehouse';
    } else if (currentRoute.startsWith('/marketplace')) {
      currentModule = 'Marketplace';
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return AppBar(
      backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
      surfaceTintColor: Colors.transparent,
      elevation: 0.5,
      titleSpacing: 8,
      leadingWidth: 44,
      leading: widget.showBackButton
          ? IconButton(
              icon: Icon(
                LucideIcons.arrowLeft,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                size: 20,
              ),
              onPressed: () => context.pop(),
            )
          : Padding(
              padding: const EdgeInsets.only(left: 12),
              child: Center(
                child: GestureDetector(
                  onTap: () => Scaffold.of(context).openDrawer(),
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      LucideIcons.menu,
                      color: Colors.white,
                      size: 16,
                    ),
                  ),
                ),
              ),
            ),
      title: widget.title != null
          ? FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                widget.title!,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
            )
          : Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Module Switcher Dropdown
                PopupMenuButton<String>(
                  onSelected: _handleModuleChange,
                  color: isDark ? AppColors.darkCard : Colors.white,
                  elevation: 6,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  itemBuilder: (ctx) => [
                    const PopupMenuItem(
                      value: '/dashboard',
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.layoutDashboard,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Dashboard',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: '/marketplace',
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.store,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Marketplace',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: '/quotations',
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.fileSpreadsheet,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Estimations',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: '/posters',
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.palette,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Posters',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: '/invoices',
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.receipt,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Invoice',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: '/products',
                      child: Row(
                        children: [
                          Icon(
                            LucideIcons.package,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          SizedBox(width: 10),
                          Text(
                            'Product Warehouse',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          currentModule,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(width: 2),
                        Icon(
                          LucideIcons.chevronDown,
                          size: 14,
                          color: isDark ? AppColors.darkTextSecondary : const Color(0xFF64748B),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 4),

                // Greeting text: "Hi, [First Name] 👋"
                if (authState.isLoggedIn)
                  Flexible(
                    child: RichText(
                      overflow: TextOverflow.ellipsis,
                      text: TextSpan(
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textPrimary,
                        ),
                        children: [
                          const TextSpan(text: 'Hi, '),
                          TextSpan(
                            text: firstName,
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const TextSpan(text: ' 👋'),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
      actions:
          widget.actions ??
          [
            // ── Financial Year Pill ──
            GestureDetector(
              onTap: () => _showFYPicker(context),
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 14),
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      LucideIcons.calendar,
                      size: 12,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      _selectedFY,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF7C2D12),
                      ),
                    ),
                    const SizedBox(width: 1),
                    const Icon(
                      LucideIcons.chevronDown,
                      size: 10,
                      color: AppColors.primary,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 4),

            // ── Go Pro / Premium Button ──
            GestureDetector(
              onTap: () => context.go('/subscription'),
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 13),
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFE85D04), Color(0xFFFF6B1A)],
                  ),
                  borderRadius: BorderRadius.circular(6),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.25),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.gem, size: 11, color: Colors.white),
                    SizedBox(width: 3),
                    Text(
                      'PRO',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 6),

            // ── Notification Bell (Yellow circle with red unread badge) ──
            GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text(
                      'Notifications: You have all latest system alerts.',
                    ),
                    duration: Duration(seconds: 2),
                    backgroundColor: AppColors.primary,
                  ),
                );
              },
              child: Container(
                width: 28,
                height: 28,
                margin: const EdgeInsets.symmetric(vertical: 14),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color(0xFFFACC15),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    const Icon(LucideIcons.bell, size: 15, color: Colors.white),
                    Positioned(
                      top: 1,
                      right: 1,
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: Color(0xFFEF4444),
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 8),

            // ── User Profile Avatar (Border-2 orange) ──
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: GestureDetector(
                onTap: () => context.go('/settings'),
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary, width: 2),
                    color: AppColors.primaryBg,
                  ),
                  child: ClipOval(
                    child: user?.profilePic != null
                        ? Image.network(
                            user!.profilePic!,
                            fit: BoxFit.cover,
                            errorBuilder: (ctx, err, stack) =>
                                _buildAvatarFallback(firstName),
                          )
                        : _buildAvatarFallback(firstName),
                  ),
                ),
              ),
            ),
          ],
    );
  }

  Widget _buildAvatarFallback(String name) {
    return Center(
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : 'U',
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: AppColors.primary,
        ),
      ),
    );
  }
}
