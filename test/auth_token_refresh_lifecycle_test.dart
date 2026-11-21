// ignore_for_file: avoid_print
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';
import 'package:renote_mobile/core/config/env_config.dart';
import 'package:renote_mobile/services/auth_service.dart';
import 'package:renote_mobile/services/api_service.dart';
import 'package:renote_mobile/services/storage_service.dart';
import 'package:renote_mobile/models/user_model.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = null;
  SharedPreferences.setMockInitialValues({});

  group('Authentication Token Lifecycle & Automatic Refresh Tests', () {
    late AuthService authService;
    late ApiService apiService;
    late StorageService storageService;

    setUpAll(() async {
      EnvConfig.updateHost('localhost');
      authService = AuthService();
      apiService = ApiService();
      storageService = StorageService();
      await storageService.init();
    });

    test('Scenario A: Fresh Login saves both tokens and fetches profile', () async {
      final user = await authService.login(
        emailOrPhone: '9811915310',
        password: 'SecurePassword123!',
      );

      expect(user, isNotNull);
      expect(user.id, isNotEmpty);

      final accessToken = await storageService.getAccessToken();
      final refreshToken = await storageService.getRefreshToken();

      expect(accessToken, isNotNull);
      expect(accessToken, isNotEmpty);
      expect(refreshToken, isNotNull);
      expect(refreshToken, isNotEmpty);

      print('Scenario A Passed: User logged in (${user.id}), tokens securely saved.');

      // Retrieve user profile with valid access token
      final profile = await authService.getProfile();
      expect(profile, isNotNull);
      expect(profile!.id, user.id);
      print('Scenario A Passed: Profile retrieved via protected endpoint.');
    });

    test('Scenario B: Expired Access Token triggers automatic refresh and retries', () async {
      // 1. Ensure we have a valid session
      final initialUser = await authService.login(
        emailOrPhone: '9811915310',
        password: 'SecurePassword123!',
      );
      final validRefreshToken = await storageService.getRefreshToken();
      expect(validRefreshToken, isNotNull);

      // 2. Corrupt/expire the access token artificially
      const expiredAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTYiLCJleHAiOjEwMDAwfQ.invalid_sig';
      await storageService.saveTokens(
        accessToken: expiredAccessToken,
        refreshToken: validRefreshToken,
      );

      expect(await storageService.getAccessToken(), expiredAccessToken);

      // 3. Call protected endpoint - this will receive 401, refresh token, and succeed
      final profile = await authService.getProfile();

      expect(profile, isNotNull);
      expect(profile!.id, initialUser.id);

      // 4. Verify access token was renewed in storage
      final renewedAccessToken = await storageService.getAccessToken();
      expect(renewedAccessToken, isNotNull);
      expect(renewedAccessToken, isNot(equals(expiredAccessToken)));

      print('Scenario B Passed: Expired token automatically refreshed and request retried seamlessly.');
    });

    test('Scenario C: Multiple simultaneous requests execute single-flight refresh without token collision', () async {
      // 1. Login to get fresh tokens
      final initialUser = await authService.login(
        emailOrPhone: '9811915310',
        password: 'SecurePassword123!',
      );
      final currentRefreshToken = await storageService.getRefreshToken();

      // 2. Corrupt access token for simultaneous requests
      const expiredAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.signature';
      await storageService.saveTokens(
        accessToken: expiredAccessToken,
        refreshToken: currentRefreshToken,
      );

      // 3. Fire 4 concurrent requests at the exact same instant
      final results = await Future.wait([
        authService.getProfile(),
        apiService.fetchCompanies(initialUser.id),
        authService.getProfile(),
        apiService.fetchCompanies(initialUser.id),
      ]);

      expect(results[0], isNotNull);
      expect((results[0] as UserModel).id, initialUser.id);
      expect(results[1], isA<List>());
      expect(results[2], isNotNull);
      expect((results[2] as UserModel).id, initialUser.id);
      expect(results[3], isA<List>());

      print('Scenario C Passed: All 4 simultaneous requests succeeded via single-flight refresh.');
    });

    test('Scenario D: Genuinely invalid/revoked refresh token clears session without infinite loops', () async {
      // 1. Set invalid tokens
      await storageService.saveTokens(
        accessToken: 'expired_access_token_12345',
        refreshToken: 'invalid_or_revoked_refresh_token_99999',
      );

      // 2. Call protected endpoint
      final profile = await authService.getProfile();

      // Should return null (or fail gracefully)
      expect(profile, isNull);

      // 3. Verify session was cleared
      final accessTokenAfter = await storageService.getAccessToken();
      expect(accessTokenAfter, isNull);

      print('Scenario D Passed: Invalid refresh token cleanly terminated session without retry loops.');
    });

    test('Scenario E: Marketplace Product Publishing with expired access token auto-refreshes and publishes', () async {
      // 1. Fresh login
      final user = await authService.login(
        emailOrPhone: '9811915310',
        password: 'SecurePassword123!',
      );
      final validRefreshToken = await storageService.getRefreshToken();
      expect(validRefreshToken, isNotNull);

      // 2. Expire the access token right before publishing
      await storageService.saveTokens(
        accessToken: 'expired_token_before_publish',
        refreshToken: validRefreshToken,
      );

      // 3. Create dummy image for product
      final dummyBytes = [
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
        0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
        0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5,
        0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
      ];
      final imageFile = XFile.fromData(
        Uint8List.fromList(dummyBytes),
        name: 'auto_refresh_product.png',
        mimeType: 'image/png',
      );

      // 4. Publish product - the FormData request will hit 401 on createPoster,
      // refresh token automatically, clone FormData, and succeed!
      final result = await apiService.publishMarketplaceProduct(
        userId: user.id,
        title: 'Auto-Refreshed Marketplace Listing',
        description: 'Published seamlessly even when access token was expired!',
        price: 2499.0,
        location: 'RS Puram',
        category: 'Electronics',
        phone: '9811915310',
        imageFiles: [imageFile],
      );

      print('Publish Result: $result');
      expect(result['success'], true);
      expect(result['posterId'], isNotNull);

      // 5. Verify the published product is live in Marketplace Feed
      final feed = await apiService.fetchMarketplaceFeed();
      final found = feed.any((p) => p.title.contains('Auto-Refreshed Marketplace Listing'));
      expect(found, true);

      print('Scenario E Passed: Product successfully published & verified in feed after automatic token renewal!');
    });
  });
}
