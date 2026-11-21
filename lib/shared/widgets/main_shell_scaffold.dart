import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../core/constants/app_colors.dart';
import 'app_drawer.dart';

/// Centralized, persistent shell scaffold for all main application pages.
/// Houses the global 7-option icon-only [BottomNavigationBar] and ensures
/// persistent navigation across Dashboard, Quotations, Invoices, Poster Studio,
/// Product Warehouse, Marketplace, and My Poster Links.
class MainShellScaffold extends StatelessWidget {
  final Widget child;
  final Uri? currentUri;

  const MainShellScaffold({
    super.key,
    required this.child,
    this.currentUri,
  });

  /// Maps the current route URI to the active bottom navigation bar index.
  /// 0: Home (/dashboard)
  /// 1: Quotes (/quotations, /estimations)
  /// 2: Invoices (/invoices)
  /// 3: Posters (/posters, when tab != 'links' and tab != 'saved')
  /// 4: Product Warehouse (/products)
  /// 5: Marketplace (/marketplace)
  /// 6: My Poster Links (/posters?tab=links or /posters?tab=saved)
  /// -1: Secondary shell pages (e.g., /customers, /settings, /subscription)
  static int calculateIndex(Uri uri) {
    final path = uri.path;
    if (path.startsWith('/quotations') || path.startsWith('/estimations')) return 1;
    if (path.startsWith('/invoices')) return 2;
    if (path.startsWith('/products')) return 4;
    if (path.startsWith('/marketplace')) return 5;
    if (path.startsWith('/posters')) {
      final tab = uri.queryParameters['tab'];
      if (tab == 'links' || tab == 'saved') {
        return 6;
      }
      return 3;
    }
    if (path.startsWith('/dashboard') || path == '/') return 0;
    return -1;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go('/dashboard');
        break;
      case 1:
        context.go('/quotations');
        break;
      case 2:
        context.go('/invoices');
        break;
      case 3:
        context.go('/posters');
        break;
      case 4:
        context.go('/products');
        break;
      case 5:
        context.go('/marketplace');
        break;
      case 6:
        context.go('/posters?tab=links');
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final uri = currentUri ?? GoRouterState.of(context).uri;
    final activeIndex = calculateIndex(uri);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isTabActive = activeIndex >= 0;

    return Scaffold(
      drawer: const AppDrawer(),
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: isTabActive ? activeIndex : 0,
        onTap: (index) => _onTap(context, index),
        type: BottomNavigationBarType.fixed,
        showSelectedLabels: false,
        showUnselectedLabels: false,
        backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
        selectedItemColor: isTabActive
            ? AppColors.primary
            : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
        unselectedItemColor: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
        iconSize: 22,
        elevation: 8,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.home),
            tooltip: 'Home',
            label: '',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.fileText),
            tooltip: 'Quotes',
            label: '',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.receipt),
            tooltip: 'Invoices',
            label: '',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.palette),
            tooltip: 'Posters',
            label: '',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.package),
            tooltip: 'Product Warehouse',
            label: '',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.store),
            tooltip: 'Marketplace',
            label: '',
          ),
          BottomNavigationBarItem(
            icon: Icon(LucideIcons.link2),
            tooltip: 'My Poster Links',
            label: '',
          ),
        ],
      ),
    );
  }
}
