import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';

import '../../../core/constants/api_constants.dart';
import '../../../shared/widgets/brand_flame_logo.dart';
import '../models/poster_canvas_state.dart';
import '../models/poster_template_data.dart';

class PosterCanvasView extends StatelessWidget {
  final PosterEditorController controller;
  final bool interactive;
  final GlobalKey? repaintBoundaryKey;

  const PosterCanvasView({
    super.key,
    required this.controller,
    this.interactive = true,
    this.repaintBoundaryKey,
  });

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) {
        final poster = controller.poster;
        final theme = controller.currentTheme;
        final template = controller.currentTemplate;
        final aspectRatio =
            PosterDefinitions.aspectRatios[poster.aspectRatio] ?? (3 / 4);

        Widget canvasContent = AspectRatio(
          aspectRatio: aspectRatio,
          child: Container(
            decoration: BoxDecoration(
              color: theme.canvasBg,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.15),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipRect(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final width = constraints.maxWidth;
                  final height = constraints.maxHeight;

                  return GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () {
                      if (interactive) controller.selectElement(null);
                    },
                    child: Stack(
                      children: [
                        // 1. Template-specific background layout graphics
                        _buildTemplateBackground(
                          template,
                          theme,
                          width,
                          height,
                        ),

                        // 2. Structured Content Layer
                        _buildContentLayout(template, theme, width, height),

                        // 3. Interactive Floating Stickers
                        ...controller.stickers.map((sticker) {
                          return _buildInteractiveSticker(
                            sticker,
                            width,
                            height,
                          );
                        }),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),
        );

        if (repaintBoundaryKey != null) {
          canvasContent = RepaintBoundary(
            key: repaintBoundaryKey,
            child: canvasContent,
          );
        }

        return canvasContent;
      },
    );
  }

  // -------------------------------------------------------------
  // Background Framing Elements
  // -------------------------------------------------------------
  Widget _buildTemplateBackground(
    PosterTemplateInfo template,
    PosterThemePalette theme,
    double width,
    double height,
  ) {
    switch (template.layoutStyle) {
      case 'diagonal_banner':
        return Positioned(
          top: -height * 0.1,
          right: -width * 0.2,
          child: Transform.rotate(
            angle: -0.35,
            child: Container(
              width: width * 1.5,
              height: height * 0.35,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [theme.primary, theme.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ),
        );

      case 'split_card':
        return Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.42,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [theme.primaryLight, theme.canvasBg],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              border: Border(
                bottom: BorderSide(
                  color: theme.primary.withValues(alpha: 0.2),
                  width: 2,
                ),
              ),
            ),
          ),
        );

      case 'magazine_header':
        return Column(
          children: [
            Container(height: height * 0.18, color: theme.primary),
            Expanded(child: Container(color: theme.canvasBg)),
          ],
        );

      case 'corporate_business':
        return Stack(
          children: [
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              child: Container(color: theme.primary),
            ),
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: height * 0.08,
              child: Container(color: theme.primaryDark),
            ),
          ],
        );

      case 'luxury_dark':
        return Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: const Color(0xFFD97706).withValues(alpha: 0.6),
              width: 3,
            ),
          ),
          margin: const EdgeInsets.all(8),
        );

      case 'minimal_clean':
        return Container(
          decoration: BoxDecoration(
            border: Border.all(
              color: theme.textSecondary.withValues(alpha: 0.2),
              width: 1.5,
            ),
          ),
          margin: const EdgeInsets.all(12),
        );

      case 'center_hero':
      default:
        return Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.28,
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [theme.primary.withValues(alpha: 0.12), theme.canvasBg],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        );
    }
  }

  // -------------------------------------------------------------
  // Content Layout
  // -------------------------------------------------------------
  Widget _buildContentLayout(
    PosterTemplateInfo template,
    PosterThemePalette theme,
    double width,
    double height,
  ) {
    final poster = controller.poster;
    final isSelectedTitle =
        interactive && controller.selectedElementId == 'title';
    final isSelectedProduct =
        interactive && controller.selectedElementId == 'product';

    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: width * 0.06,
        vertical: height * 0.04,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Top Bar: Logo & Header Brand
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              _buildLogoWidget(width, height),
              _buildTopBadge(template, theme, width),
            ],
          ),

          SizedBox(height: height * 0.02),

          // Main Title Banner
          GestureDetector(
            onTap: () {
              if (interactive) controller.selectElement('title');
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                border: isSelectedTitle
                    ? Border.all(color: theme.primary, width: 2)
                    : null,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                poster.posterTitle.toUpperCase(),
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: (width * 0.055).clamp(16.0, 26.0),
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                  color: template.layoutStyle == 'magazine_header'
                      ? Colors.white
                      : (theme.isDark ? Colors.white : theme.primary),
                ),
              ),
            ),
          ),

          SizedBox(height: height * 0.015),

          // Center Product Hero Image (Interactive / Draggable)
          Expanded(
            child: GestureDetector(
              onTap: () {
                if (interactive) controller.selectElement('product');
              },
              onPanUpdate: (details) {
                if (interactive && controller.selectedElementId == 'product') {
                  controller.updateProductPosition(
                    details.delta.dx / width,
                    details.delta.dy / height,
                  );
                }
              },
              child: Container(
                decoration: BoxDecoration(
                  border: isSelectedProduct
                      ? Border.all(color: theme.primary, width: 2)
                      : null,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Transform.translate(
                    offset: Offset(
                      poster.productPositionX * width,
                      poster.productPositionY * height,
                    ),
                    child: Transform.scale(
                      scale: poster.productZoom,
                      child: _buildProductImageWidget(theme, width, height),
                    ),
                  ),
                ),
              ),
            ),
          ),

          SizedBox(height: height * 0.015),

          // Product Details (Name, Description, Price Tag)
          _buildProductInfo(theme, width, height),

          // Optional Footer Bar for Business Template
          if (template.layoutStyle == 'corporate_business') ...[
            SizedBox(height: height * 0.01),
            Text(
              'Official ReNote Verified Product • All Rights Reserved',
              style: TextStyle(
                fontSize: 9,
                color: Colors.white.withValues(alpha: 0.8),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // Logo Element
  // -------------------------------------------------------------
  Widget _buildLogoWidget(double width, double height) {
    final poster = controller.poster;
    final isSelected = interactive && controller.selectedElementId == 'logo';

    Widget logoChild;
    if (controller.localLogoPath != null &&
        controller.localLogoPath!.isNotEmpty) {
      logoChild = kIsWeb
          ? Image.network(controller.localLogoPath!, fit: BoxFit.contain)
          : Image.file(File(controller.localLogoPath!), fit: BoxFit.contain);
    } else if (poster.companyLogo != null && poster.companyLogo!.isNotEmpty) {
      logoChild = CachedNetworkImage(
        imageUrl: ApiConstants.resolveImageUrl(poster.companyLogo),
        fit: BoxFit.contain,
        placeholder: (ctx, url) => const BrandFlameLogo(size: 28),
        errorWidget: (ctx, url, err) => const BrandFlameLogo(size: 28),
      );
    } else {
      logoChild = const BrandFlameLogo(size: 32);
    }

    return GestureDetector(
      onTap: () {
        if (interactive) controller.selectElement('logo');
      },
      onPanUpdate: (details) {
        if (interactive && controller.selectedElementId == 'logo') {
          controller.updateLogoPosition(
            details.delta.dx / width,
            details.delta.dy / height,
          );
        }
      },
      child: Transform.translate(
        offset: Offset(
          poster.logoPositionX * width,
          poster.logoPositionY * height,
        ),
        child: Transform.scale(
          scale: poster.logoZoom,
          child: Container(
            width: 44,
            height: 44,
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.9),
              shape: BoxShape.circle,
              border: isSelected
                  ? Border.all(color: controller.currentTheme.primary, width: 2)
                  : Border.all(color: Colors.black.withValues(alpha: 0.08)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: ClipOval(child: logoChild),
          ),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // Top Badge / Category Ribbon
  // -------------------------------------------------------------
  Widget _buildTopBadge(
    PosterTemplateInfo template,
    PosterThemePalette theme,
    double width,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: theme.primary,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: theme.primary.withValues(alpha: 0.35),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.sparkles, size: 11, color: Colors.white),
          const SizedBox(width: 4),
          Text(
            template.category.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // Product Image Hero Widget
  // -------------------------------------------------------------
  Widget _buildProductImageWidget(
    PosterThemePalette theme,
    double width,
    double height,
  ) {
    final poster = controller.poster;

    if (controller.localProductImagePath != null &&
        controller.localProductImagePath!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: kIsWeb
            ? Image.network(
                controller.localProductImagePath!,
                fit: BoxFit.contain,
              )
            : Image.file(
                File(controller.localProductImagePath!),
                fit: BoxFit.contain,
              ),
      );
    } else if (poster.productImage != null && poster.productImage!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: CachedNetworkImage(
          imageUrl: ApiConstants.resolveImageUrl(poster.productImage),
          fit: BoxFit.contain,
          placeholder: (ctx, url) => Center(
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: theme.primary,
            ),
          ),
          errorWidget: (ctx, url, err) => _buildPlaceholderHero(theme),
        ),
      );
    }

    return _buildPlaceholderHero(theme);
  }

  Widget _buildPlaceholderHero(PosterThemePalette theme) {
    return Container(
      width: 170,
      height: 170,
      decoration: BoxDecoration(
        color: theme.primaryLight.withValues(alpha: 0.6),
        shape: BoxShape.circle,
        border: Border.all(
          color: theme.primary.withValues(alpha: 0.3),
          width: 2,
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            LucideIcons.image,
            size: 48,
            color: theme.primary.withValues(alpha: 0.7),
          ),
          const SizedBox(height: 8),
          Text(
            'Tap Images to add photo',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: theme.primaryDark,
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // Product Information & Price Tag
  // -------------------------------------------------------------
  Widget _buildProductInfo(
    PosterThemePalette theme,
    double width,
    double height,
  ) {
    final poster = controller.poster;
    final isSelectedDetails =
        interactive && controller.selectedElementId == 'details';

    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: (poster.productPrice ?? 0) % 1 == 0 ? 0 : 2,
    );

    return GestureDetector(
      onTap: () {
        if (interactive) controller.selectElement('details');
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: theme.cardBg,
          borderRadius: BorderRadius.circular(14),
          border: isSelectedDetails
              ? Border.all(color: theme.primary, width: 2)
              : Border.all(color: theme.primary.withValues(alpha: 0.15)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          children: [
            Text(
              poster.productName,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: (width * 0.046).clamp(14.0, 20.0),
                fontWeight: FontWeight.bold,
                color: theme.textPrimary,
              ),
            ),
            if (poster.productDescription != null &&
                poster.productDescription!.trim().isNotEmpty) ...[
              const SizedBox(height: 2),
              Text(
                poster.productDescription!,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  color: theme.textSecondary,
                  height: 1.25,
                ),
              ),
            ],
            const SizedBox(height: 8),
            // Price Tag Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [theme.priceBg, theme.primaryDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: theme.priceBg.withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Text(
                poster.productPrice != null && poster.productPrice! > 0
                    ? formatter.format(poster.productPrice)
                    : 'SPECIAL PRICE',
                style: TextStyle(
                  fontSize: (width * 0.042).clamp(13.0, 18.0),
                  fontWeight: FontWeight.w900,
                  color: theme.priceText,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // Floating Interactive Stickers
  // -------------------------------------------------------------
  Widget _buildInteractiveSticker(
    CanvasStickerItem sticker,
    double width,
    double height,
  ) {
    final isSelected =
        interactive && controller.selectedElementId == sticker.id;

    // Convert relative coordinates (-0.5 to 0.5) to pixel center
    final centerX = width * 0.5 + (sticker.x * width);
    final centerY = height * 0.5 + (sticker.y * height);

    return Positioned(
      left: centerX - 60,
      top: centerY - 25,
      child: GestureDetector(
        onTap: () {
          if (interactive) controller.selectElement(sticker.id);
        },
        onPanUpdate: (details) {
          if (interactive) {
            controller.selectElement(sticker.id);
            controller.updateStickerPosition(
              sticker.id,
              details.delta.dx / width,
              details.delta.dy / height,
            );
          }
        },
        child: Transform.rotate(
          angle: sticker.rotation,
          child: Transform.scale(
            scale: sticker.scale,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: sticker.bgColor,
                    borderRadius: BorderRadius.circular(24),
                    border: isSelected
                        ? Border.all(color: Colors.white, width: 2)
                        : null,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.25),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Text(
                    sticker.label,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.8,
                      color: sticker.textColor,
                    ),
                  ),
                ),
                if (isSelected)
                  Positioned(
                    top: -8,
                    right: -8,
                    child: GestureDetector(
                      onTap: () => controller.removeSticker(sticker.id),
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          LucideIcons.x,
                          size: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
