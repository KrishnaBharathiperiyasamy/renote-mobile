import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../models/marketplace_item_model.dart';
import '../../../providers/marketplace_provider.dart';

class ProductDetailsScreen extends ConsumerStatefulWidget {
  final MarketplaceItemModel item;

  const ProductDetailsScreen({super.key, required this.item});

  @override
  ConsumerState<ProductDetailsScreen> createState() =>
      _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends ConsumerState<ProductDetailsScreen> {
  late MarketplaceItemModel _item;
  double _userRating = 5.0;

  @override
  void initState() {
    super.initState();
    _item = widget.item;
  }

  Future<void> _makeCall(String phoneNumber) async {
    final clean = phoneNumber.replaceAll(RegExp(r'\D'), '');
    final uri = Uri.parse('tel:$clean');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Could not open phone dialer for $phoneNumber'),
          ),
        );
      }
    }
  }

  Future<void> _openWhatsApp(String phone, String title, double price) async {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    final waNumber = clean.length == 10 ? '91$clean' : clean;
    final message =
        'Hi, I am interested in your ReNote listing: $title (₹${price.toStringAsFixed(0)})';
    final uri = Uri.parse(
      'https://wa.me/$waNumber?text=${Uri.encodeComponent(message)}',
    );

    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not launch WhatsApp')),
        );
      }
    }
  }

  Future<void> _shareListing() async {
    final text =
        'Check out "${_item.title}" on ReNote Marketplace for ₹${_item.price.toStringAsFixed(0)}!\nContact Seller: ${_item.phone}';
    // ignore: deprecated_member_use
    await Share.share(text, subject: _item.title);
  }

  void _showRatingDialog() {
    double tempRating = _userRating;
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('Rate this Product'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'How would you rate your experience with this listing?',
                style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final starVal = index + 1;
                  return IconButton(
                    icon: Icon(
                      starVal <= tempRating ? Icons.star : Icons.star_border,
                      color: const Color(0xFFFFB800),
                      size: 32,
                    ),
                    onPressed: () {
                      setDialogState(() => tempRating = starVal.toDouble());
                    },
                  );
                }),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                Navigator.pop(ctx);
                setState(() => _userRating = tempRating);
                await ref
                    .read(marketplaceProvider.notifier)
                    .rateItem(_item.id, tempRating);
                if (mounted) {
                  messenger.showSnackBar(
                    const SnackBar(content: Text('Thank you for rating!')),
                  );
                }
              },
              child: const Text('Submit Rating'),
            ),
          ],
        ),
      ),
    );
  }

  void _showFullscreenImage(String imageUrl) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.transparent,
            foregroundColor: Colors.white,
          ),
          body: Center(
            child: InteractiveViewer(
              child: CachedNetworkImage(
                imageUrl: imageUrl,
                fit: BoxFit.contain,
                errorWidget: (ctx, url, err) => const Center(
                  child: Icon(
                    Icons.broken_image,
                    color: Colors.white54,
                    size: 64,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final marketplaceState = ref.watch(marketplaceProvider);
    final isFav = marketplaceState.isItemFavorite(_item);
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    final resolvedImageUrl = ApiConstants.resolveImageUrl(_item.image);

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.scaffoldBg,
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _item.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(
              isFav ? Icons.favorite : Icons.favorite_border,
              color: isFav ? Colors.red : (isDark ? AppColors.darkTextSecondary : AppColors.textSecondary),
            ),
            onPressed: () {
              ref.read(marketplaceProvider.notifier).toggleFavorite(_item.id);
            },
          ),
          IconButton(
            icon: Icon(
              LucideIcons.share2,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              size: 20,
            ),
            onPressed: _shareListing,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // -----------------------------------------------------------
            // 1. Hero Image / Gallery View
            // -----------------------------------------------------------
            GestureDetector(
              onTap: () {
                if (resolvedImageUrl.isNotEmpty) {
                  _showFullscreenImage(resolvedImageUrl);
                }
              },
              child: Container(
                width: double.infinity,
                height: 280,
                color: Colors.black,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (resolvedImageUrl.isNotEmpty)
                      CachedNetworkImage(
                        imageUrl: resolvedImageUrl,
                        fit: BoxFit.contain,
                        placeholder: (ctx, url) => const Center(
                          child: CircularProgressIndicator(
                            color: AppColors.primary,
                          ),
                        ),
                        errorWidget: (ctx, url, err) => Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                LucideIcons.store,
                                size: 54,
                                color: Colors.white.withValues(alpha: 0.5),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'No Image Available',
                                style: TextStyle(
                                  color: Colors.white54,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              LucideIcons.store,
                              size: 54,
                              color: Colors.white.withValues(alpha: 0.5),
                            ),
                            const SizedBox(height: 8),
                            const Text(
                              'No Image Available',
                              style: TextStyle(
                                color: Colors.white54,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                    Positioned(
                      bottom: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.7),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              LucideIcons.maximize2,
                              size: 12,
                              color: Colors.white,
                            ),
                            SizedBox(width: 4),
                            Text(
                              'Tap to zoom',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (_item.isSold)
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'SOLD OUT',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            // -----------------------------------------------------------
            // 2. Pricing & Category Summary
            // -----------------------------------------------------------
            Container(
              color: isDark ? AppColors.darkCard : Colors.white,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          _item.category.toUpperCase(),
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.darkSurface : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isDark ? AppColors.darkCardBorder : Colors.grey.shade300,
                          ),
                        ),
                        child: Text(
                          _item.condition,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppColors.darkTextSecondary : Colors.grey.shade700,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _item.title,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    formatter.format(_item.price),
                    style: const TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(
                        LucideIcons.mapPin,
                        size: 14,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _item.location,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Icon(
                        LucideIcons.clock,
                        size: 14,
                        color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _item.timeAgo,
                        style: TextStyle(
                          fontSize: 12,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // -----------------------------------------------------------
            // 3. Seller & Merchant Profile Card
            // -----------------------------------------------------------
            Container(
              color: isDark ? AppColors.darkCard : Colors.white,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Seller & Business Info',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            _item.companyName.isNotEmpty
                                ? _item.companyName[0].toUpperCase()
                                : 'M',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    _item.companyName,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(
                                  LucideIcons.badgeCheck,
                                  size: 16,
                                  color: Colors.blue,
                                ),
                              ],
                            ),
                            if (_item.sellerName != null &&
                                _item.sellerName!.isNotEmpty)
                              Text(
                                'Rep: ${_item.sellerName!}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                ),
                              ),
                            if (_item.companyGst != null &&
                                _item.companyGst!.isNotEmpty)
                              Text(
                                'GSTIN: ${_item.companyGst!}',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? AppColors.darkTextMuted : Colors.grey.shade600,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // -----------------------------------------------------------
            // 4. Detailed Description Card
            // -----------------------------------------------------------
            Container(
              color: isDark ? AppColors.darkCard : Colors.white,
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Description',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _item.description != null &&
                            _item.description!.trim().isNotEmpty
                        ? _item.description!
                        : 'No additional specifications provided for this product.',
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                      height: 1.45,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 10),

            // -----------------------------------------------------------
            // 5. Ratings & Feedback
            // -----------------------------------------------------------
            Container(
              color: isDark ? AppColors.darkCard : Colors.white,
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.star,
                            color: Color(0xFFFFB800),
                            size: 22,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _item.averageRating.toStringAsFixed(1),
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '(${_item.ratingsCount} ratings)',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_item.viewsCount} views • ${_item.likesCount} interested buyers',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  OutlinedButton.icon(
                    onPressed: _showRatingDialog,
                    icon: const Icon(Icons.star_outline, size: 16),
                    label: const Text('Rate', style: TextStyle(fontSize: 12)),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 100), // Spacing for bottom floating bar
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.1),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              // Call Seller Button
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _makeCall(_item.phone),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: const Icon(
                    LucideIcons.phone,
                    size: 16,
                    color: Colors.white,
                  ),
                  label: const Text(
                    'Call Seller',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              // WhatsApp Button
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () =>
                      _openWhatsApp(_item.whatsapp, _item.title, _item.price),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF25D366),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  icon: const Icon(
                    LucideIcons.messageSquare,
                    size: 16,
                    color: Colors.white,
                  ),
                  label: const Text(
                    'WhatsApp',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
