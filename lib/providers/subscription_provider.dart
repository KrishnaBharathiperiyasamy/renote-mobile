import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/plan_model.dart';
import '../models/subscription_model.dart';
import '../services/api_service.dart';

class SubscriptionState {
  final bool isLoading;
  final bool isProcessing;
  final List<PlanModel> plans;
  final String billingCycle; // 'monthly' | 'annually'
  final SubscriptionModel? currentSubscription;
  final List<SubscriptionModel> history;
  final PlanModel? selectedPlan;
  final String? purchasingPlanSlug;
  final String? errorMessage;
  final String? successMessage;

  SubscriptionState({
    this.isLoading = false,
    this.isProcessing = false,
    this.plans = const [],
    this.billingCycle = 'monthly',
    this.currentSubscription,
    this.history = const [],
    this.selectedPlan,
    this.purchasingPlanSlug,
    this.errorMessage,
    this.successMessage,
  });

  List<PlanModel> get displayedPlans {
    final baseFree = billingCycle == 'annually'
        ? PlanModel.freeAnnually
        : PlanModel.freeMonthly;

    var filtered = plans.where((p) {
      if (p.slug == 'free') return false;
      return p.duration == billingCycle || p.duration == 'both';
    }).toList();

    if (filtered.isEmpty) {
      filtered = billingCycle == 'annually'
          ? [
              PlanModel.starterAnnually,
              PlanModel.proAnnually,
              PlanModel.businessAnnually,
            ]
          : [
              PlanModel.starterMonthly,
              PlanModel.proMonthly,
              PlanModel.businessMonthly,
            ];
    } else {
      // Sort in canonical order: starter, pro, business
      final order = {'starter': 1, 'pro': 2, 'business': 3};
      filtered.sort((a, b) {
        final ordA = order[a.slug.toLowerCase()] ?? 99;
        final ordB = order[b.slug.toLowerCase()] ?? 99;
        return ordA.compareTo(ordB);
      });
    }

    return [baseFree, ...filtered];
  }

  bool get hasActivePaidSubscription {
    if (currentSubscription == null) return false;
    return currentSubscription!.isActive &&
        currentSubscription!.planSlug != 'free' &&
        !currentSubscription!.isExpired;
  }

  SubscriptionState copyWith({
    bool? isLoading,
    bool? isProcessing,
    List<PlanModel>? plans,
    String? billingCycle,
    SubscriptionModel? currentSubscription,
    bool clearCurrentSubscription = false,
    List<SubscriptionModel>? history,
    PlanModel? selectedPlan,
    bool clearSelectedPlan = false,
    String? purchasingPlanSlug,
    bool clearPurchasingSlug = false,
    String? errorMessage,
    bool clearError = false,
    String? successMessage,
    bool clearSuccess = false,
  }) {
    return SubscriptionState(
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      plans: plans ?? this.plans,
      billingCycle: billingCycle ?? this.billingCycle,
      currentSubscription: clearCurrentSubscription
          ? null
          : (currentSubscription ?? this.currentSubscription),
      history: history ?? this.history,
      selectedPlan: clearSelectedPlan
          ? null
          : (selectedPlan ?? this.selectedPlan),
      purchasingPlanSlug: clearPurchasingSlug
          ? null
          : (purchasingPlanSlug ?? this.purchasingPlanSlug),
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      successMessage:
          clearSuccess ? null : (successMessage ?? this.successMessage),
    );
  }
}

class SubscriptionNotifier extends Notifier<SubscriptionState> {
  final ApiService _apiService = ApiService();

  @override
  SubscriptionState build() {
    Future.microtask(() => loadSubscriptionData());
    return SubscriptionState();
  }

