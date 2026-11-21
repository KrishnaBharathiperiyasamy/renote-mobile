import 'package:flutter_test/flutter_test.dart';
import 'package:dio/dio.dart';
import 'package:renote_mobile/models/marketplace_item_model.dart';

void main() {
  test('Fetch live marketplace feed and verify parsing of all posters', () async {
    final dio = Dio();
    final response = await dio.get('http://localhost:6003/api/marketplace/feed?page=1&limit=50&sort=recent');
    expect(response.statusCode, 200);
    final data = response.data;
    expect(data['success'], true);
    final List posters = data['posters'];
    expect(posters.isNotEmpty, true);

    int parsedCount = 0;
    for (int i = 0; i < posters.length; i++) {
      try {
        final map = Map<String, dynamic>.from(posters[i] as Map);
        final item = MarketplaceItemModel.fromJson(map);
        expect(item.id.isNotEmpty, true);
        parsedCount++;
      } catch (e) {
        fail('Poster parsing failed at index $i: $e');
      }
    }
    expect(parsedCount, posters.length);
  });
}
