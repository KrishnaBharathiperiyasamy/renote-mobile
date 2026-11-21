import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:renote_mobile/models/plan_model.dart';
import 'package:renote_mobile/models/subscription_model.dart';
import 'package:renote_mobile/providers/subscription_provider.dart';
import 'package:renote_mobile/features/subscriptions/screens/subscription_management_screen.dart';

class _TestSubscriptionNotifier extends SubscriptionNotifier {
  final SubscriptionState _initialState;
  _TestSubscriptionNotifier(this._initialState);

  @override
  SubscriptionState build() => _initialState;

  @override
  Future<void> loadSubscriptionData() async {}
}

void main() {
  group('Module 8: PlanModel & SubscriptionModel Tests', () {
    test('PlanModel deserializes correctly and assigns popular badge', () {
      final json = {
        '_id': 'plan_starter_1',
        'name': 'Starter',
        'price': 199,
        'duration': 'monthly',
        'isActive': true,
        'features': {
          'maxFromCompanies': 2,
          'maxPostersPerMonth': 20,
          'maxPosterLinks': 10,
          'posterLinkExpiryDays': 30,
          'maxVideoUploadsPerMonth': 5,
          'maxVideoStorageMB': 250,
          'posterFrames': 100,
          'supportLevel': 'email',
          'unlimitedInvoices': true,
        },
      };

      final plan = PlanModel.fromJson(json);
      expect(plan.id, equals('plan_starter_1'));
      expect(plan.name, equals('Starter'));
      expect(plan.slug, equals('starter'));
      expect(plan.price, equals(199.0));
      expect(plan.duration, equals('monthly'));
      expect(plan.features.maxFromCompanies, equals(2));
      expect(plan.features.supportLevel, equals('email'));
      expect(plan.popular, isFalse);

      final proJson = {
        '_id': 'plan_pro_1',
        'name': 'Pro',
        'price': 349,
        'duration': 'monthly',
      };
      final proPlan = PlanModel.fromJson(proJson);
      expect(proPlan.slug, equals('pro'));
      expect(proPlan.popular, isTrue); // Pro is automatically popular
    });

    test('SubscriptionModel calculates daysRemaining and isExpired accurately', () {
      final futureDate = DateTime.now().add(const Duration(days: 20)).toIso8601String();
      final activeSub = SubscriptionModel(
        id: 'sub_123',
        userId: 'user_456',
        planName: 'Pro',
        planSlug: 'pro',
        price: 349,
        status: 'active',
        isActive: true,
        endDate: futureDate,
      );

      expect(activeSub.isExpired, isFalse);
      expect(activeSub.daysRemaining, inInclusiveRange(19, 21));

      final pastDate = DateTime.now().subtract(const Duration(days: 5)).toIso8601String();
      final expiredSub = SubscriptionModel(
        id: 'sub_past',
        userId: 'user_456',
        planName: 'Starter',
        planSlug: 'starter',
        price: 199,
        status: 'expired',
        isActive: false,
        endDate: pastDate,
      );

      expect(expiredSub.isExpired, isTrue);
      expect(expiredSub.daysRemaining, equals(0));
    });
  });

  group('Module 8: SubscriptionState & Provider Tests', () {
    test('displayedPlans returns Free and sorted plans for selected cycle', () {
      final stateMonthly = SubscriptionState(
        billingCycle: 'monthly',
        plans: PlanModel.defaultMonthlyPlans,
      );

      expect(stateMonthly.displayedPlans.length, equals(4));
      expect(stateMonthly.displayedPlans[0].slug, equals('free'));
      expect(stateMonthly.displayedPlans[1].slug, equals('starter'));
      expect(stateMonthly.displayedPlans[2].slug, equals('pro'));
      expect(stateMonthly.displayedPlans[3].slug, equals('business'));

      final stateAnnually = SubscriptionState(
        billingCycle: 'annually',
        plans: PlanModel.defaultAnnuallyPlans,
      );

      expect(stateAnnually.displayedPlans.length, equals(4));
      expect(stateAnnually.displayedPlans[0].slug, equals('free'));
      expect(stateAnnually.displayedPlans[1].price, equals(1999));
      expect(stateAnnually.displayedPlans[2].price, equals(3499));
      expect(stateAnnually.displayedPlans[3].price, equals(4999));
    });

    test('hasActivePaidSubscription reflects planSlug and expiration', () {
      final freeState = SubscriptionState(
        currentSubscription: const SubscriptionModel(
          id: 'free_sub',
          userId: 'u1',
          planName: 'Free',
          planSlug: 'free',
          isActive: true,
        ),
      );
      expect(freeState.hasActivePaidSubscription, isFalse);

      final paidState = SubscriptionState(
        currentSubscription: SubscriptionModel(
          id: 'paid_sub',
          userId: 'u1',
          planName: 'Pro',
          planSlug: 'pro',
          isActive: true,
          endDate: DateTime.now().add(const Duration(days: 15)).toIso8601String(),
        ),
      );
      expect(paidState.hasActivePaidSubscription, isTrue);
    });
  });

  group('Module 8: SubscriptionManagementScreen Widget Tests', () {
    testWidgets('renders user banner, billing toggle, plan cards, comparison matrix, and FAQ',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final initialState = SubscriptionState(
        isLoading: false,
        billingCycle: 'monthly',
        plans: PlanModel.defaultMonthlyPlans,
        selectedPlan: PlanModel.proMonthly,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionProvider.overrideWith(
              () => _TestSubscriptionNotifier(initialState),
            ),
          ],
          child: const MaterialApp(
            home: SubscriptionManagementScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // 1. User Banner
      expect(find.text('Choose the right plan for you'), findsOneWidget);

      // 2. Billing Toggle
      expect(find.text('Monthly'), findsOneWidget);
      expect(find.text('Annually'), findsOneWidget);
      expect(find.text('~17% off'), findsOneWidget);

      // 3. Plan Cards
      expect(find.text('Free'), findsWidgets);
      expect(find.text('Starter'), findsWidgets);
      expect(find.text('Pro'), findsWidgets);
      expect(find.text('Business'), findsWidgets);

      // 4. Feature Comparison Matrix
      expect(find.text('Feature Comparison'), findsOneWidget);

      // 5. Frequently Asked Questions
      expect(find.text('Frequently Asked Questions'), findsOneWidget);
      expect(find.text('What happens when I hit my poster limit?'), findsOneWidget);
      expect(find.text('Can I change plans later?'), findsOneWidget);
    });

    testWidgets('Tapping Annually switches billing cycle and displays annual prices',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final initialState = SubscriptionState(
        isLoading: false,
        billingCycle: 'monthly',
        plans: [
          ...PlanModel.defaultMonthlyPlans,
          ...PlanModel.defaultAnnuallyPlans,
        ],
        selectedPlan: PlanModel.proMonthly,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionProvider.overrideWith(
              () => _TestSubscriptionNotifier(initialState),
            ),
          ],
          child: const MaterialApp(
            home: SubscriptionManagementScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap on 'Annually' toggle
      await tester.tap(find.text('Annually'));
      await tester.pumpAndSettle();

      // Verify annual indicators
      expect(find.text('per year'), findsWidgets);
      expect(find.text('≈ ₹167/mo'), findsOneWidget);
    });

    testWidgets('Tapping FAQ item expands and shows answer', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final initialState = SubscriptionState(
        isLoading: false,
        billingCycle: 'monthly',
        plans: PlanModel.defaultMonthlyPlans,
        selectedPlan: PlanModel.proMonthly,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionProvider.overrideWith(
              () => _TestSubscriptionNotifier(initialState),
            ),
          ],
          child: const MaterialApp(
            home: SubscriptionManagementScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap on first FAQ question
      final faqQuestion = find.text('What happens when I hit my poster limit?');
      await tester.scrollUntilVisible(faqQuestion, 300);
      await tester.tap(faqQuestion);
      await tester.pumpAndSettle();

      // Answer should now be visible
      expect(
        find.textContaining('You will be notified and will not be able to create new posters'),
        findsOneWidget,
      );
    });

    testWidgets('Renders Active Subscription banner when user has active paid plan',
        (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final activeSub = SubscriptionModel(
        id: 'sub_live_99',
        userId: 'u_1',
        planName: 'Pro',
        planSlug: 'pro',
        price: 349,
        status: 'active',
        isActive: true,
        endDate: DateTime.now().add(const Duration(days: 28)).toIso8601String(),
      );

      final initialState = SubscriptionState(
        isLoading: false,
        billingCycle: 'monthly',
        currentSubscription: activeSub,
        plans: PlanModel.defaultMonthlyPlans,
        selectedPlan: PlanModel.proMonthly,
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            subscriptionProvider.overrideWith(
              () => _TestSubscriptionNotifier(initialState),
            ),
          ],
          child: const MaterialApp(
            home: SubscriptionManagementScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Current Active Plan card check
      expect(find.text('CURRENT ACTIVE PLAN'), findsOneWidget);
      expect(find.text('ACTIVE'), findsWidgets);
      expect(find.text('Cancel Subscription'), findsWidgets);
    });
  });
}
