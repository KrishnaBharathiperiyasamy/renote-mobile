import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';
import '../../../models/poster_model.dart';
import '../../../providers/poster_provider.dart';
import '../../../providers/theme_provider.dart';
import '../../../shared/widgets/app_drawer.dart';
import '../../../shared/widgets/app_header.dart';
import '../models/poster_canvas_state.dart';
import '../models/poster_template_data.dart';
import '../widgets/poster_canvas_view.dart';
import 'poster_editor_screen.dart';

class PostersScreen extends ConsumerStatefulWidget {
  final int initialTabIndex;
  const PostersScreen({super.key, this.initialTabIndex = 0});

  @override
  ConsumerState<PostersScreen> createState() => _PostersScreenState();
}

class _PostersScreenState extends ConsumerState<PostersScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'All';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTabIndex.clamp(0, 1),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      try {
        final uri = GoRouterState.of(context).uri;
        if (uri.queryParameters['theme'] == 'dark') {
          ref.read(themeProvider.notifier).setTheme(ThemeMode.dark);
        } else if (uri.queryParameters['theme'] == 'light') {
          ref.read(themeProvider.notifier).setTheme(ThemeMode.light);
        }
        if (uri.queryParameters['tab'] == 'saved') {
          _tabController.animateTo(1);
        }
      } catch (_) {}
    });
  }

  @override
  void didUpdateWidget(covariant PostersScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialTabIndex != widget.initialTabIndex) {
      _tabController.animateTo(widget.initialTabIndex.clamp(0, 1));
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _openEditor({PosterModel? poster, PosterTemplateInfo? template}) {
    PosterModel target;
    if (poster != null) {
      target = poster;
    } else if (template != null) {
      target = PosterModel(
        id: '',
        posterId: 'POS-${DateTime.now().millisecondsSinceEpoch % 10000}',
        posterName: '${template.name} Design',
        posterTitle: 'EXCLUSIVE OFFER',
        productName: 'Special Featured Product',
        productDescription:
            'Get premium quality with limited time special discount.',
        productPrice: 1999.0,
        template: template.id,
        templateCategory: template.category,
        colorThemeId: 'flame-orange',
        aspectRatio: '3:4',
      );
    } else {
      target = PosterModel(
        id: '',
        posterId: 'POS-${DateTime.now().millisecondsSinceEpoch % 10000}',
        posterName: 'Custom Poster',
        posterTitle: 'SUPER SALE',
        productName: 'Featured Product',
        productDescription: 'High quality and best market price guaranteed.',
        productPrice: 999.0,
        template: 'frame1',
        templateCategory: 'Classic',
        colorThemeId: 'flame-orange',
        aspectRatio: '3:4',
      );
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PosterEditorScreen(initialPoster: target),
      ),
    );
  }

  final Set<String> _deletingPosterIds = {};

  void _confirmDelete(PosterModel poster) {
    if (_deletingPosterIds.contains(poster.id)) return;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        title: Text(
          'Delete Poster?',
          style: TextStyle(
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
        content: Text(
          'Are you sure you want to delete "${poster.posterName}"?',
          style: TextStyle(
            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: TextStyle(
                color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              ),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(ctx);
              setState(() => _deletingPosterIds.add(poster.id));
              final error = await ref
                  .read(posterProvider.notifier)
                  .deletePoster(poster.id);
              if (mounted) {
                setState(() => _deletingPosterIds.remove(poster.id));
              }
              if (error == null) {
                messenger.showSnackBar(
                  SnackBar(
                    backgroundColor: AppColors.success,
                    content: Text('Poster "${poster.posterName}" deleted successfully'),
                  ),
                );
              } else {
                messenger.showSnackBar(
                  SnackBar(
                    backgroundColor: AppColors.danger,
                    content: Text(error),
                  ),
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.scaffoldBg,
      appBar: const AppHeader(title: 'Poster Studio'),
      drawer: const AppDrawer(),
      body: Column(
        children: [
          // Top Navigation Tabs
          Container(
            color: isDark ? AppColors.darkSurface : Colors.white,
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              labelColor: AppColors.primary,
              unselectedLabelColor:
                  isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
              labelStyle: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
              tabs: const [
                Tab(
                  icon: Icon(LucideIcons.layoutTemplate, size: 18),
                  text: 'Templates Gallery',
                ),
                Tab(
                  icon: Icon(LucideIcons.folderHeart, size: 18),
                  text: 'My Saved Posters',
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildTemplatesGallery(isDark),
                _buildSavedPosters(isDark),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        onPressed: () => _openEditor(),
        icon: const Icon(LucideIcons.sparkles, color: Colors.white),
        label: const Text(
          'Create Poster',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  // -------------------------------------------------------------
  // TAB 1: Templates Gallery
  // -------------------------------------------------------------
  Widget _buildTemplatesGallery(bool isDark) {
    final search = _searchController.text.toLowerCase();
    final templates = PosterDefinitions.templates.where((t) {
      if (_selectedCategory != 'All' && t.category != _selectedCategory) {
        return false;
      }
      if (search.isNotEmpty) {
        final matchesName = t.name.toLowerCase().contains(search);
        final matchesDesc = t.description.toLowerCase().contains(search);
        return matchesName || matchesDesc;
      }
      return true;
    }).toList();

    return Column(
      children: [
        // Search & Category Filters (Aligned to 14px horizontal margin)
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
          child: SizedBox(
            height: 44,
            child: TextField(
              controller: _searchController,
              onChanged: (_) => setState(() {}),
              style: TextStyle(
                fontSize: 13,
                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
              decoration: InputDecoration(
                hintText: 'Search poster templates...',
                hintStyle: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppColors.darkTextMuted : Colors.grey.shade400,
                ),
                prefixIcon: Icon(
                  LucideIcons.search,
                  size: 18,
                  color:
                      isDark ? AppColors.darkTextSecondary : Colors.grey.shade600,
                ),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: Icon(
                          LucideIcons.x,
                          size: 16,
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : Colors.grey.shade600,
                        ),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {});
                        },
                      )
                    : null,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 0,
                ),
                filled: true,
                fillColor: isDark ? AppColors.darkInputBg : Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: isDark
                        ? AppColors.darkInputBorder
                        : Colors.grey.shade300,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide(
                    color: isDark
                        ? AppColors.darkInputBorder
                        : Colors.grey.shade300,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
          ),
        ),

        // Category Pills (Aligned with 14px horizontal padding)
        SizedBox(
          height: 38,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            itemCount: PosterDefinitions.categories.length,
            itemBuilder: (context, i) {
              final cat = PosterDefinitions.categories[i];
              final isSel = _selectedCategory == cat;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text(cat, style: const TextStyle(fontSize: 12)),
                  selected: isSel,
                  showCheckmark: false,
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                  labelPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  backgroundColor:
                      isDark ? AppColors.darkInputBg : Colors.white,
                  selectedColor: AppColors.primary.withValues(alpha: 0.15),
                  side: BorderSide(
                    color: isSel
                        ? AppColors.primary
                        : (isDark
                            ? AppColors.darkInputBorder
                            : Colors.grey.shade300),
                  ),
                  labelStyle: TextStyle(
                    color: isSel
                        ? AppColors.primary
                        : (isDark
                            ? AppColors.darkTextPrimary
                            : AppColors.textPrimary),
                    fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                  ),
                  onSelected: (_) => setState(() => _selectedCategory = cat),
                ),
              );
            },
          ),
        ),

        const SizedBox(height: 10),

        // Templates Grid (Two equal columns, 14px margins, 12px cross spacing, 84px bottom for FAB)
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.fromLTRB(14, 4, 14, 84),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 14,
              childAspectRatio: 0.65,
            ),
            itemCount: templates.length,
            itemBuilder: (context, i) {
              final template = templates[i];
              return _buildTemplateCard(template, isDark);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildTemplateCard(PosterTemplateInfo template, bool isDark) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Visual Card Header Banner (Expands full width so badge never clips)
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: template.primaryColor.withValues(
                  alpha: isDark ? 0.15 : 0.08,
                ),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(15),
                ),
              ),
              child: Stack(
                fit: StackFit.expand,
                alignment: Alignment.center,
                children: [
                  Center(
                    child: Icon(
                      LucideIcons.layoutTemplate,
                      size: 44,
                      color: template.primaryColor.withValues(alpha: 0.75),
                    ),
                  ),
                  // Category Badge (Positioned top-right with complete text)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 3,
                      ),
                      decoration: BoxDecoration(
                        color: template.primaryColor,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        template.category.toUpperCase(),
                        maxLines: 1,
                        style: const TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.2,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content Details Section (Uniform heights and vertical alignment across cards)
          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  template.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12.5,
                    color: isDark
                        ? AppColors.darkTextPrimary
                        : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                SizedBox(
                  height: 26,
                  child: Text(
                    template.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 10,
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.textSecondary,
                      height: 1.25,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  height: 32,
                  child: ElevatedButton(
                    onPressed: () => _openEditor(template: template),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: template.primaryColor,
                      padding: EdgeInsets.zero,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text(
                      'Use Template',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
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
  // TAB 2: My Saved Posters
  // -------------------------------------------------------------
  Widget _buildSavedPosters(bool isDark) {
    final posterState = ref.watch(posterProvider);
    final posters = posterState.filteredPosters;

    if (posterState.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        // Filter & Search Header (Aligned with 14px horizontal margin)
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 8),
          child: Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 44,
                  child: TextField(
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark
                          ? AppColors.darkTextPrimary
                          : AppColors.textPrimary,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search my posters...',
                      hintStyle: TextStyle(
                        fontSize: 13,
                        color: isDark
                            ? AppColors.darkTextMuted
                            : Colors.grey.shade400,
                      ),
                      prefixIcon: Icon(
                        LucideIcons.search,
                        size: 18,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : Colors.grey.shade600,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 0,
                      ),
                      filled: true,
                      fillColor: isDark ? AppColors.darkInputBg : Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark
                              ? AppColors.darkInputBorder
                              : Colors.grey.shade300,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(
                          color: isDark
                              ? AppColors.darkInputBorder
                              : Colors.grey.shade300,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                    ),
                    onChanged: (val) =>
                        ref.read(posterProvider.notifier).setSearch(val),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                height: 44,
                width: 44,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkInputBg : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark
                        ? AppColors.darkInputBorder
                        : Colors.grey.shade300,
                  ),
                ),
                child: IconButton(
                  icon: Icon(
                    posterState.favoritesOnly
                        ? Icons.favorite
                        : Icons.favorite_border,
                    color: posterState.favoritesOnly
                        ? Colors.red
                        : (isDark
                            ? AppColors.darkTextSecondary
                            : Colors.grey.shade600),
                    size: 20,
                  ),
                  onPressed: () =>
                      ref.read(posterProvider.notifier).toggleFavoritesOnly(),
                  tooltip: 'Favorites Only',
                ),
              ),
            ],
          ),
        ),

        // Saved Posters List / Grid
        Expanded(
          child: posters.isEmpty
              ? _buildEmptyState(isDark)
              : RefreshIndicator(
                  onRefresh: () =>
                      ref.read(posterProvider.notifier).loadPosters(),
                  child: GridView.builder(
                    padding: const EdgeInsets.fromLTRB(14, 4, 14, 84),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 14,
                          childAspectRatio: 0.65,
                        ),
                    itemCount: posters.length,
                    itemBuilder: (context, i) {
                      final poster = posters[i];
                      return _buildSavedPosterCard(poster, isDark);
                    },
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildSavedPosterCard(PosterModel poster, bool isDark) {
    final previewController = PosterEditorController(initialPoster: poster);

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Poster Canvas Thumbnail (Full width thumbnail)
          Expanded(
            child: ClipRRect(
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(15),
              ),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Positioned.fill(
                    child: PosterCanvasView(
                      controller: previewController,
                      interactive: false,
                    ),
                  ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: GestureDetector(
                      onTap: () => ref
                          .read(posterProvider.notifier)
                          .toggleFavorite(poster.id),
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: (isDark ? AppColors.darkSurface : Colors.white)
                              .withValues(alpha: 0.85),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          poster.isFavorite
                              ? Icons.favorite
                              : Icons.favorite_border,
                          size: 16,
                          color: poster.isFavorite
                              ? Colors.red
                              : (isDark
                                  ? AppColors.darkTextSecondary
                                  : Colors.grey.shade700),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  poster.posterName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: isDark
                        ? AppColors.darkTextPrimary
                        : AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  poster.productName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(
                        LucideIcons.pencil,
                        size: 16,
                        color: AppColors.primary,
                      ),
                      visualDensity: VisualDensity.compact,
                      onPressed: () => _openEditor(poster: poster),
                      tooltip: 'Edit Poster',
                    ),
                    if (_deletingPosterIds.contains(poster.id))
                      const Padding(
                        padding: EdgeInsets.all(8.0),
                        child: SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: AppColors.danger,
                          ),
                        ),
                      )
                    else
                      IconButton(
                        icon: const Icon(
                          LucideIcons.trash2,
                          size: 16,
                          color: AppColors.danger,
                        ),
                        visualDensity: VisualDensity.compact,
                        onPressed: () => _confirmDelete(poster),
                        tooltip: 'Delete Poster',
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.sparkles,
                size: 40,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'No Posters Found',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color:
                    isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Create stunning promotional posters using our templates gallery or start from scratch.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: isDark
                    ? AppColors.darkTextSecondary
                    : AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => _tabController.animateTo(0),
              icon: const Icon(LucideIcons.layoutTemplate, size: 16),
              label: const Text('Browse Templates'),
            ),
          ],
        ),
      ),
    );
  }
}
