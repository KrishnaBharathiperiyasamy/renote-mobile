import 'package:flutter_test/flutter_test.dart';
import 'package:renote_mobile/models/plan_model.dart';
import 'package:renote_mobile/models/subscription_model.dart';
import 'package:renote_mobile/providers/subscription_provider.dart';

void main() {
  group('Phase 8 - Subscription and Payment Management Tests', () {
    test('PlanModel deserialization & features mapping', () {
      final json = {
        '_id': 'plan_starter_monthly',
        'name': 'Starter',
        'price': 499.0,
        'duration': 'monthly',
        'isActive': true,
        'features': {
          'maxFromCompanies': 2,
          'maxPostersPerMonth': 20,
          'maxPosterLinks': 10,
          'posterLinkExpiryDays': 30,
          'maxVideoUploadsPerMonth': 5,
          'maxVideoStorageMB': 250,
          'posterFrames': 150,
          'supportLevel': 'email',
          'unlimitedInvoices': true,
          'unlimitedEstimations': true,
          'unlimitedProducts': true,
          'unlimitedToCompanies': true,
          'unlimitedPosters': false,
        },
      };

      final plan = PlanModel.fromJson(json);

      expect(plan.id, 'plan_starter_monthly');
      expect(plan.name, 'Starter');
      expect(plan.price, 499.0);
      expect(plan.duration, 'monthly');
      expect(plan.slug, 'starter');
      expect(plan.features.maxPostersPerMonth, 20);
      expect(plan.features.maxFromCompanies, 2);
      expect(plan.features.maxVideoStorageMB, 250);
      expect(plan.features.supportLevel, 'email');
      expect(plan.features.unlimitedInvoices, isTrue);
    });

    test('SubscriptionModel deserialization from backend history', () {
      final json = {
        '_id': 'sub_1234567890',
        'userId': 'usr_999',
        'planId': {
          '_id': 'plan_pro_001',
          'name': 'Pro Business',
          'slug': 'pro',
          'price': 999.0,
          'features': {
            'maxFromCompanies': 5,
            'maxPostersPerMonth': 100,
            'unlimitedPosters': true,
            'maxVideoStorageMB': 1000,
            'supportLevel': 'priority',
          },
        },
        'status': 'active',
        'isActive': true,
        'startDate': '2026-11-01T00:00:00.000Z',
        'endDate': '2026-12-01T00:00:00.000Z',
        'renewalType': 'monthly',
        'razorpayPaymentId': 'pay_M123456789',
        'razorpaySubscriptionId': 'sub_M123456789',
      };

      final sub = SubscriptionModel.fromJson(json);

      expect(sub.id, 'sub_1234567890');
      expect(sub.planName, 'Pro Business');
      expect(sub.planSlug, 'pro');
      expect(sub.price, 999.0);
      expect(sub.status, 'active');
      expect(sub.isActive, isTrue);
      expect(sub.renewalType, 'monthly');
      expect(sub.razorpayPaymentId, 'pay_M123456789');
      expect(sub.features.unlimitedPosters, isTrue);
    });

    test('SubscriptionModel days remaining and expiration calculation', () {
      // Future subscription (e.g. 30 days ahead)
      final futureDate = DateTime.now().add(const Duration(days: 25)).toIso8601String();
      final activeSub = SubscriptionModel(
        id: '1',
        userId: 'u1',
        planName: 'Pro',
        planSlug: 'pro',
        endDate: futureDate,
        isActive: true,
      );
      expect(activeSub.isExpired, isFalse);
      expect(activeSub.daysRemaining, greaterThan(20));

      // Past subscription
      final pastDate = DateTime.now().subtract(const Duration(days: 5)).toIso8601String();
      final expiredSub = SubscriptionModel(
        id: '2',
        userId: 'u1',
        planName: 'Starter',
        planSlug: 'starter',
        endDate: pastDate,
        isActive: false,
      );
      expect(expiredSub.isExpired, isTrue);
      expect(expiredSub.daysRemaining, 0);
    });

    test('SubscriptionState plan filtering by billing cycle', () {
      final p1 = PlanModel(
        id: 'm1',
        name: 'Starter Monthly',
        price: 499,
        duration: 'monthly',
        slug: 'starter',
      );
      final p2 = PlanModel(
        id: 'a1',
        name: 'Starter Annual',
        price: 4990,
        duration: 'annually',
        slug: 'starter',
      );
      final p3 = PlanModel(
        id: 'b1',
        name: 'Enterprise Flex',
        price: 2499,
        duration: 'both',
        slug: 'enterprise',
      );

      final state = SubscriptionState(
        plans: [p1, p2, p3],
        billingCycle: 'monthly',
      );

      // Monthly cycle includes base Free Monthly + p1 + p3
      final monthlyPlans = state.displayedPlans;
      expect(monthlyPlans.length, 3);
      expect(monthlyPlans.any((p) => p.name == 'Free'), isTrue);
      expect(monthlyPlans.any((p) => p.name == 'Starter Monthly'), isTrue);
      expect(monthlyPlans.any((p) => p.name == 'Starter Annual'), isFalse);

      // Switch to Annually
      final annualState = state.copyWith(billingCycle: 'annually');
      final annualPlans = annualState.displayedPlans;
      expect(annualPlans.length, 3);
      expect(annualPlans.any((p) => p.name == 'Free'), isTrue);
      expect(annualPlans.any((p) => p.name == 'Starter Annual'), isTrue);
      expect(annualPlans.any((p) => p.name == 'Starter Monthly'), isFalse);
    });
  });
}

