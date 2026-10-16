import 'package:equatable/equatable.dart';

abstract class SubscriptionState extends Equatable {
  final bool isLocked;
  final String accessTier;

  const SubscriptionState({this.isLocked = true, this.accessTier = 'FREE'});

  @override
  List<Object?> get props => [isLocked, accessTier];
}

class SubscriptionInitial extends SubscriptionState {
  const SubscriptionInitial();
}

class SubscriptionLoading extends SubscriptionState {
  const SubscriptionLoading() : super(isLocked: false);
}

class PlansLoaded extends SubscriptionState {
  final List<dynamic> plans;
  final dynamic currentSubscription;

  const PlansLoaded({
    required this.plans,
    this.currentSubscription,
    bool isLocked = false,
    String accessTier = 'FREE',
  }) : super(isLocked: isLocked, accessTier: accessTier);

  @override
  List<Object?> get props => [plans, currentSubscription, isLocked, accessTier];
}

class PaymentHistoryLoaded extends SubscriptionState {
  final List<dynamic> payments;

  const PaymentHistoryLoaded(this.payments) : super(isLocked: false);

  @override
  List<Object?> get props => [payments, isLocked, accessTier];
}

class SubscriptionSuccess extends SubscriptionState {
  final String message;

  const SubscriptionSuccess(this.message) : super(isLocked: false);

  @override
  List<Object?> get props => [message, isLocked, accessTier];
}

class SubscriptionError extends SubscriptionState {
  final String message;

  const SubscriptionError(this.message);

  @override
  List<Object?> get props => [message, isLocked, accessTier];
}

/// Emitted after POST /subscriptions/subscribe succeeds.
/// Contains paymentUrl (for sheet/Stripe) or manual instructions.
class PaymentInitiated extends SubscriptionState {
  final String paymentId;
  final String subscriptionId;
  final String gateway;
  final double amount;
  final String currency;
  final String? paymentUrl;
  final Map<String, dynamic>? checkoutInfo;

  const PaymentInitiated({
    required this.paymentId,
    required this.subscriptionId,
    required this.gateway,
    required this.amount,
    required this.currency,
    this.paymentUrl,
    this.checkoutInfo,
  }) : super(isLocked: false);

  bool get isManual => gateway == 'MANUAL';
  bool get needsWebRedirect => paymentUrl != null && paymentUrl!.isNotEmpty;

  @override
  List<Object?> get props =>
      [paymentId, subscriptionId, gateway, amount, currency, paymentUrl, checkoutInfo, isLocked, accessTier];
}

class NoSubscription extends SubscriptionState {
  const NoSubscription();
}

class ActiveSubscription extends SubscriptionState {
  final dynamic subscription;

  ActiveSubscription({required this.subscription})
      : super(isLocked: false, accessTier: tierOf(subscription));

  static String tierOf(dynamic subscription) {
    if (subscription == null) return 'FREE';
    try {
      final plan = subscription.plan;
      if (plan == null) return 'FREE';
      final currency = plan.currency;
      if (currency is! String || currency.isEmpty) return 'FREE';
      return 'PAID';
    } catch (_) {
      return 'FREE';
    }
  }

  @override
  List<Object?> get props => [subscription, isLocked, accessTier];
}

class ExpiredSubscription extends SubscriptionState {
  final dynamic subscription;

  ExpiredSubscription({required this.subscription})
      : super(isLocked: true, accessTier: ActiveSubscription.tierOf(subscription));

  @override
  List<Object?> get props => [subscription, isLocked, accessTier];
}
