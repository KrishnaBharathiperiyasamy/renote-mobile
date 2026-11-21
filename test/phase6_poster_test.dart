import 'package:flutter_test/flutter_test.dart';
import 'package:renote_mobile/models/poster_model.dart';
import 'package:renote_mobile/features/posters/models/poster_template_data.dart';
import 'package:renote_mobile/features/posters/models/poster_canvas_state.dart';
import 'package:renote_mobile/providers/poster_provider.dart';

void main() {
  group('Phase 6 - Poster Management & Editor Tests', () {
    test('PosterModel serialization & deserialization', () {
      final poster = PosterModel(
        id: '662fd9b31234567890abcdef',
        posterId: 'POS-101',
        posterName: 'Summer Splash 2026',
        posterTitle: 'SUPER SALE 40% OFF',
        productName: 'Ergonomic Desk Chair',
        productDescription: 'Lumbar support with breathable mesh.',
        productPrice: 7999.0,
        productImage: 'uploads/products/chair.png',
        companyLogo: 'uploads/logos/brand.png',
        companyId: 'comp_888',
        template: 'frame2',
        templateCategory: 'Classic',
        colorThemeId: 'flame-orange',
        fontFamilyId: 'sans',
        aspectRatio: '3:4',
        logoZoom: 1.2,
        productZoom: 1.5,
        logoPositionX: 0.1,
        logoPositionY: -0.2,
        productPositionX: 0.05,
        productPositionY: 0.1,
        stickers: [
          {
            'id': 'stk_1',
            'stickerTypeId': 'hot_deal',
            'label': 'HOT DEAL 🔥',
            'x': 0.1,
            'y': 0.2,
            'scale': 1.0,
            'rotation': 0.0,
          }
        ],
        isFavorite: true,
      );

      final json = poster.toJson();
      expect(json['posterId'], 'POS-101');
      expect(json['poster_name'], 'Summer Splash 2026');
      expect(json['poster_title'], 'SUPER SALE 40% OFF');
      expect(json['product_name'], 'Ergonomic Desk Chair');
      expect(json['product_price'], 7999.0);
      expect(json['template'], 'frame2');
      expect(json['templateCategory'], 'Classic');
      expect(json['colorThemeId'], 'flame-orange');
      expect(json['aspect_ratio'], '3:4');
      expect(json['logo_zoom'], 1.2);
      expect(json['product_zoom'], 1.5);
      expect(json['stickers'].length, 1);

      final fromJson = PosterModel.fromJson(json);
      expect(fromJson.posterId, 'POS-101');
      expect(fromJson.posterName, 'Summer Splash 2026');
      expect(fromJson.productName, 'Ergonomic Desk Chair');
      expect(fromJson.productPrice, 7999.0);
      expect(fromJson.logoZoom, 1.2);
      expect(fromJson.productZoom, 1.5);
      expect(fromJson.stickers.length, 1);
    });

    test('PosterDefinitions contains standard templates and themes', () {
      expect(PosterDefinitions.categories.contains('Classic'), isTrue);
      expect(PosterDefinitions.categories.contains('Minimal'), isTrue);
      expect(PosterDefinitions.categories.contains('Creative'), isTrue);
      expect(PosterDefinitions.categories.contains('Business'), isTrue);
      expect(PosterDefinitions.categories.contains('Premium'), isTrue);

      final flameTheme = PosterDefinitions.getTheme('flame-orange');
      expect(flameTheme.id, 'flame-orange');
      expect(flameTheme.primary.toARGB32(), isNotNull);

      final frame1 = PosterDefinitions.getTemplate('frame1');
      expect(frame1.id, 'frame1');
      expect(frame1.category, 'Classic');

      expect(PosterDefinitions.aspectRatios['3:4'], 3 / 4);
      expect(PosterDefinitions.aspectRatios['1:1'], 1.0);
      expect(PosterDefinitions.aspectRatios['9:16'], 9 / 16);
      expect(PosterDefinitions.aspectRatios['16:9'], 16 / 9);
    });

    test('PosterEditorController manipulates elements, stickers & undo/redo', () {
      final initial = PosterModel(
        id: 'temp_1',
        posterId: 'POS-1',
        posterName: 'Draft Poster',
        posterTitle: 'TITLE V1',
        productName: 'Product V1',
        productPrice: 500.0,
      );

      final controller = PosterEditorController(initialPoster: initial);

      expect(controller.poster.posterTitle, 'TITLE V1');
      expect(controller.canUndo, isFalse);

      // 1. Update text
      controller.updateTexts(posterTitle: 'TITLE V2', productPrice: 999.0);
      expect(controller.poster.posterTitle, 'TITLE V2');
      expect(controller.poster.productPrice, 999.0);
      expect(controller.canUndo, isTrue);

      // 2. Undo text change
      controller.undo();
      expect(controller.poster.posterTitle, 'TITLE V1');
      expect(controller.canRedo, isTrue);

      // 3. Redo text change
      controller.redo();
      expect(controller.poster.posterTitle, 'TITLE V2');

      // 4. Change template and theme
      controller.setTemplate('frame7', 'Minimal');
      expect(controller.poster.template, 'frame7');
      expect(controller.poster.templateCategory, 'Minimal');

      controller.setColorTheme('electric-blue');
      expect(controller.poster.colorThemeId, 'electric-blue');

      // 5. Add sticker
      final stickerData = PosterDefinitions.stickers.first;
      controller.addSticker(stickerData);
      expect(controller.stickers.length, 1);
      expect(controller.stickers.first.label, stickerData.label);

      // 6. Move sticker
      final stickerId = controller.stickers.first.id;
      controller.updateStickerPosition(stickerId, 0.05, 0.1);
      expect(controller.stickers.first.x, 0.05);
      expect(controller.stickers.first.y, 0.25);

      // 7. Remove sticker
      controller.removeSticker(stickerId);
      expect(controller.stickers.isEmpty, isTrue);

      // 8. Prepare for save
      final toSave = controller.preparePosterForSave();
      expect(toSave.posterTitle, 'TITLE V2');
      expect(toSave.colorThemeId, 'electric-blue');
    });

    test('PosterState search, category and favorites filtering', () {
      final p1 = PosterModel(
        id: '1',
        posterId: 'POS-1',
        posterName: 'Summer Festival Sale',
        posterTitle: 'FESTIVAL OF OFFERS',
        productName: 'Bluetooth Speaker',
        templateCategory: 'Classic',
        isFavorite: true,
      );
      final p2 = PosterModel(
        id: '2',
        posterId: 'POS-2',
        posterName: 'Minimalist Watch Ad',
        posterTitle: 'TIMELESS LUXURY',
        productName: 'Chronograph Watch',
        templateCategory: 'Minimal',
        isFavorite: false,
      );
      final p3 = PosterModel(
        id: '3',
        posterId: 'POS-3',
        posterName: 'Corporate Tech Solutions',
        posterTitle: 'ENTERPRISE READY',
        productName: 'Cloud Server Suite',
        templateCategory: 'Business',
        isFavorite: true,
      );

      final state = PosterState(posters: [p1, p2, p3]);

      // All posters
      expect(state.totalCount, 3);

      // Search by product name
      final searchFiltered = state.copyWith(searchQuery: 'speaker');
      expect(searchFiltered.totalCount, 1);
      expect(searchFiltered.filteredPosters.first.productName, 'Bluetooth Speaker');

      // Filter by category
      final categoryFiltered = state.copyWith(selectedCategory: 'Minimal');
      expect(categoryFiltered.totalCount, 1);
      expect(categoryFiltered.filteredPosters.first.posterName, 'Minimalist Watch Ad');

      // Filter by favorites only
      final favoritesFiltered = state.copyWith(favoritesOnly: true);
      expect(favoritesFiltered.totalCount, 2);
    });

    test('PosterState removes deleted poster by either id or posterId', () {
      final p1 = PosterModel(
        id: 'mongo_id_1',
        posterId: 'POS-1',
        posterName: 'Poster 1',
        posterTitle: 'Title 1',
        productName: 'Product 1',
      );
      final p2 = PosterModel(
        id: 'mongo_id_2',
        posterId: 'POS-2',
        posterName: 'Poster 2',
        posterTitle: 'Title 2',
        productName: 'Product 2',
      );
      final state = PosterState(posters: [p1, p2]);

      final remaining1 = state.copyWith(
        posters: state.posters
            .where((p) => p.id != 'mongo_id_1' && p.posterId != 'mongo_id_1')
            .toList(),
      );
      expect(remaining1.posters.length, 1);
      expect(remaining1.posters.first.id, 'mongo_id_2');

      final remaining2 = state.copyWith(
        posters: state.posters
            .where((p) => p.id != 'POS-2' && p.posterId != 'POS-2')
            .toList(),
      );
      expect(remaining2.posters.length, 1);
      expect(remaining2.posters.first.id, 'mongo_id_1');
    });
  });
}

