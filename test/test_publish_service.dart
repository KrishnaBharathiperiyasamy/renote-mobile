// ignore_for_file: avoid_print
import 'dart:io';
import 'dart:typed_data';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:renote_mobile/models/user_model.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:renote_mobile/services/api_service.dart';
import 'package:renote_mobile/services/auth_service.dart';
import 'package:renote_mobile/core/config/env_config.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global = null;
  SharedPreferences.setMockInitialValues({});
  test('Test publishMarketplaceProduct with real backend', () async {
    EnvConfig.updateHost('localhost');
    final auth = AuthService();
    final api = ApiService();

    // 1. Login
    UserModel? user;
    try {
      user = await auth.login(
        emailOrPhone: '9811915310',
        password: 'SecurePassword123!',
      );
    } catch (err, st) {
      print('LOGIN ERROR: $err');
      print('STACK: $st');
    }
    expect(user, isNotNull);
    expect(user!.id, isNotEmpty);
    print('User logged in: ${user.id}');

    // 2. Create a dummy XFile from 1x1 png bytes
    final dummyBytes = [
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
      0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
      0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5,
      0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
    ];
    final imageFile = XFile.fromData(
      Uint8List.fromList(dummyBytes),
      name: 'test_product.png',
      mimeType: 'image/png',
    );

    // 3. Call publishMarketplaceProduct with image and progress listener
    int progressCalls = 0;
    final result = await api.publishMarketplaceProduct(
      userId: user.id,
      title: 'Flutter Test Product (Image)',
      description: 'Published from Flutter integration test with image',
      price: 599.0,
      location: 'Bengaluru',
      category: 'Electronics',
      phone: '9811915310',
      imageFiles: [imageFile],
      onProgress: (sent, total) {
        progressCalls++;
      },
    );

    print('Image Result: $result');
    expect(result['success'], true);
    expect(result['posterId'], isNotNull);

    // 4. Test Video Upload separately with progress listener
    final videoBytes = [
      0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70,
      0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
      0x00, 0x00, 0x00, 0x08, 0x6D, 0x64, 0x61, 0x74,
    ];
    final videoFile = XFile.fromData(
      Uint8List.fromList(videoBytes),
      name: 'flutter_video.mp4',
      mimeType: 'video/mp4',
    );
    final videoResult = await api.publishMarketplaceProduct(
      userId: user.id,
      title: 'Flutter Test Product (Video)',
      description: 'Published from Flutter integration test with video',
      price: 899.0,
      location: 'RS Puram',
      category: 'Electronics',
      phone: '9811915310',
      videoFile: videoFile,
      onProgress: (sent, total) {
        progressCalls++;
      },
    );

    print('Video Result: $videoResult');
    expect(videoResult['success'], true);
    expect(videoResult['posterId'], isNotNull);

    // 5. Verify both appear in Marketplace feed
    final feed = await api.fetchMarketplaceFeed();
    expect(feed, isNotEmpty);
    final hasImg = feed.any((p) => p.title.contains('Flutter Test Product (Image)'));
    final hasVid = feed.any((p) => p.title.contains('Flutter Test Product (Video)'));
    expect(hasImg, true);
    expect(hasVid, true);
    expect(progressCalls, greaterThan(0));
    print('Both Image and Video products confirmed in feed!');
  });
}
