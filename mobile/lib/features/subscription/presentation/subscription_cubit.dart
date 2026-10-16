import 'package:flutter_bloc/flutter_bloc.dart';
import '../domain/subscription_state.dart';
import '../data/subscription_repository.dart';
import '../../../shared/models/models.dart';

class SubscriptionCubit extends Cubit<SubscriptionState> {
  final SubscriptionRepository _repository;

  SubscriptionCubit(this._repository) : super(SubscriptionInitial());

  void loadPlans() async {
    emit(SubscriptionLoading());
    try {
      final results = await Future.wait<dynamic>([
        _repository.getPlans(),
        _repository.getCurrentSubscription().catchError((_) => null),
      ]);
      if (isClosed) return;
      final plans = (results[0] as List).cast<SubscriptionPlanModel>();
      final currentSub = results[1] as SubscriptionModel?;
      emit(PlansLoaded(plans: plans, currentSubscription: currentSub,
          isLocked: currentSub == null, accessTier: currentSub?.plan.currency.isNotEmpty == true ? 'PAID' : 'FREE'));
    } catch (e) {
      if (isClosed) return;
      emit(SubscriptionError('Failed to load plans: $e'));
    }
  }

  void checkStatus() async {
    final sub = await _repository.getCurrentSubscription();
    if (isClosed) return;
    if (sub != null && sub.isActive) {
      emit(ActiveSubscription(subscription: sub));
    } else if (sub != null && !sub.isActive) {
      emit(ExpiredSubscription(subscription: sub));
    } else {
      emit(NoSubscription());
    }
  }

  void createSubscription({
    required String planId,
    required String paymentGateway,
    String? couponCode,
    String? channel,
    String? accountName,
    String? reference,
  }) async {
    emit(const SubscriptionLoading());
    try {
      final data = await _repository.createSubscription(
        planId: planId,
        paymentGateway: paymentGateway,
        couponCode: couponCode,
        channel: channel,
        accountName: accountName,
        reference: reference,
      );
      if (isClosed) return;
      emit(PaymentInitiated(
        paymentId: data['paymentId'] as String? ?? '',
        subscriptionId: data['subscriptionId'] as String? ?? '',
        gateway: data['gateway'] as String? ?? paymentGateway.toUpperCase(),
        amount: (data['amount'] as num?)?.toDouble() ?? 0,
        currency: data['currency'] as String? ?? 'USD',
        paymentUrl: data['paymentUrl'] as String?,
        checkoutInfo: data['checkoutInfo'] is Map
            ? Map<String, dynamic>.from(data['checkoutInfo'] as Map)
            : null,
      ));
    } catch (e) {
      if (isClosed) return;
      emit(SubscriptionError('Payment failed: $e'));
    }
  }

  void cancelSubscription() async {
    emit(SubscriptionLoading());
    try {
      await _repository.cancelSubscription();
      if (isClosed) return;
      emit(const SubscriptionSuccess('Subscription cancelled.'));
      checkStatus();
    } catch (e) {
      if (isClosed) return;
      emit(SubscriptionError('Failed to cancel: $e'));
    }
  }

  void loadPaymentHistory() async {
    emit(SubscriptionLoading());
    try {
      final payments = await _repository.getPaymentHistory();
      if (isClosed) return;
      emit(PaymentHistoryLoaded(payments));
    } catch (e) {
      if (isClosed) return;
      emit(SubscriptionError('Failed to load history: $e'));
    }
  }

  Future<bool> applyCoupon(String code) => _repository.applyCoupon(code);
}
