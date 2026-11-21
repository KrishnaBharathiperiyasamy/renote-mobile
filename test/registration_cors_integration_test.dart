import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:renote_mobile/services/auth_service.dart';
import 'package:renote_mobile/core/config/env_config.dart';

void main() {
  group('Auth Service Registration & CORS Integration Tests', () {
    final dio = Dio();
    final authService = AuthService();

    test('OPTIONS /auth/register returns 204 with CORS allow headers for localhost:62831', () async {
      final response = await dio.fetch(
        RequestOptions(
          path: '${EnvConfig.authBaseUrl}/auth/register',
          method: 'OPTIONS',
          headers: {
            'Origin': 'http://localhost:62831',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization, app-code, Accept',
          },
          validateStatus: (status) => true,
        ),
      );

      expect(response.statusCode, 204);
      expect(response.headers.value('access-control-allow-origin'), 'http://localhost:62831');
      expect(response.headers.value('access-control-allow-credentials'), 'true');
      expect(
        response.headers.value('access-control-allow-methods'),
        contains('POST'),
      );
    });

    test('OPTIONS /auth/register returns 204 with CORS allow headers for production origin', () async {
      final response = await dio.fetch(
        RequestOptions(
          path: '${EnvConfig.authBaseUrl}/auth/register',
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://renote.co.in',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization, app-code, Accept',
          },
          validateStatus: (status) => true,
        ),
      );

      expect(response.statusCode, 204);
      expect(response.headers.value('access-control-allow-origin'), 'https://renote.co.in');
      expect(response.headers.value('access-control-allow-credentials'), 'true');
    });

    test('Registration rejects duplicate phone with 409 Conflict', () async {
      expect(
        () async => await authService.register(
          firstName: 'Duplicate',
          lastName: 'Tester',
          email: '',
          phone: '9092024444',
          password: 'Password123!',
        ),
        throwsA(predicate((e) =>
            e.toString().contains('already exists') ||
            e.toString().contains('Conflict') ||
            e.toString().contains('409'))),
      );
    });

    test('Successful registration creates user and returns UserModel with tokens', () async {
      final uniqueSuffix = DateTime.now().millisecondsSinceEpoch.toString().substring(7);
      final uniquePhone = '9900$uniqueSuffix';
      final uniqueEmail = 'flutter_user_$uniqueSuffix@renote.test';

      final user = await authService.register(
        firstName: 'Flutter',
        lastName: 'Dev',
        email: uniqueEmail,
        phone: uniquePhone,
        password: 'SecurePass123!',
      );

      expect(user.id, isNotEmpty);
      expect(user.firstName, 'Flutter');
      expect(user.lastName, 'Dev');
      expect(user.phone, uniquePhone);
      expect(user.email, uniqueEmail);

      // Verify login immediately works with the new account
      final loggedInUser = await authService.login(
        emailOrPhone: uniquePhone,
        password: 'SecurePass123!',
      );

      expect(loggedInUser.id, user.id);
      expect(loggedInUser.firstName, 'Flutter');
    });
  });
}
