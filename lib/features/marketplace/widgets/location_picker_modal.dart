import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';
import '../../../services/location_service.dart';

class LocationPickerModal extends StatefulWidget {
  final String currentCity;
  final ValueChanged<String> onLocationSelected;
  final List<String> availableCities;

  const LocationPickerModal({
    super.key,
    required this.currentCity,
    required this.onLocationSelected,
    this.availableCities = const [],
  });

  static Future<void> show({
    required BuildContext context,
    required String currentCity,
    required ValueChanged<String> onLocationSelected,
    List<String> availableCities = const [],
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => LocationPickerModal(
        currentCity: currentCity,
        onLocationSelected: onLocationSelected,
        availableCities: availableCities,
      ),
    );
  }

  @override
  State<LocationPickerModal> createState() => _LocationPickerModalState();
}

class _LocationPickerModalState extends State<LocationPickerModal> {
  final TextEditingController _searchController = TextEditingController();
  final LocationService _locationService = LocationService();
  bool _isLocating = false;
  String? _errorMessage;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim();
        _errorMessage = null;
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleCurrentLocation() async {
    setState(() {
      _isLocating = true;
      _errorMessage = null;
    });

    final result = await _locationService.getCurrentCity();

    if (!mounted) return;

    setState(() {
      _isLocating = false;
    });

    if (result.success && result.cityName != null && result.cityName!.isNotEmpty) {
      widget.onLocationSelected(result.cityName!);
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(LucideIcons.mapPin, color: Colors.white, size: 16),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Location set to ${result.cityName}'),
              ),
            ],
          ),
          backgroundColor: AppColors.primary,
          duration: const Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } else {
      setState(() {
        _errorMessage = result.errorMessage ?? 'Could not detect current location.';
      });
    }
  }

  void _selectLocation(String city) {
    widget.onLocationSelected(city);
    Navigator.of(context).pop();
  }

  List<Map<String, String>> _getFilteredCities() {
    final Set<String> cityNames = {};
    final List<Map<String, String>> list = [];

    // Predefined popular cities
    for (final c in LocationService.popularCities) {
      final name = c['name'] as String;
      final label = c['label'] as String;
      if (!cityNames.contains(name.toLowerCase())) {
        cityNames.add(name.toLowerCase());
        list.add({'name': name, 'label': label});
      }
    }

    // Include dynamically available cities from items if any
    for (final c in widget.availableCities) {
      if (c.trim().isNotEmpty && !cityNames.contains(c.toLowerCase().trim())) {
        cityNames.add(c.toLowerCase().trim());
        list.add({'name': c.trim(), 'label': c.trim()});
      }
    }

    if (_searchQuery.isEmpty) {
      return list;
    }

    final q = _searchQuery.toLowerCase();
    return list.where((item) {
      return item['name']!.toLowerCase().contains(q) ||
          item['label']!.toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final filteredCities = _getFilteredCities();
    final isCustomQuery = _searchQuery.isNotEmpty &&
        !filteredCities.any(
          (c) => c['name']!.toLowerCase() == _searchQuery.toLowerCase(),
        );

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.75,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Modal Handle Bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 6),
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkInputBorder : Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 4, 12, 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin, color: AppColors.primary, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Select Location',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: Icon(
                      LucideIcons.x,
                      size: 20,
                      color: isDark ? AppColors.darkTextSecondary : Colors.grey,
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // Location Search Input Field
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _searchController,
                autofocus: false,
                style: TextStyle(
                  fontSize: 13,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
                decoration: InputDecoration(
                  hintText: 'Search city or area (e.g. Coimbatore, RS Puram)...',
                  hintStyle: TextStyle(
                    fontSize: 13,
                    color: isDark ? AppColors.darkTextMuted : Colors.grey.shade400,
                  ),
                  prefixIcon: Icon(
                    LucideIcons.search,
                    size: 18,
                    color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: Icon(
                            LucideIcons.x,
                            size: 16,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                          onPressed: () => _searchController.clear(),
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  filled: true,
                  fillColor: isDark ? AppColors.darkInputBg : const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: isDark ? AppColors.darkInputBorder : Colors.grey.shade300,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: isDark ? AppColors.darkInputBorder : Colors.grey.shade300,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primary),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 10),

            // Error Message Banner (if GPS failed / permission denied)
            if (_errorMessage != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    Icon(LucideIcons.alertCircle, size: 16, color: Colors.red.shade700),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: TextStyle(fontSize: 12, color: Colors.red.shade800),
                      ),
                    ),
                  ],
                ),
              ),

            // Quick Actions: Current Location & All Locations
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Column(
                children: [
                  // 1. Current Location Option (GPS)
                  InkWell(
                    onTap: _isLocating ? null : _handleCurrentLocation,
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: AppColors.primary,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: _isLocating
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      color: Colors.white,
                                    ),
                                  )
                                : const Icon(
                                    LucideIcons.locateFixed,
                                    color: Colors.white,
                                    size: 15,
                                  ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _isLocating
                                      ? 'Detecting current location...'
                                      : 'Use Current Location',
                                  style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: AppColors.primary,
                                  ),
                                ),
                                const Text(
                                  'Using device GPS',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            LucideIcons.chevronRight,
                            size: 16,
                            color: AppColors.primary,
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // 2. All Locations Option (Reset Location)
                  InkWell(
                    onTap: () => _selectLocation('All'),
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                      decoration: BoxDecoration(
                        color: widget.currentCity == 'All'
                            ? (isDark ? AppColors.darkSurface : const Color(0xFFF1F5F9))
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: widget.currentCity == 'All'
                              ? AppColors.primary
                              : (isDark ? AppColors.darkCardBorder : Colors.grey.shade200),
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.darkInputBg : Colors.grey.shade200,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              LucideIcons.globe,
                              color: isDark ? AppColors.darkTextSecondary : Colors.grey.shade700,
                              size: 15,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'All Locations (No location filter)',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                              ),
                            ),
                          ),
                          if (widget.currentCity == 'All')
                            const Icon(
                              LucideIcons.check,
                              size: 16,
                              color: AppColors.primary,
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Divider(
              height: 16,
              color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
            ),

            // Suggestions / Results List
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
              child: Text(
                _searchQuery.isEmpty ? 'Popular Cities' : 'Suggested Locations',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
            ),

            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                children: [
                  // Custom typed query option if typed text doesn't match an existing name exactly
                  if (isCustomQuery)
                    ListTile(
                      dense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                      leading: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          LucideIcons.search,
                          size: 14,
                          color: AppColors.primary,
                        ),
                      ),
                      title: Text(
                        'Use "$_searchQuery"',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                      subtitle: Text(
                        'Search marketplace products in this location',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                        ),
                      ),
                      trailing: const Icon(
                        LucideIcons.arrowRight,
                        size: 14,
                        color: AppColors.primary,
                      ),
                      onTap: () => _selectLocation(_searchQuery),
                    ),

                  // City suggestions
                  if (filteredCities.isEmpty && !isCustomQuery)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: Text(
                          'No matching cities found',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    )
                  else
                    ...filteredCities.map((city) {
                      final name = city['name']!;
                      final label = city['label']!;
                      final isSelected = widget.currentCity.toLowerCase() == name.toLowerCase();

                      return ListTile(
                        dense: true,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 4),
                        leading: Icon(
                          LucideIcons.mapPin,
                          size: 16,
                          color: isSelected
                              ? AppColors.primary
                              : (isDark ? AppColors.darkTextSecondary : Colors.grey.shade500),
                        ),
                        title: Text(
                          name,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected
                                ? AppColors.primary
                                : (isDark ? AppColors.darkTextPrimary : AppColors.textPrimary),
                          ),
                        ),
                        subtitle: label != name
                            ? Text(
                                label,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
                                ),
                              )
                            : null,
                        trailing: isSelected
                            ? const Icon(
                                LucideIcons.check,
                                size: 16,
                                color: AppColors.primary,
                              )
                            : null,
                        onTap: () => _selectLocation(name),
                      );
                    }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
