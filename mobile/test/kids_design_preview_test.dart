import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:naik_mobile/core/theme/app_theme.dart';
import 'package:naik_mobile/dev/design_preview_main.dart';

void main() {
  testWidgets('Kids design preview renders without errors', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.lightTheme(),
        home: const KidsDesignPreviewScreen(),
      ),
    );
    // Advance a few frames (repeating shimmer/mascot animations are active).
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.text('🎨 Kids Design System'), findsOneWidget);
    expect(find.text('Sunny Yellow'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
