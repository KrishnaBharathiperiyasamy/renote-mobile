import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import '../../features/authentication/screens/login_screen.dart';
import '../../features/dashboard/screens/dashboard_screen.dart';
import '../../features/quotations/screens/quotations_screen.dart';
import '../../features/quotations/screens/create_quotation_screen.dart';
import '../../features/invoices/screens/invoices_screen.dart';
import '../../features/invoices/screens/create_invoice_screen.dart';
import '../../features/posters/screens/posters_screen.dart';
import '../../features/posters/screens/poster_editor_screen.dart';
import '../../features/products/screens/products_screen.dart';
import '../../models/poster_model.dart';
import '../../models/quotation_model.dart';
import '../../models/invoice_model.dart';
import '../../models/marketplace_item_model.dart';
import '../../features/marketplace/screens/marketplace_screen.dart';
import '../../features/marketplace/screens/product_details_screen.dart';
import '../../features/marketplace/screens/add_product_screen.dart';
import '../../features/customers/screens/customers_screen.dart';
import '../../features/profile/screens/settings_screen.dart';
import '../../features/subscriptions/screens/subscription_management_screen.dart';
import '../../shared/widgets/main_shell_scaffold.dart';

class AppRouter {
  AppRouter._();

  static final GoRouter router = GoRouter(
    initialLocation: '/dashboard',
    routes: [
      GoRoute(path: '/', redirect: (context, state) => '/dashboard'),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/register',
        builder: (context, state) => const LoginScreen(initialIsLoginMode: false),
      ),
      GoRoute(
        path: '/marketplace/details',
        builder: (context, state) {
          final item = state.extra as MarketplaceItemModel;
          return ProductDetailsScreen(item: item);
        },
      ),
      GoRoute(
        path: '/marketplace/add',
        builder: (context, state) => const AddProductScreen(),
      ),
      GoRoute(
        path: '/quotations/create',
        builder: (context, state) {
          final quotation = state.extra as QuotationModel?;
          return CreateQuotationScreen(initialQuotation: quotation);
        },
      ),
      GoRoute(
        path: '/estimations',
        redirect: (context, state) => '/quotations',
      ),
      GoRoute(
        path: '/estimations/create',
        redirect: (context, state) => '/quotations/create',
      ),
      GoRoute(
        path: '/invoices/create',
        builder: (context, state) {
          final invoice = state.extra as InvoiceModel?;
          return CreateInvoiceScreen(initialInvoice: invoice);
        },
      ),
      GoRoute(
        path: '/posters/editor',
        builder: (context, state) {
          final poster = state.extra as PosterModel?;
          return PosterEditorScreen(initialPoster: poster);
        },
      ),
      GoRoute(path: '/companies', redirect: (context, state) => '/settings'),
      GoRoute(
        path: '/subscriptions',
        redirect: (context, state) => '/subscription',
      ),

      // ── Persistent Shell for Main Application Pages ──
      ShellRoute(
        builder: (context, state, child) {
          return MainShellScaffold(
            currentUri: state.uri,
            child: child,
          );
        },
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/quotations',
            builder: (context, state) => const QuotationsScreen(),
          ),
          GoRoute(
            path: '/invoices',
            builder: (context, state) => const InvoicesScreen(),
          ),
          GoRoute(
            path: '/posters',
            builder: (context, state) {
              final tab = state.uri.queryParameters['tab'];
              final initialIndex = (tab == 'links' || tab == 'saved') ? 1 : 0;
              return PostersScreen(
                key: ValueKey('posters_$initialIndex'),
                initialTabIndex: initialIndex,
              );
            },
          ),
          GoRoute(
            path: '/products',
            builder: (context, state) => const ProductsScreen(),
          ),
          GoRoute(
            path: '/marketplace',
            builder: (context, state) => const MarketplaceScreen(),
          ),
          GoRoute(
            path: '/customers',
            builder: (context, state) => const CustomersScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
          GoRoute(
            path: '/subscription',
            builder: (context, state) => const SubscriptionManagementScreen(),
          ),
        ],
      ),
    ],
  );
}
