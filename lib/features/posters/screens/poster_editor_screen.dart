import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/poster_model.dart';
import '../../../providers/poster_provider.dart';
import '../models/poster_canvas_state.dart';
import '../models/poster_template_data.dart';
import '../widgets/poster_canvas_view.dart';

class PosterEditorScreen extends ConsumerStatefulWidget {
  final PosterModel? initialPoster;

  const PosterEditorScreen({super.key, this.initialPoster});

  @override
  ConsumerState<PosterEditorScreen> createState() => _PosterEditorScreenState();
}

class _PosterEditorScreenState extends ConsumerState<PosterEditorScreen>
    with SingleTickerProviderStateMixin {
  late final PosterEditorController _controller;
  late final TabController _tabController;
  final GlobalKey _repaintBoundaryKey = GlobalKey();
  final ImagePicker _imagePicker = ImagePicker();

  // Text editing controllers
  late final TextEditingController _titleController;
  late final TextEditingController _productNameController;
  late final TextEditingController _descriptionController;
  late final TextEditingController _priceController;

  bool _isExporting = false;
  String _selectedTemplateCategory = 'All';

  @override
  void initState() {
    super.initState();
    final poster =
        widget.initialPoster ??
        PosterModel(
          id: '',
          posterId: 'POS-${DateTime.now().millisecondsSinceEpoch % 10000}',
          posterName: 'New Campaign Poster',
          posterTitle: 'MEGA SALE 50% OFF',
          productName: 'Premium Wireless Headphones',
          productDescription:
              'Noise cancelling with 40-hour ultra battery life.',
          productPrice: 2499.0,
          template: 'frame1',
          templateCategory: 'Classic',
          colorThemeId: 'flame-orange',
          aspectRatio: '3:4',
        );

    _controller = PosterEditorController(initialPoster: poster);
    _tabController = TabController(length: 5, vsync: this);

    _titleController = TextEditingController(text: poster.posterTitle);
    _productNameController = TextEditingController(text: poster.productName);
    _descriptionController = TextEditingController(
      text: poster.productDescription ?? '',
    );
    _priceController = TextEditingController(
      text: poster.productPrice != null
          ? poster.productPrice!.toStringAsFixed(0)
          : '',
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _tabController.dispose();
    _titleController.dispose();
    _productNameController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _exportAndShare() async {
    setState(() => _isExporting = true);
    final messenger = ScaffoldMessenger.of(context);

    try {
      final boundary =
          _repaintBoundaryKey.currentContext?.findRenderObject()
              as RenderRepaintBoundary?;
      if (boundary == null) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Canvas not ready for export.')),
        );
        setState(() => _isExporting = false);
        return;
      }

      final ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      final ByteData? byteData = await image.toByteData(
        format: ui.ImageByteFormat.png,
      );

      if (byteData == null) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Failed to encode image data.')),
        );
        setState(() => _isExporting = false);
        return;
      }

      final Uint8List pngBytes = byteData.buffer.asUint8List();

      messenger.showSnackBar(
        const SnackBar(
          content: Text('Poster exported! Opening share sheet...'),
          backgroundColor: AppColors.success,
        ),
      );

      if (kIsWeb) {
        // ignore: deprecated_member_use
        await Share.shareXFiles(
          [
            XFile.fromData(
              pngBytes,
              mimeType: 'image/png',
              name:
                  'renote_poster_${DateTime.now().millisecondsSinceEpoch}.png',
            ),
          ],
          text:
              'Created with ReNote Mobile Studio - ${_controller.poster.posterTitle}',
        );
      } else {
        final tempDir = await getTemporaryDirectory();
        final filePath =
            '${tempDir.path}/renote_poster_${DateTime.now().millisecondsSinceEpoch}.png';
        final file = File(filePath);
        await file.writeAsBytes(pngBytes);

        // ignore: deprecated_member_use
        await Share.shareXFiles(
          [XFile(filePath)],
          text:
              'Created with ReNote Mobile Studio - ${_controller.poster.posterTitle}',
        );
      }
    } catch (e) {
      messenger.showSnackBar(SnackBar(content: Text('Export failed: $e')));
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _savePoster() async {
    final messenger = ScaffoldMessenger.of(context);
    final posterToSave = _controller.preparePosterForSave();

    final result = await ref
        .read(posterProvider.notifier)
        .savePoster(posterToSave);

    if (result != null) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Poster "${result.posterName}" saved successfully!'),
          backgroundColor: AppColors.success,
        ),
      );
    } else {
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Failed to save poster. Check connection.'),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  Future<void> _pickImage({
    required bool isProduct,
    required ImageSource source,
  }) async {
    try {
      final picked = await _imagePicker.pickImage(
        source: source,
        maxWidth: 1600,
        maxHeight: 1600,
        imageQuality: 90,
      );
      if (picked != null) {
        if (isProduct) {
          _controller.setProductImage(localPath: picked.path);
        } else {
          _controller.setCompanyLogo(localPath: picked.path);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Could not pick image: $e')));
      }
    }
  }

  void _showAspectRatioPicker() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Choose Canvas Ratio',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildRatioOption('3:4', 'Poster (3:4)', Icons.portrait),
                    _buildRatioOption('1:1', 'Square (1:1)', Icons.crop_square),
                    _buildRatioOption(
                      '9:16',
                      'Story (9:16)',
                      Icons.stay_current_portrait,
                    ),
                    _buildRatioOption(
                      '16:9',
                      'Banner (16:9)',
                      Icons.stay_current_landscape,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildRatioOption(String ratio, String label, IconData icon) {
    final isSelected = _controller.poster.aspectRatio == ratio;
    return InkWell(
      onTap: () {
        _controller.setAspectRatio(ratio);
        Navigator.pop(context);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : Colors.grey.shade50,
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : Colors.grey.shade700,
            ),
            const SizedBox(height: 6),
            Text(
              ratio,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
                color: isSelected ? AppColors.primary : Colors.grey.shade800,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final posterState = ref.watch(posterProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: isDark ? AppColors.darkSurface : Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: Icon(
            LucideIcons.arrowLeft,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
          onPressed: () => context.pop(),
        ),
        title: ListenableBuilder(
          listenable: _controller,
          builder: (context, _) => Text(
            _controller.poster.posterName,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
            ),
          ),
        ),
        actions: [
          // Undo Button
          ListenableBuilder(
            listenable: _controller,
            builder: (context, _) => IconButton(
              icon: Icon(
                LucideIcons.undo2,
                size: 20,
                color: _controller.canUndo
                    ? AppColors.textPrimary
                    : Colors.grey.shade300,
              ),
              onPressed: _controller.canUndo ? () => _controller.undo() : null,
              tooltip: 'Undo',
            ),
          ),
          // Redo Button
          ListenableBuilder(
            listenable: _controller,
            builder: (context, _) => IconButton(
              icon: Icon(
                LucideIcons.redo2,
                size: 20,
                color: _controller.canRedo
                    ? AppColors.textPrimary
                    : Colors.grey.shade300,
              ),
              onPressed: _controller.canRedo ? () => _controller.redo() : null,
              tooltip: 'Redo',
            ),
          ),
          // Aspect Ratio Picker Button
          ListenableBuilder(
            listenable: _controller,
            builder: (context, _) => TextButton.icon(
              onPressed: _showAspectRatioPicker,
              icon: const Icon(
                LucideIcons.ratio,
                size: 16,
                color: AppColors.primary,
              ),
              label: Text(
                _controller.poster.aspectRatio,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
            ),
          ),
          // Export & Share Button
          IconButton(
            icon: _isExporting
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(
                    LucideIcons.share2,
                    size: 20,
                    color: AppColors.primary,
                  ),
            onPressed: _isExporting ? null : _exportAndShare,
            tooltip: 'Export & Share',
          ),
          // Save to Backend Button
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: posterState.isSaving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(
                      LucideIcons.save,
                      size: 20,
                      color: AppColors.primary,
                    ),
              onPressed: posterState.isSaving ? null : _savePoster,
              tooltip: 'Save Poster',
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // -------------------------------------------------------------
          // 1. Center Interactive Canvas Viewport
          // -------------------------------------------------------------
          Expanded(
            child: Container(
              color: const Color(0xFFE2E8F0),
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(
                      maxHeight: 460,
                      maxWidth: 380,
                    ),
                    child: PosterCanvasView(
                      controller: _controller,
                      interactive: true,
                      repaintBoundaryKey: _repaintBoundaryKey,
                    ),
                  ),
                ),
              ),
            ),
          ),

          // -------------------------------------------------------------
          // 2. Control Tabs & Bottom Drawer
          // -------------------------------------------------------------
          Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkCard : Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.25 : 0.08),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TabBar(
                  controller: _tabController,
                  isScrollable: false,
                  indicatorColor: AppColors.primary,
                  indicatorWeight: 3,
                  labelColor: AppColors.primary,
                  unselectedLabelColor: AppColors.textSecondary,
                  labelStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                  tabs: const [
                    Tab(
                      icon: Icon(LucideIcons.layoutGrid, size: 18),
                      text: 'Layout',
                    ),
                    Tab(
                      icon: Icon(LucideIcons.palette, size: 18),
                      text: 'Theme',
                    ),
                    Tab(icon: Icon(LucideIcons.type, size: 18), text: 'Text'),
                    Tab(
                      icon: Icon(LucideIcons.image, size: 18),
                      text: 'Images',
                    ),
                    Tab(
                      icon: Icon(LucideIcons.sparkles, size: 18),
                      text: 'Stickers',
                    ),
                  ],
                ),
                SizedBox(
                  height: 220,
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildTemplatesTab(),
                      _buildThemesTab(),
                      _buildTextTab(),
                      _buildImagesTab(),
                      _buildStickersTab(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 1: Layout & Templates
  // -------------------------------------------------------------
  Widget _buildTemplatesTab() {
    final filteredTemplates = _selectedTemplateCategory == 'All'
        ? PosterDefinitions.templates
        : PosterDefinitions.templates
              .where((t) => t.category == _selectedTemplateCategory)
              .toList();

    return Column(
      children: [
        // Category Pills
        SizedBox(
          height: 42,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            itemCount: PosterDefinitions.categories.length,
            itemBuilder: (context, i) {
              final cat = PosterDefinitions.categories[i];
              final isSel = _selectedTemplateCategory == cat;
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: ChoiceChip(
                  label: Text(cat, style: const TextStyle(fontSize: 11)),
                  selected: isSel,
                  selectedColor: AppColors.primary.withValues(alpha: 0.15),
                  labelStyle: TextStyle(
                    color: isSel ? AppColors.primary : AppColors.textPrimary,
                    fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                  ),
                  onSelected: (_) =>
                      setState(() => _selectedTemplateCategory = cat),
                ),
              );
            },
          ),
        ),
        // Templates Horizontal Carousel
        Expanded(
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            itemCount: filteredTemplates.length,
            itemBuilder: (context, i) {
              final template = filteredTemplates[i];
              final isSelected = _controller.poster.template == template.id;

              return GestureDetector(
                onTap: () =>
                    _controller.setTemplate(template.id, template.category),
                child: Container(
                  width: 130,
                  margin: const EdgeInsets.only(right: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : Colors.grey.shade200,
                      width: isSelected ? 2.5 : 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: template.primaryColor.withValues(alpha: 0.1),
                            borderRadius: const BorderRadius.vertical(
                              top: Radius.circular(10),
                            ),
                          ),
                          child: Center(
                            child: Icon(
                              LucideIcons.layoutTemplate,
                              color: template.primaryColor,
                              size: 32,
                            ),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(6),
                        child: Text(
                          template.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.w600,
                            color: isSelected
                                ? AppColors.primary
                                : AppColors.textPrimary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // -------------------------------------------------------------
  // TAB 2: Themes & Color Palettes
  // -------------------------------------------------------------
  Widget _buildThemesTab() {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      itemCount: PosterDefinitions.colorThemes.length,
      itemBuilder: (context, i) {
        final theme = PosterDefinitions.colorThemes[i];
        final isSelected = _controller.poster.colorThemeId == theme.id;

        return GestureDetector(
          onTap: () => _controller.setColorTheme(theme.id),
          child: Container(
            width: 140,
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isSelected ? theme.primaryLight : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected ? theme.primary : Colors.grey.shade200,
                width: isSelected ? 2.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: theme.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: theme.primaryDark,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      theme.name,
                      maxLines: 2,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isSelected
                            ? theme.primary
                            : AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      theme.isDark ? 'Dark Mode' : 'Light Canvas',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey.shade500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // -------------------------------------------------------------
  // TAB 3: Text & Typography
  // -------------------------------------------------------------
  Widget _buildTextTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          TextField(
            controller: _titleController,
            decoration: const InputDecoration(
              labelText: 'Poster Headline / Title',
              isDense: true,
              border: OutlineInputBorder(),
            ),
            onChanged: (val) => _controller.updateTexts(posterTitle: val),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                flex: 3,
                child: TextField(
                  controller: _productNameController,
                  decoration: const InputDecoration(
                    labelText: 'Product / Service Name',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (val) => _controller.updateTexts(productName: val),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 2,
                child: TextField(
                  controller: _priceController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Price (₹)',
                    isDense: true,
                    border: OutlineInputBorder(),
                  ),
                  onChanged: (val) {
                    final p = double.tryParse(val);
                    _controller.updateTexts(productPrice: p);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _descriptionController,
            decoration: const InputDecoration(
              labelText: 'Subtitle or Description',
              isDense: true,
              border: OutlineInputBorder(),
            ),
            onChanged: (val) =>
                _controller.updateTexts(productDescription: val),
          ),
        ],
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 4: Images & Logo Controls
  // -------------------------------------------------------------
  Widget _buildImagesTab() {
    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        final poster = _controller.poster;
        return SingleChildScrollView(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image controls
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Product Image',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () => _pickImage(
                          isProduct: true,
                          source: ImageSource.gallery,
                        ),
                        icon: const Icon(LucideIcons.image, size: 14),
                        label: const Text(
                          'Gallery',
                          style: TextStyle(fontSize: 11),
                        ),
                      ),
                      const SizedBox(width: 6),
                      OutlinedButton.icon(
                        onPressed: () => _pickImage(
                          isProduct: true,
                          source: ImageSource.camera,
                        ),
                        icon: const Icon(LucideIcons.camera, size: 14),
                        label: const Text(
                          'Camera',
                          style: TextStyle(fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Row(
                children: [
                  const Text('Zoom', style: TextStyle(fontSize: 11)),
                  Expanded(
                    child: Slider(
                      value: poster.productZoom,
                      min: 0.5,
                      max: 2.5,
                      activeColor: AppColors.primary,
                      onChanged: (val) => _controller.setProductZoom(val),
                    ),
                  ),
                  Text(
                    '${poster.productZoom.toStringAsFixed(1)}x',
                    style: const TextStyle(fontSize: 11),
                  ),
                ],
              ),
              const Divider(height: 16),
              // Brand Logo controls
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Company Logo',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () => _pickImage(
                          isProduct: false,
                          source: ImageSource.gallery,
                        ),
                        icon: const Icon(LucideIcons.upload, size: 14),
                        label: const Text(
                          'Upload Logo',
                          style: TextStyle(fontSize: 11),
                        ),
                      ),
                      const SizedBox(width: 6),
                      TextButton(
                        onPressed: () =>
                            _controller.setCompanyLogo(localPath: null),
                        child: const Text(
                          'Use ReNote Flame',
                          style: TextStyle(fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Row(
                children: [
                  const Text('Zoom', style: TextStyle(fontSize: 11)),
                  Expanded(
                    child: Slider(
                      value: poster.logoZoom,
                      min: 0.5,
                      max: 2.5,
                      activeColor: AppColors.primary,
                      onChanged: (val) => _controller.setLogoZoom(val),
                    ),
                  ),
                  Text(
                    '${poster.logoZoom.toStringAsFixed(1)}x',
                    style: const TextStyle(fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  // -------------------------------------------------------------
  // TAB 5: Sales Badges & Stickers
  // -------------------------------------------------------------
  Widget _buildStickersTab() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(
            'Tap any badge to add it onto the poster canvas. Drag to position.',
            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
          ),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 2.8,
            ),
            itemCount: PosterDefinitions.stickers.length,
            itemBuilder: (context, i) {
              final sticker = PosterDefinitions.stickers[i];
              return InkWell(
                onTap: () {
                  _controller.addSticker(sticker);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Added "${sticker.label}" to canvas'),
                      duration: const Duration(seconds: 1),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: sticker.bgColor,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: sticker.bgColor.withValues(alpha: 0.3),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Text(
                    sticker.label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: sticker.textColor,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
