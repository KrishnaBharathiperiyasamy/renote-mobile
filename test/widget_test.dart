import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:renote_mobile/shared/widgets/brand_flame_logo.dart';

void main() {
  testWidgets('ReNote BrandFlameLogo smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: BrandFlameLogo(size: 32),
        ),
      ),
    );
    expect(find.byType(BrandFlameLogo), findsOneWidget);
  });
}
