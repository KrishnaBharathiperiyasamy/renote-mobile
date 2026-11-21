import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:renote_mobile/core/config/env_config.dart';
import 'package:renote_mobile/core/constants/api_constants.dart';
import 'package:renote_mobile/services/api_service.dart';

void main() {
  setUp(() {
    debugDefaultTargetPlatformOverride = TargetPlatform.windows;
  });

  tearDown(() {
    debugDefaultTargetPlatformOverride = null;
  });
  group('Marketplace Feed & Upload Verification Tests', () {
    test('EnvConfig defaults to development environment for web localhost', () {
      expect(EnvConfig.currentEnvironment, Environment.development);
      expect(EnvConfig.dataBaseUrl, 'http://localhost:6003');
      expect(EnvConfig.authBaseUrl, 'http://localhost:3005');
      expect(EnvConfig.appCode, 'RENOTE');
    });

    test('ApiConstants endpoints are correctly resolved to local data service (port 6003)', () {
      expect(ApiConstants.marketplaceFeed, 'http://localhost:6003/api/marketplace/feed');
      expect(ApiConstants.createPoster('123'), 'http://localhost:6003/api/posters/createPoster/123');
      expect(ApiConstants.publishMarketplaceItem('abc'), 'http://localhost:6003/api/marketplace/publish/abc');
    });

    test('ApiService.fetchMarketplaceFeed retrieves full list without swallowing valid items', () async {
      final items = await ApiService().fetchMarketplaceFeed();
      expect(items.isNotEmpty, true);
      expect(items.length >= 30, true);
      // Verify items have required non-empty fields
      for (final item in items) {
        expect(item.id.isNotEmpty, true);
        expect(item.title.isNotEmpty, true);
      }
    });
  });
}