  Future<void> loadSubscriptionData() async {
    if (state.isLoading) return;
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final results = await Future.wait([
        _apiService.fetchPlans(),
        _apiService.fetchSubscriptionHistory(),
      ]);

      var fetchedPlans = results[0] as List<PlanModel>;
      final historyMap = results[1] as Map<String, dynamic>;

      final currentSub = historyMap['currentPlan'] as SubscriptionModel?;
      final historyList =
          (historyMap['subscriptions'] as List?)?.cast<SubscriptionModel>() ??
          [];

      // Inject free plans if missing
      final hasFreeMonthly = fetchedPlans.any(
        (p) => p.slug == 'free' && p.duration == 'monthly',
      );
      final hasFreeAnnually = fetchedPlans.any(
        (p) => p.slug == 'free' && p.duration == 'annually',
      );

      final combined = <PlanModel>[];
      if (!hasFreeMonthly) combined.add(PlanModel.freeMonthly);
      if (!hasFreeAnnually) combined.add(PlanModel.freeAnnually);
      combined.addAll(fetchedPlans);

      // Fallback if empty
      if (combined.length <= 2) {
        combined.addAll([
          PlanModel.starterMonthly,
          PlanModel.proMonthly,
          PlanModel.businessMonthly,
          PlanModel.starterAnnually,
          PlanModel.proAnnually,
          PlanModel.businessAnnually,
        ]);
      }

      // Determine initial selected plan
      PlanModel? initialSelected;
      if (currentSub != null && currentSub.planSlug != 'free') {
        initialSelected = combined.firstWhere(
          (p) =>
              (p.id == currentSub.planId || p.slug == currentSub.planSlug) &&
              p.duration == state.billingCycle,
          orElse: () => combined.firstWhere(
            (p) => p.slug == currentSub.planSlug,
            orElse: () => PlanModel.proMonthly,
          ),
        );
      } else {
        // Default to Pro plan as in Next.js
        initialSelected = combined.firstWhere(
          (p) => p.slug == 'pro' && p.duration == state.billingCycle,
          orElse: () => PlanModel.proMonthly,
        );
      }

      state = state.copyWith(
        isLoading: false,
        plans: combined,
        currentSubscription: currentSub,
        history: historyList,
        selectedPlan: state.selectedPlan ?? initialSelected,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'Failed to load subscription data: $e',
      );
    }
  }

  void setBillingCycle(String cycle) {
    if (state.billingCycle != cycle) {
      // Find counterpart of currently selected plan in the new cycle
      PlanModel? counterpart;
      if (state.selectedPlan != null) {
        final currentSlug = state.selectedPlan!.slug;
        counterpart = state.plans.firstWhere(
          (p) => p.slug == currentSlug && p.duration == cycle,
          orElse: () => cycle == 'annually'
              ? PlanModel.proAnnually
              : PlanModel.proMonthly,
        );
      }
      state = state.copyWith(
        billingCycle: cycle,
        selectedPlan: counterpart ?? state.selectedPlan,
      );
    }
  }

  void selectPlan(PlanModel plan) {
    state = state.copyWith(selectedPlan: plan);
  }

  Future<bool> subscribeToPlan(PlanModel plan) async {
    if (plan.slug == 'free') {
      state = state.copyWith(
        successMessage: 'You are on the Free Plan.',
        clearError: true,
      );
      return true;
    }

    state = state.copyWith(
      isProcessing: true,
      purchasingPlanSlug: plan.slug,
      clearError: true,
      clearSuccess: true,
    );

    try {
      final newSub = await _apiService.createSubscription(plan.id);
      if (newSub != null) {
        await loadSubscriptionData();
        state = state.copyWith(
          isProcessing: false,
          clearPurchasingSlug: true,
          successMessage: 'Successfully subscribed to ${plan.name} Plan!',
        );
        return true;
      } else {
        state = state.copyWith(
          isProcessing: false,
          clearPurchasingSlug: true,
          errorMessage:
              'Could not activate subscription. If you have an active plan, please cancel it first.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        clearPurchasingSlug: true,
        errorMessage: 'Subscription error: $e',
      );
      return false;
    }
  }

  Future<bool> verifyAndActivatePayment({
    required PlanModel plan,
    required String paymentId,
    required String subscriptionId,
    required String signature,
  }) async {
    state = state.copyWith(
      isProcessing: true,
      purchasingPlanSlug: plan.slug,
      clearError: true,
      clearSuccess: true,
    );

    try {
      final success = await _apiService.verifyRazorpayPayment(
        planId: plan.id,
        paymentId: paymentId,
        subscriptionId: subscriptionId,
        signature: signature,
      );

      if (success) {
        await loadSubscriptionData();
        state = state.copyWith(
          isProcessing: false,
          clearPurchasingSlug: true,
          successMessage: 'Payment verified! ${plan.name} Plan activated.',
        );
        return true;
      } else {
        state = state.copyWith(
          isProcessing: false,
          clearPurchasingSlug: true,
          errorMessage: 'Payment verification failed with server.',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        clearPurchasingSlug: true,
        errorMessage: 'Payment verification error: $e',
      );
      return false;
    }
  }

  Future<bool> cancelActiveSubscription() async {
    state = state.copyWith(
      isProcessing: true,
      clearError: true,
      clearSuccess: true,
    );

    try {
      final ok = await _apiService.cancelSubscription();
      if (ok) {
        await loadSubscriptionData();
        state = state.copyWith(
          isProcessing: false,
          successMessage: 'Subscription cancelled successfully.',
        );
        return true;
      }
      state = state.copyWith(
        isProcessing: false,
        errorMessage: 'Failed to cancel subscription.',
      );
      return false;
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        errorMessage: 'Cancellation error: $e',
      );
      return false;
    }
  }

  void clearMessages() {
    state = state.copyWith(clearError: true, clearSuccess: true);
  }

  Future<void> refresh() async {
    await loadSubscriptionData();
  }
}

final subscriptionProvider =
    NotifierProvider<SubscriptionNotifier, SubscriptionState>(
      SubscriptionNotifier.new,
    );
