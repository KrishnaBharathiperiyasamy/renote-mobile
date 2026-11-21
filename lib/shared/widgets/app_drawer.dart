import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/company_provider.dart';
import 'brand_flame_logo.dart';

class AppDrawer extends ConsumerStatefulWidget {
  const AppDrawer({super.key});

  @override
  ConsumerState<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends ConsumerState<AppDrawer> {
  // Collapsible section state matching buildSections in Sidebar/page.tsx
  final Map<String, bool> _openSections = {
    'create': true,
    'account': true,
    'support': false,
    'danger': false,
  };

  void _toggleSection(String sectionId) {
    setState(() {
      _openSections[sectionId] = !(_openSections[sectionId] ?? false);
    });
  }

  void _showCompanyPicker(BuildContext context) {
    final companyNotifier = ref.read(companyProvider.notifier);
    final companyState = ref.watch(companyProvider);
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
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Select Business Profile',
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
                const SizedBox(height: 12),
                if (companyState.companies.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 20),
                    child: Center(
                      child: Text(
                        'No companies registered yet.',
                        style: TextStyle(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  )
                else
                  ...companyState.companies.map((c) {
                    final isSelected = companyState.selectedCompany?.id == c.id;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: isSelected
                            ? AppColors.primary
                            : (isDark ? const Color(0xFF272A35) : AppColors.surfaceMuted),
                        child: Icon(
                          LucideIcons.building2,
                          color: isSelected ? Colors.white : AppColors.primary,
                          size: 18,
                        ),
                      ),
                      title: Text(
                        c.name,
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
                      subtitle: Text(
                        c.phone.isNotEmpty ? c.phone : (c.gstNo ?? ''),
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(
                              LucideIcons.check,
                              color: AppColors.primary,
                              size: 18,
                            )
                          : null,
                      onTap: () {
                        companyNotifier.selectCompany(c);
                        Navigator.pop(ctx);
                      },
                    );
                  }),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pop(context);
                      context.go('/settings');
                    },
                    icon: const Icon(LucideIcons.plus, size: 16),
                    label: const Text('Manage & Add Companies'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _confirmDeleteAccount(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        title: Text(
          'Delete Account',
          style: TextStyle(
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
        content: Text(
          'Are you sure you want to delete your ReNote account and all related business data? This action is permanent and cannot be undone.',
          style: TextStyle(
            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () {
              Navigator.pop(ctx);
              Navigator.pop(context);
              ref.read(authProvider.notifier).logout();
              context.go('/login');
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Account deletion initiated')),
              );
            },
            child: const Text(
              'Delete Permanently',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  void _showNotificationsModal(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        final notifications = [
          {
            'title': 'New Estimate Created',
            'desc': 'Estimate #EST-1049 was generated successfully.',
            'time': '10 mins ago',
            'icon': LucideIcons.fileSpreadsheet,
            'color': AppColors.primary,
          },
          {
            'title': 'GST Update Available',
            'desc': 'New GST rate rules for FY 2025-26 are now active.',
            'time': '2 hours ago',
            'icon': LucideIcons.receipt,
            'color': const Color(0xFF2563EB),
          },
          {
            'title': 'Marketplace Inquiry',
            'desc': 'A buyer is interested in your catalog items.',
            'time': 'Yesterday',
            'icon': LucideIcons.store,
            'color': const Color(0xFF10B981),
          },
        ];

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.bell, size: 20, color: AppColors.primary),
                        const SizedBox(width: 8),
                        Text(
                          'Notifications',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                          ),
                        ),
                      ],
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
                const SizedBox(height: 12),
                ...notifications.map((n) {
                  final color = n['color'] as Color;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: color.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(n['icon'] as IconData, size: 18, color: color),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                n['title'] as String,
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                n['desc'] as String,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                n['time'] as String,
                                style: TextStyle(
                                  fontSize: 10,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final authState = ref.watch(authProvider);
    final companyState = ref.watch(companyProvider);
    String currentRoute = '';
    try {
      currentRoute = GoRouterState.of(context).uri.toString();
    } catch (_) {
      currentRoute = '';
    }

    return Drawer(
      backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // ── Drawer Header: Brand Flame Logo + reNote + Close button ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  const BrandFlameLogo(size: 28),
                  const SizedBox(width: 8),
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.3,
                      ),
                      children: [
                        TextSpan(
                          text: 'Re',
                          style: TextStyle(
                            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                          ),
                        ),
                        const TextSpan(
                          text: 'Note',
                          style: TextStyle(color: AppColors.primary),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: Icon(
                      LucideIcons.x,
                      size: 20,
                      color: isDark ? AppColors.darkTextSecondary : const Color(0xFF8A94A6),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // ── Scrollable Menu Area ──
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                children: [
                  // Active Company Profile Card
                  if (authState.isLoggedIn)
                    GestureDetector(
                      onTap: () => _showCompanyPicker(context),
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1B1E26) : const Color(0xFFFFF7ED),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: AppColors.primary.withValues(
                              alpha: isDark ? 0.35 : 0.25,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(
                                  alpha: 0.15,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                LucideIcons.building2,
                                color: AppColors.primary,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    companyState.selectedCompany?.name ??
                                        authState.user?.fullName ??
                                        'My Business Profile',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 13,
                                      color: isDark ? AppColors.darkTextPrimary : const Color(0xFF1E293B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 1),
                                  Text(
                                    companyState.selectedCompany?.phone ??
                                        authState.user?.email ??
                                        'Tap to switch company',
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? AppColors.darkTextSecondary : const Color(0xFF64748B),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const Icon(
                              LucideIcons.chevronDown,
                              size: 16,
                              color: AppColors.primary,
                            ),
                          ],
                        ),
                      ),
                    ),

                  // ── SECTION 1: CREATE & MANAGE ──
                  _buildSectionHeader(
                    id: 'create',
                    title: 'CREATE & MANAGE',
                    icon: LucideIcons.layoutGrid,
                  ),
                  if (_openSections['create'] == true) ...[
                    _buildMenuItem(
                      label: 'Dashboard',
                      icon: LucideIcons.layoutDashboard,
                      isActive:
                          currentRoute == '/dashboard' ||
                          currentRoute == '/' ||
                          currentRoute.isEmpty,
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/dashboard');
                      },
                    ),
                    _buildMenuItem(
                      label: 'Marketplace',
                      icon: LucideIcons.store,
                      isActive: currentRoute.startsWith('/marketplace'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/marketplace');
                      },
                    ),
                    _buildMenuItem(
                      label: 'Estimations',
                      icon: LucideIcons.fileSpreadsheet,
                      isActive:
                          currentRoute.startsWith('/quotations') ||
                          currentRoute.startsWith('/estimations'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/quotations');
                      },
                    ),
                    _buildMenuItem(
                      label: 'Posters',
                      icon: LucideIcons.palette,
                      isActive:
                          currentRoute.startsWith('/posters') &&
                          !currentRoute.contains('tab=links'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/posters');
                      },
                    ),
                    _buildMenuItem(
                      label: 'Invoices',
                      icon: LucideIcons.receipt,
                      isActive: currentRoute.startsWith('/invoices'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/invoices');
                      },
                    ),
                    _buildMenuItem(
                      label: 'Product Warehouse',
                      icon: LucideIcons.package,
                      isActive: currentRoute.startsWith('/products'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/products');
                      },
                    ),
                    _buildMenuItem(
                      label: 'My Poster Links',
                      icon: LucideIcons.link2,
                      isActive:
                          currentRoute.startsWith('/posters') &&
                          currentRoute.contains('tab=links'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/posters?tab=links');
                      },
                    ),
                  ],
                  const SizedBox(height: 12),

                  // ── SECTION 2: ACCOUNT ──
                  _buildSectionHeader(
                    id: 'account',
                    title: 'ACCOUNT',
                    icon: LucideIcons.settings,
                  ),
                  if (_openSections['account'] == true) ...[
                    _buildMenuItem(
                      label: 'My Companies',
                      icon: LucideIcons.building2,
                      isActive: currentRoute.startsWith('/companies'),
                      onTap: () {
                        Navigator.pop(context);
                        _showCompanyPicker(context);
                      },
                    ),
                    _buildMenuItem(
                      label: 'My Customers',
                      icon: LucideIcons.users,
                      isActive: currentRoute.startsWith('/customers'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/customers');
                      },
                    ),
                    _buildMenuItem(
                      label: 'Notifications',
                      icon: LucideIcons.bell,
                      badge: 'New',
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                        _showNotificationsModal(context);
                      },
                    ),
                    _buildMenuItem(
                      label: 'Account Settings',
                      icon: LucideIcons.settings,
                      isActive: currentRoute.startsWith('/settings'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/settings');
                      },
                    ),
                    _buildMenuItem(
                      label: 'Subscription Plans',
                      icon: LucideIcons.gem,
                      isActive: currentRoute.startsWith('/subscription'),
                      onTap: () {
                        Navigator.pop(context);
                        context.go('/subscription');
                      },
                    ),
                    if (authState.isLoggedIn)
                      _buildMenuItem(
                        label: 'Log Out',
                        icon: LucideIcons.logOut,
                        color: const Color(0xFFEF4444),
                        isActive: false,
                        onTap: () {
                          Navigator.pop(context);
                          ref.read(authProvider.notifier).logout();
                          context.go('/login');
                        },
                      ),
                  ],
                  const SizedBox(height: 12),

                  // ── SECTION 3: SUPPORT ──
                  _buildSectionHeader(
                    id: 'support',
                    title: 'SUPPORT',
                    icon: LucideIcons.lifeBuoy,
                  ),
                  if (_openSections['support'] == true) ...[
                    _buildMenuItem(
                      label: 'About Us',
                      icon: LucideIcons.info,
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                        _showInfoDialog(
                          context,
                          'About ReNote',
                          'ReNote is India\'s all-in-one business growth app for estimations, GST billing, marketing posters, and verified B2B marketplace connections.',
                        );
                      },
                    ),
                    _buildMenuItem(
                      label: 'Contact Us',
                      icon: LucideIcons.phone,
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                        _showInfoDialog(
                          context,
                          'Contact Us',
                          'Email: info@krishub.in\nHelpline: +91 90920 24444\nLocation: Coimbatore, Tamil Nadu, India',
                        );
                      },
                    ),
                    _buildMenuItem(
                      label: 'Terms & Conditions',
                      icon: LucideIcons.fileText,
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                        _showInfoDialog(
                          context,
                          'Terms & Conditions',
                          'By using ReNote, you agree to our standard service terms, fair billing policy, and user content agreements.',
                        );
                      },
                    ),
                    _buildMenuItem(
                      label: 'Privacy Policy',
                      icon: LucideIcons.shield,
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                        _showInfoDialog(
                          context,
                          'Privacy Policy',
                          'Your business data, customer lists, and documents are encrypted and protected under strict Indian data privacy protocols.',
                        );
                      },
                    ),
                    _buildMenuItem(
                      label: 'Refund Policy',
                      icon: LucideIcons.refreshCw,
                      isActive: false,
                      onTap: () {
                        Navigator.pop(context);
                        _showInfoDialog(
                          context,
                          'Refund Policy',
                          'Subscriptions can be cancelled at any time from your account settings before the renewal date.',
                        );
                      },
                    ),
                  ],
                  const SizedBox(height: 12),

                  // ── SECTION 4: DANGER ZONE ──
                  _buildSectionHeader(
                    id: 'danger',
                    title: 'DANGER ZONE',
                    icon: LucideIcons.alertTriangle,
                    headerColor: const Color(0xFFEF4444),
                  ),
                  if (_openSections['danger'] == true) ...[
                    _buildMenuItem(
                      label: 'Delete Account',
                      icon: LucideIcons.trash2,
                      color: const Color(0xFFEF4444),
                      isActive: false,
                      onTap: () => _confirmDeleteAccount(context),
                    ),
                  ],
                ],
              ),
            ),

            // ── Drawer Footer: Version info ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'ReNote Mobile',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.darkTextSecondary : const Color(0xFF64748B),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Flexible(
                    child: Text(
                      'v1.0.0 (Build 1)',
                      style: TextStyle(
                        fontSize: 11,
                        color: isDark ? AppColors.darkTextSecondary : const Color(0xFF94A3B8),
                      ),
                      overflow: TextOverflow.ellipsis,
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

  Widget _buildSectionHeader({
    required String id,
    required String title,
    required IconData icon,
    Color? headerColor,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isOpen = _openSections[id] ?? false;
    final color = headerColor ?? (isDark ? AppColors.darkTextSecondary : const Color(0xFF64748B));

    return InkWell(
      onTap: () => _toggleSection(id),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 7, horizontal: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, size: 15, color: color),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: color,
                  ),
                ),
              ],
            ),
            Icon(
              isOpen ? LucideIcons.chevronUp : LucideIcons.chevronDown,
              size: 14,
              color: color,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem({
    required String label,
    required IconData icon,
    required bool isActive,
    required VoidCallback onTap,
    Color? color,
    String? badge,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeBg = isDark ? const Color(0x30F65E1B) : const Color(0xFFFFEDD4);
    final activeText = const Color(0xFFF65E1B);
    final defaultText = color ?? (isDark ? AppColors.darkTextPrimary : const Color(0xFF434D5D));

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1.5),
      child: Material(
        color: isActive ? activeBg : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8.5),
            child: Row(
              children: [
                Icon(
                  icon,
                  size: 18,
                  color: isActive
                      ? activeText
                      : (color ?? (isDark ? AppColors.darkTextSecondary : const Color(0xFF8A94A6))),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                      color: isActive ? activeText : defaultText,
                    ),
                  ),
                ),
                if (badge != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 1.5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      badge,
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showInfoDialog(BuildContext context, String title, String content) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
        content: Text(
          content,
          style: TextStyle(
            fontSize: 13,
            height: 1.4,
            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Close',
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
