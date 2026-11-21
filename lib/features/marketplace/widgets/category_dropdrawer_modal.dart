import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';

class CategoryItem {
  final String id;
  final String label;
  final IconData icon;

  const CategoryItem({
    required this.id,
    required this.label,
    required this.icon,
  });
}

class CategoryDropDrawerModal extends StatelessWidget {
  final String selectedCategory;
  final ValueChanged<String> onCategorySelected;

  const CategoryDropDrawerModal({
    super.key,
    required this.selectedCategory,
    required this.onCategorySelected,
  });

  static const List<CategoryItem> categories = [
    CategoryItem(
      id: 'All',
      label: 'All Categories',
      icon: LucideIcons.layoutGrid,
    ),
    CategoryItem(
      id: 'Electronics',
      label: 'Electronics',
      icon: LucideIcons.laptop,
    ),
    CategoryItem(
      id: 'Fashion',
      label: 'Fashion',
      icon: LucideIcons.shirt,
    ),
    CategoryItem(
      id: 'Home & Living',
      label: 'Home & Living',
      icon: LucideIcons.building,
    ),
    CategoryItem(
      id: 'Books & Education',
      label: 'Books & Education',
      icon: LucideIcons.bookOpen,
    ),
    CategoryItem(
      id: 'Sports & Hobbies',
      label: 'Sports & Hobbies',
      icon: LucideIcons.trophy,
    ),
    CategoryItem(
      id: 'Services',
      label: 'Services',
      icon: LucideIcons.wrench,
    ),
    CategoryItem(
      id: 'Others',
      label: 'Others',
      icon: LucideIcons.package,
    ),
  ];

  static Future<void> show({
    required BuildContext context,
    required String selectedCategory,
    required ValueChanged<String> onCategorySelected,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => CategoryDropDrawerModal(
        selectedCategory: selectedCategory,
        onCategorySelected: onCategorySelected,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasActiveSelection = selectedCategory != 'All';
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).padding.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 10, bottom: 6),
              width: 38,
              height: 4.5,
              decoration: BoxDecoration(
                color: isDark ? AppColors.borderDark : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ),

          // 2. Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 6, 12, 10),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          LucideIcons.layoutGrid,
                          color: AppColors.primary,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Select Category',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: isDark
                                    ? AppColors.darkTextPrimary
                                    : AppColors.textPrimary,
                              ),
                            ),
                            Text(
                              'Choose a category to filter listings',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark
                                    ? AppColors.darkTextSecondary
                                    : Colors.grey.shade500,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (hasActiveSelection)
                      TextButton(
                        onPressed: () {
                          onCategorySelected('All');
                          Navigator.of(context).pop();
                        },
                        style: TextButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Reset',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    IconButton(
                      icon: Icon(
                        LucideIcons.x,
                        size: 20,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : Colors.grey,
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ],
            ),
          ),

          Divider(
            height: 1,
            thickness: 1,
            color: isDark ? AppColors.borderDark : const Color(0xFFF1F5F9),
          ),
          const SizedBox(height: 8),

          // 3. Categories List (Grouped styled card like DropDrawer reference)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkCard : const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark
                      ? AppColors.darkCardBorder
                      : Colors.grey.shade200,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: categories.length,
                  separatorBuilder: (context, index) => Divider(
                    height: 1,
                    thickness: 1,
                    color: isDark
                        ? AppColors.borderDark
                        : Colors.grey.shade200,
                    indent: 52,
                    endIndent: 14,
                  ),
                  itemBuilder: (context, index) {
                    final item = categories[index];
                    final isSelected = selectedCategory.toLowerCase() ==
                        item.id.toLowerCase();

                    return InkWell(
                      onTap: () {
                        onCategorySelected(item.id);
                        Navigator.of(context).pop();
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 12,
                        ),
                        color: isSelected
                            ? AppColors.primary.withValues(alpha: 0.1)
                            : Colors.transparent,
                        child: Row(
                          children: [
                            // Left Icon
                            Container(
                              width: 34,
                              height: 34,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary
                                    : (isDark
                                        ? AppColors.darkInputBg
                                        : Colors.white),
                                borderRadius: BorderRadius.circular(9),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.primary
                                      : (isDark
                                          ? AppColors.darkInputBorder
                                          : Colors.grey.shade200),
                                ),
                              ),
                              child: Icon(
                                item.icon,
                                size: 17,
                                color: isSelected
                                    ? Colors.white
                                    : (isDark
                                        ? AppColors.darkTextSecondary
                                        : Colors.grey.shade700),
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Category Label
                            Expanded(
                              child: Text(
                                item.label,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: isSelected
                                      ? FontWeight.bold
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? AppColors.primary
                                      : (isDark
                                          ? AppColors.darkTextPrimary
                                          : AppColors.textPrimary),
                                ),
                              ),
                            ),

                            // Selection Indicator / Checkmark
                            if (isSelected)
                              Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  LucideIcons.check,
                                  size: 13,
                                  color: Colors.white,
                                ),
                              )
                            else
                              Icon(
                                LucideIcons.chevronRight,
                                size: 16,
                                color: isDark
                                    ? AppColors.darkTextMuted
                                    : Colors.grey.shade400,
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
