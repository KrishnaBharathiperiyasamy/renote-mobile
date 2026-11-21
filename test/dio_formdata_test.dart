import 'package:flutter_test/flutter_test.dart';
// ignore_for_file: avoid_print
import 'package:dio/dio.dart';
import 'package:renote_mobile/core/network/api_client.dart';

void main() {
  test('Check Dio Content-Type when sending FormData with ApiClient', () async {
    final dio = ApiClient().dio;
    final formData = FormData.fromMap({
      'name': 'test',
    });

    // We inspect request headers before it sends
    RequestOptions? capturedOptions;
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          capturedOptions = options;
          return handler.reject(DioException(requestOptions: options, error: 'Cancelled'));
        },
      ),
    );

    try {
      await dio.post('http://localhost:6003/api/test', data: formData);
    } catch (_) {}

    print('Captured Content-Type: ${capturedOptions?.contentType}');
    print('Captured headers: ${capturedOptions?.headers}');
  });
}
