import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import 'package:renote_mobile/features/authentication/screens/login_screen.dart';
import 'package:renote_mobile/core/constants/app_colors.dart';
import 'package:renote_mobile/core/theme/app_theme.dart';

void main() {
  group('Authentication Input Text Color Tests', () {
    testWidgets('Login inputs have black text color, orange cursor, and white fill',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            home: const LoginScreen(),
          ),
        ),
      );
      await tester.pump();

      // Sign In mode by default
      expect(find.text('Sign In'), findsAtLeastNWidgets(1));

      // Find all TextFields
      final textFields = tester.widgetList<TextField>(find.byType(TextField)).toList();
      expect(textFields.length, 2); // Identifier and Password

      for (final tf in textFields) {
        // Entered text style must be pure Black (#000000)
        expect(tf.style?.color, const Color(0xFF000000));
        // Cursor must be ReNote primary orange
        expect(tf.cursorColor, AppColors.primary);
        // Fill color must be white
        expect(tf.decoration?.fillColor, Colors.white);
        // Hint text must be grey (#71717A)
        expect(tf.decoration?.hintStyle?.color, const Color(0xFF71717A));
      }
    });

    testWidgets('Registration inputs have black text color, orange cursor, and white fill',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            home: const LoginScreen(),
          ),
        ),
      );
      await tester.pump();

      // Switch to "Create Account" mode
      final createAccountTab = find.text('Create Account');
      expect(createAccountTab, findsOneWidget);
      await tester.tap(createAccountTab);
      await tester.pump();

      // Find all registration TextFields:
      // 1. First Name, 2. Last Name, 3. Phone Number, 4. Email, 5. Password, 6. Confirm Password
      final textFields = tester.widgetList<TextField>(find.byType(TextField)).toList();
      expect(textFields.length, 6);

      for (final tf in textFields) {
        // Pure Black (#000000) text
        expect(tf.style?.color, const Color(0xFF000000));
        // Orange cursor
        expect(tf.cursorColor, AppColors.primary);
        // White background
        expect(tf.decoration?.fillColor, Colors.white);
        // Grey placeholder
        expect(tf.decoration?.hintStyle?.color, const Color(0xFF71717A));
      }
    });

    testWidgets('Typing inside input fields displays black text and preserves visibility toggle',
        (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            theme: AppTheme.lightTheme,
            home: const LoginScreen(),
          ),
        ),
      );
      await tester.pump();

      // Switch to registration mode
      await tester.tap(find.text('Create Account'));
      await tester.pump();

      // Type into First Name
      final firstNameFinder = find.widgetWithText(TextField, 'e.g. Rahul');
      expect(firstNameFinder, findsOneWidget);
      await tester.enterText(firstNameFinder, 'Vyshwa');
      await tester.pump();

      final updatedField = tester.widget<TextField>(firstNameFinder);
      expect(updatedField.controller?.text, 'Vyshwa');
      expect(updatedField.style?.color, const Color(0xFF000000));

      // Test password visibility toggle
      final passwordFieldFinder = find.widgetWithText(
        TextField,
        'Min 8 chars, 1 uppercase, 1 special',
      );
      expect(passwordFieldFinder, findsOneWidget);
      var pwdField = tester.widget<TextField>(passwordFieldFinder);
      expect(pwdField.obscureText, isTrue);

      // Find eye icon on registration password and tap it
      final eyeIcon = find.descendant(
        of: find.ancestor(of: passwordFieldFinder, matching: find.byType(Container)).first,
        matching: find.byIcon(LucideIcons.eye),
      );
      if (eyeIcon.evaluate().isNotEmpty) {
        await tester.tap(eyeIcon.first);
        await tester.pump();

        pwdField = tester.widget<TextField>(passwordFieldFinder);
        expect(pwdField.obscureText, isFalse);
      }
    });
  });
}

