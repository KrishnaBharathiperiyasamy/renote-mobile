import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/plan_model.dart';
import '../../../models/subscription_model.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/subscription_provider.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_header.dart';
import '../../../shared/widgets/brand_flame_logo.dart';

class SubscriptionManagementScreen extends ConsumerStatefulWidget {
  const SubscriptionManagementScreen({super.key});

  @override
  ConsumerState<SubscriptionManagementScreen> createState() =>
      _SubscriptionManagementScreenState();
}

class _SubscriptionManagementScreenState
    extends ConsumerState<SubscriptionManagementScreen> {
  final ScrollController _scrollController = ScrollController();
  int? _openFaqIndex;

  static const List<Map<String, String>> _faqs = [
    {
      'q': 'What happens when I hit my poster limit?',
      'a':
          'You will be notified and will not be able to create new posters until the next billing cycle. Existing posters remain accessible.',
    },
    {
      'q': 'Can I change plans later?',
      'a':
          'Yes! You can upgrade anytime. Cancel your current plan first, then subscribe to a new one.',
    },
    {
      'q': 'What is a poster link?',
      'a':
          'A shareable link that lets anyone view your poster publicly on the web. Each link has an expiry duration based on your active plan.',
    },
    {
      'q': 'Is there a free trial?',
      'a':
          'The Free plan is available forever with generous limits for invoices, quotations, and product cataloging. No credit card required.',
    },
  ];

  final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  void _scrollToPlans() {
    _scrollController.animateTo(
      320,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeInOut,
    );
  }

  void _confirmCancelSubscription() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(
          children: [
            Icon(LucideIcons.alertTriangle, color: AppColors.danger, size: 22),
            SizedBox(width: 8),
            Text(
              'Cancel Subscription?',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: const Text(
          'Are you sure you want to cancel your current subscription? You will retain access until the end of your current billing period.',
          style: TextStyle(
            fontSize: 13,
            color: AppColors.textSecondary,
            height: 1.4,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Keep My Plan'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final messenger = ScaffoldMessenger.of(context);
              final success = await ref
                  .read(subscriptionProvider.notifier)
                  .cancelActiveSubscription();
              if (success) {
                messenger.showSnackBar(
                  const SnackBar(
                    content: Text('Subscription cancelled successfully.'),
                    backgroundColor: AppColors.success,
                  ),
                );
              } else {
                final err = ref.read(subscriptionProvider).errorMessage;
                messenger.showSnackBar(
                  SnackBar(
                    content: Text(err ?? 'Failed to cancel subscription.'),
                    backgroundColor: AppColors.danger,
                  ),
                );
              }
            },
            child: const Text('Confirm Cancel'),
          ),
        ],
      ),
    );
  }

  void _openCheckoutSheet(PlanModel plan) {
    final subState = ref.read(subscriptionProvider);
    if (subState.hasActivePaidSubscription) {
      // Must cancel active subscription first according to backend
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Row(
            children: [
              Icon(LucideIcons.info, color: AppColors.primary, size: 22),
              SizedBox(width: 8),
              Text(
                'Active Plan Detected',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          content: Text(
            'You currently have an active ${subState.currentSubscription?.planName ?? "paid"} subscription. Please cancel your current subscription before subscribing to ${plan.name}.',
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.danger,
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.pop(ctx);
                _confirmCancelSubscription();
              },
              child: const Text('Cancel Current Plan'),
            ),
          ],
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _CheckoutModal(
        plan: plan,
        currencyFormat: _currencyFormat,
        onSubscribed: () {
          ref.read(subscriptionProvider.notifier).loadSubscriptionData();
        },
      ),
    );
  }

  void _showReceiptModal(SubscriptionModel sub) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const BrandFlameLogo(size: 28),
                const SizedBox(width: 10),
                Text(
                  'Tax Invoice & Receipt',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                  ),
                ),
                const Spacer(),
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
            Divider(
              height: 24,
              color: isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB),
            ),
            _buildReceiptRow('Plan Name', sub.planName, isDark),
            _buildReceiptRow(
              'Amount Paid',
              sub.price > 0 ? _currencyFormat.format(sub.price) : 'Free Tier',
              isDark,
            ),
            _buildReceiptRow('Billing Cycle', sub.billing.toUpperCase(), isDark),
            _buildReceiptRow('Status', sub.status.toUpperCase(), isDark),
            if (sub.startDate != null && sub.startDate!.length >= 10)
              _buildReceiptRow('Start Date', sub.startDate!.substring(0, 10), isDark),
            if (sub.endDate != null && sub.endDate!.length >= 10)
              _buildReceiptRow('Valid Until', sub.endDate!.substring(0, 10), isDark),
            if (sub.razorpayPaymentId != null)
              _buildReceiptRow('Razorpay Ref', sub.razorpayPaymentId!, isDark),
            const SizedBox(height: 20),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0x2016A34A) : Colors.green.shade50,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isDark ? const Color(0x4016A34A) : Colors.green.shade200,
                ),
              ),
              child: const Row(
                children: [
                  Icon(LucideIcons.checkCircle2, color: Colors.green, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Official Verified ReNote GST Tax Invoice',
                      style: TextStyle(
                        color: Colors.green,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subState = ref.watch(subscriptionProvider);
    final authState = ref.watch(authProvider);
    final user = authState.user;

    final selectedPlan = subState.selectedPlan;
    final showFloatingBuy =
        selectedPlan != null &&
        selectedPlan.slug != 'free' &&
        !subState.hasActivePaidSubscription;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : const Color(0xFFF9FAFB),
      appBar: const AppHeader(title: 'Plans & Billing'),
      drawer: const AppDrawer(),
      body: subState.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : RefreshIndicator(
              onRefresh: () =>
                  ref.read(subscriptionProvider.notifier).refresh(),
              color: AppColors.primary,
              child: SingleChildScrollView(
                controller: _scrollController,
                padding: EdgeInsets.fromLTRB(
                  16,
                  16,
                  16,
                  showFloatingBuy ? 90 : 32,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Mobile Top User Banner (Matches Next.js lines 334-350)
                    _buildUserBanner(user?.fullName ?? 'Valued Customer'),

                    const SizedBox(height: 16),

                    // 2. Active Subscription Card (if user has active paid subscription)
                    if (subState.hasActivePaidSubscription) ...[
                      _buildCurrentSubscriptionCard(subState),
                      const SizedBox(height: 20),
                    ],

                    // 3. Billing Toggle (Monthly vs Annually with ~17% off tag)
                    _buildBillingCycleToggle(subState, isDark),

                    const SizedBox(height: 20),

                    // 4. Plan Cards Carousel / List
                    ...subState.displayedPlans.map((plan) {
                      return _buildPlanCard(plan, subState, isDark);
                    }),

                    const SizedBox(height: 24),

                    // 5. Complete Feature Comparison Matrix
                    _buildComparisonMatrix(subState, isDark),

                    const SizedBox(height: 24),

                    // 6. Payment & Transaction History
                    _buildPaymentHistory(subState, isDark),

                    const SizedBox(height: 24),

                    // 7. Frequently Asked Questions (FAQ) Accordion
                    _buildFaqSection(isDark),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
      // Mobile Floating Bottom Buy Now Bar (Next.js lines 459-469)
      bottomNavigationBar: showFloatingBuy
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                    blurRadius: 10,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: SafeArea(
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => _openCheckoutSheet(selectedPlan),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: Text(
                      'Buy Now — ${_currencyFormat.format(selectedPlan.price)}',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            )
          : null,
    );
  }

  // ---------------------------------------------------------------------------
  // 1. Mobile Top User Banner (Orange gradient with subtle circles)
  // ---------------------------------------------------------------------------
  Widget _buildUserBanner(String userName) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFB923C), Color(0xFFF97316), Color(0xFFEA580C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative background circles
          Positioned(
            top: -20,
            left: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
          ),
          Positioned(
            bottom: -20,
            right: -20,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withValues(alpha: 0.1),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: Column(
              children: [
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFFED7AA),
                        width: 4,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 6,
                        ),
                      ],
                    ),
                    child: const Center(
                      child: Text('👨‍💻', style: TextStyle(fontSize: 28)),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  userName,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 2),
                const Text(
                  'Choose the right plan for you',
                  style: TextStyle(fontSize: 12, color: Colors.white),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 2. Current Active Subscription Card
  // ---------------------------------------------------------------------------
  Widget _buildCurrentSubscriptionCard(SubscriptionState subState) {
    final sub = subState.currentSubscription;
    final planName = sub?.planName ?? 'Active Plan';
    final daysRemaining = sub?.daysRemaining ?? 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.crown,
                      color: Colors.amber,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'CURRENT ACTIVE PLAN',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1,
                          color: Colors.white70,
                        ),
                      ),
                      Text(
                        planName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.green.shade600,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  sub?.status.toUpperCase() ?? 'ACTIVE',
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (sub?.endDate != null && sub!.endDate!.length >= 10)
            Text(
              'Valid until: ${sub.endDate!.substring(0, 10)} ($daysRemaining days remaining)',
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            )
          else
            const Text(
              'Unlimited GST invoices, estimations, and products active.',
              style: TextStyle(fontSize: 12, color: Colors.white70),
            ),
          const SizedBox(height: 14),
          Row(
            children: [
              OutlinedButton(
                onPressed: _confirmCancelSubscription,
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.redAccent),
                  foregroundColor: Colors.redAccent,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 8,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text(
                  'Cancel Subscription',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(width: 10),
              ElevatedButton(
                onPressed: _scrollToPlans,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text(
                  'Change Plan',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Billing Cycle Switcher Toggle (Monthly vs Annually with ~17% off)
  // ---------------------------------------------------------------------------
  Widget _buildBillingCycleToggle(SubscriptionState subState, bool isDark) {
    final isMonthly = subState.billingCycle == 'monthly';

    return Center(
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : const Color(0xFFE5E7EB),
          borderRadius: BorderRadius.circular(28),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            GestureDetector(
              onTap: () => ref
                  .read(subscriptionProvider.notifier)
                  .setBillingCycle('monthly'),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 9,
                ),
                decoration: BoxDecoration(
                  color: isMonthly ? (isDark ? AppColors.darkCard : Colors.white) : Colors.transparent,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: isMonthly
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                            blurRadius: 4,
                          ),
                        ]
                      : null,
                ),
                child: Text(
                  'Monthly',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isMonthly
                        ? AppColors.primary
                        : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                  ),
                ),
              ),
            ),
            GestureDetector(
              onTap: () => ref
                  .read(subscriptionProvider.notifier)
                  .setBillingCycle('annually'),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 9,
                ),
                decoration: BoxDecoration(
                  color: !isMonthly ? (isDark ? AppColors.darkCard : Colors.white) : Colors.transparent,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: !isMonthly
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                            blurRadius: 4,
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  children: [
                    Text(
                      'Annually',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: !isMonthly
                            ? AppColors.primary
                            : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF16A34A),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        '~17% off',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 4. Plan Card (Matches Next.js lines 369-434)
  // ---------------------------------------------------------------------------
  Widget _buildPlanCard(PlanModel plan, SubscriptionState subState, bool isDark) {
    final isSelected = subState.selectedPlan?.slug == plan.slug;
    final isFree = plan.slug == 'free';
    final isCurrentPaid =
        subState.currentSubscription != null &&
        subState.currentSubscription!.isActive &&
        subState.currentSubscription!.planSlug == plan.slug;
    final isCurrentFree = isFree && !subState.hasActivePaidSubscription;
    final isPopular = plan.popular || plan.slug == 'pro';

    final monthlyEquivalent = plan.duration == 'annually'
        ? (plan.price / 12).round()
        : plan.price.round();

    return GestureDetector(
      onTap: () {
        ref.read(subscriptionProvider.notifier).selectPlan(plan);
      },
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0x30F65E1B) : const Color(0xFFFFF7ED)) // Orange tint
              : (isDark ? AppColors.darkCard : Colors.white),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isPopular ? const Color(0xFFFED7AA) : (isDark ? AppColors.darkCardBorder : Colors.grey.shade200)),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Popular banner
            if (isPopular)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 5),
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
                ),
                child: const Text(
                  'MOST POPULAR CHOICE 🔥',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                    color: Colors.white,
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Text(
                            plan.name,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? AppColors.primary
                                  : (isDark ? AppColors.darkTextPrimary : AppColors.textPrimary),
                            ),
                          ),
                          if (isPopular && !isSelected) ...[
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 6,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'Popular',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          if (isFree)
                            Text(
                              'Free',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                              ),
                            )
                          else ...[
                            Text(
                              _currencyFormat.format(plan.price),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                              ),
                            ),
                            Text(
                              plan.duration == 'annually'
                                  ? 'per year'
                                  : 'per month',
                              style: TextStyle(
                                fontSize: 10,
                                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                              ),
                            ),
                            if (plan.duration == 'annually')
                              Text(
                                '≈ ₹$monthlyEquivalent/mo',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Color(0xFF16A34A),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                          ],
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  // Feature Checklist
                  _buildFeatureRow(
                    'Unlimited invoices',
                    plan.features.unlimitedInvoices,
                    isDark,
                  ),
                  _buildFeatureRow(
                    'Unlimited estimations',
                    plan.features.unlimitedEstimations,
                    isDark,
                  ),
                  _buildFeatureRow(
                    'Unlimited products',
                    plan.features.unlimitedProducts,
                    isDark,
                  ),
                  _buildFeatureRow(
                    'From Companies: ${plan.features.maxFromCompanies}',
                    true,
                    isDark,
                  ),
                  _buildFeatureRow(
                    'To Companies: ${plan.features.unlimitedToCompanies ? "Unlimited" : "Limited"}',
                    true,
                    isDark,
                  ),
                  _buildFeatureRow(
                    plan.features.unlimitedPosters
                        ? 'Posters / month: Unlimited'
                        : 'Posters / month: ${plan.features.maxPostersPerMonth}',
                    true,
                    isDark,
                  ),
                  _buildFeatureRow(
                    plan.features.unlimitedPosterLinks
                        ? 'Poster Links: Unlimited'
                        : 'Poster Links: ${plan.features.maxPosterLinks}',
                    true,
                    isDark,
                  ),
                  _buildFeatureRow(
                    'Link Expiry: ${plan.features.posterLinkExpiryDays} days',
                    true,
                    isDark,
                  ),
                  _buildFeatureRow(
                    plan.features.unlimitedVideoUploads
                        ? 'Video Uploads / month: Unlimited'
                        : 'Video Uploads / month: ${plan.features.maxVideoUploadsPerMonth}',
                    true,
                    isDark,
                  ),
                  _buildFeatureRow(
                    'Total Video Storage: ${plan.features.maxVideoStorageMB} MB',
                    true,
                    isDark,
                  ),
                  _buildFeatureRow(
                    'Poster Frames: All ${plan.features.posterFrames}',
                    true,
                    isDark,
                  ),
                  _buildFeatureRow(
                    'Support: ${plan.features.supportLevel == "none" ? "—" : plan.features.supportLevel.toUpperCase()}',
                    plan.features.supportLevel != 'none',
                    isDark,
                  ),

                  const SizedBox(height: 16),

                  // Action Button
                  if (isCurrentPaid) ...[
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton(
                        onPressed: _confirmCancelSubscription,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.danger,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text(
                          'Cancel Subscription',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ] else if (isCurrentFree) ...[
                    Container(
                      width: double.infinity,
                      height: 44,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF272A35) : const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? AppColors.darkCardBorder : Colors.grey.shade300,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          'Current Plan',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  ] else ...[
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton(
                        onPressed: subState.isProcessing
                            ? null
                            : () => _openCheckoutSheet(plan),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isPopular
                              ? AppColors.primary
                              : (isDark ? const Color(0xFF272A35) : const Color(0xFF1E293B)),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Buy Now — ${_currencyFormat.format(plan.price)}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureRow(String text, bool active, bool isDark) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3.5),
      child: Row(
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: active
                  ? (isDark ? const Color(0x30FFEDD5) : const Color(0xFFFFEDD5))
                  : (isDark ? const Color(0x20FFFFFF) : Colors.grey.withValues(alpha: 0.1)),
              shape: BoxShape.circle,
            ),
            child: Icon(
              active ? LucideIcons.check : LucideIcons.x,
              size: 11,
              color: active ? AppColors.primary : (isDark ? AppColors.darkTextSecondary : Colors.grey),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                color: active
                    ? (isDark ? AppColors.darkTextPrimary : const Color(0xFF374151))
                    : (isDark ? AppColors.darkTextSecondary : const Color(0xFF9CA3AF)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Complete Feature Comparison Matrix (Next.js lines 562-602)
  // ---------------------------------------------------------------------------
  Widget _buildComparisonMatrix(SubscriptionState subState, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Feature Comparison',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          _buildMatrixHeader(),
          Divider(
            height: 16,
            color: isDark ? AppColors.darkCardBorder : const Color(0xFFE5E7EB),
          ),
          _buildMatrixRow('Invoices', 'Unlimited', 'Unlimited', 'Unlimited', isDark),
          _buildMatrixRow('Estimations', 'Unlimited', 'Unlimited', 'Unlimited', isDark),
          _buildMatrixRow('Products', 'Unlimited', 'Unlimited', 'Unlimited', isDark),
          _buildMatrixRow('From Companies', '1', '2', '5', isDark),
          _buildMatrixRow('Posters / mo', '5', '20', '100', isDark),
          _buildMatrixRow('Poster Links', '3', '10', '50', isDark),
          _buildMatrixRow('Link Expiry', '7 days', '30 days', '90 days', isDark),
          _buildMatrixRow('Video Uploads', '1 / mo', '5 / mo', '20 / mo', isDark),
          _buildMatrixRow('Video Storage', '75 MB', '250 MB', '1024 MB', isDark),
          _buildMatrixRow('Poster Frames', '50', '100', '250', isDark),
          _buildMatrixRow('Support', '—', 'Email', 'Priority', isDark),
        ],
      ),
    );
  }

  Widget _buildMatrixHeader() {
    return const Row(
      children: [
        Expanded(
          flex: 4,
          child: Text(
            'Feature',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        Expanded(
          flex: 2,
          child: Text(
            'Free',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        Expanded(
          flex: 2,
          child: Text(
            'Starter',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
            ),
          ),
        ),
        Expanded(
          flex: 2,
          child: Text(
            'Pro ★',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMatrixRow(
    String feature,
    String free,
    String starter,
    String pro,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Expanded(
            flex: 4,
            child: Text(
              feature,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              free,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              starter,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              pro,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 6. Payment & Transaction History
  // ---------------------------------------------------------------------------
  Widget _buildPaymentHistory(SubscriptionState subState, bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Transaction History',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
              Text(
                '${subState.history.length} records',
                style: TextStyle(
                  fontSize: 11,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (subState.history.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Center(
                child: Text(
                  'No payment transactions recorded yet.',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                ),
              ),
            )
          else
            ...subState.history.map((record) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E232E) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          record.planName,
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          record.startDate?.substring(0, 10) ?? 'Recent',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: record.isActive
                                ? Colors.green.shade100
                                : (isDark ? const Color(0xFF2A2E39) : Colors.grey.shade200),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            record.status.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: record.isActive
                                  ? Colors.green.shade800
                                  : (isDark ? Colors.white70 : Colors.grey.shade700),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          icon: const Icon(
                            LucideIcons.receipt,
                            size: 16,
                            color: AppColors.primary,
                          ),
                          onPressed: () => _showReceiptModal(record),
                          tooltip: 'View Receipt',
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // 7. Frequently Asked Questions (FAQ) Accordion
  // ---------------------------------------------------------------------------
  Widget _buildFaqSection(bool isDark) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Frequently Asked Questions',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 10),
          ..._faqs.asMap().entries.map((entry) {
            final idx = entry.key;
            final faq = entry.value;
            final isOpen = _openFaqIndex == idx;

            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
                ),
              ),
              child: Column(
                children: [
                  InkWell(
                    onTap: () {
                      setState(() {
                        _openFaqIndex = isOpen ? null : idx;
                      });
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              faq['q']!,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                              ),
                            ),
                          ),
                          Icon(
                            isOpen ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                            size: 18,
                            color: isDark ? AppColors.darkTextSecondary : Colors.grey.shade500,
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (isOpen)
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 0, 14, 14),
                      child: Text(
                        faq['a']!,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// Interactive Secure Checkout Modal
// -----------------------------------------------------------------------------
class _CheckoutModal extends ConsumerStatefulWidget {
  final PlanModel plan;
  final NumberFormat currencyFormat;
  final VoidCallback onSubscribed;

  const _CheckoutModal({
    required this.plan,
    required this.currencyFormat,
    required this.onSubscribed,
  });

  @override
  ConsumerState<_CheckoutModal> createState() => _CheckoutModalState();
}

class _CheckoutModalState extends ConsumerState<_CheckoutModal> {
  bool _isProcessing = false;
  String? _error;

  Future<void> _handlePayment() async {
    setState(() {
      _isProcessing = true;
      _error = null;
    });

    try {
      final notifier = ref.read(subscriptionProvider.notifier);
      final success = await notifier.subscribeToPlan(widget.plan);

      if (success && mounted) {
        widget.onSubscribed();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '🎉 Successfully subscribed to ${widget.plan.name} Plan!',
            ),
            backgroundColor: AppColors.success,
          ),
        );
      } else if (mounted) {
        final err = ref.read(subscriptionProvider).errorMessage;
        setState(() {
          _error = err ?? 'Payment failed. Please try again.';
          _isProcessing = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isProcessing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        16,
        20,
        MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Modal Title
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  BrandFlameLogo(size: 24),
                  SizedBox(width: 8),
                  Text(
                    'ReNote Secure Checkout',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(LucideIcons.x, size: 20),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const Divider(height: 20),

          // Order Summary Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${widget.plan.name} Plan',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        widget.plan.duration.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Subscription Price',
                      style: TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Text(
                      widget.currencyFormat.format(widget.plan.price),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'GST (18% included)',
                      style: TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                    Text(
                      'Included',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.green,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total Amount Payable',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      widget.currencyFormat.format(widget.plan.price),
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Security Badges
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.green.shade200),
            ),
            child: const Row(
              children: [
                Icon(LucideIcons.shieldCheck, color: Colors.green, size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '256-bit SSL encrypted • Instant Activation',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.green,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),

          if (_error != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Text(
                _error!,
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
          ],

          const SizedBox(height: 20),

          // Pay Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: _isProcessing ? null : _handlePayment,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 2,
              ),
              child: _isProcessing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Pay & Activate — ${widget.currencyFormat.format(widget.plan.price)}',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
