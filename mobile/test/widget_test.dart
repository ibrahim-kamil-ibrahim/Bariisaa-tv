import 'package:flutter_test/flutter_test.dart';
import 'package:naik_mobile/main.dart';
import 'package:naik_mobile/core/di/injection.dart';

void main() {
  testWidgets('App should render splash screen', (WidgetTester tester) async {
    await setupDependencies();
    await tester.pumpWidget(const BariisaaTvApp());
    await tester.pump();
    expect(find.text('Bariisaa Tv'), findsOneWidget);
  });
}
