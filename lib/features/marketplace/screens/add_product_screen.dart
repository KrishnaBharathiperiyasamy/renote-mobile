import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../core/constants/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/marketplace_provider.dart';
import '../../../services/api_service.dart';
import '../../../services/storage_service.dart';
import '../widgets/location_picker_modal.dart';

class AddProductScreen extends ConsumerStatefulWidget {
  const AddProductScreen({super.key});

  @override
  ConsumerState<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends ConsumerState<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();

  // Text Controllers
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();

  // Categories
  static const List<String> _categories = [
    'Electronics',
    'Fashion',
    'Home & Living',
    'Books & Education',
    'Sports & Hobbies',
    'Vehicles',
    'Services',
    'Others',
  ];

  String _selectedCategory = 'Electronics';
  String? _selectedLocation;
  bool _sameAsPhone = true;

  // Media
  final ImagePicker _picker = ImagePicker();
  final List<XFile> _selectedImages = [];
  XFile? _selectedVideo;
  int _videoSizeBytes = 0;

  // Publishing State
  bool _isPublishing = false;
  String _uploadStatus = '';
  double _uploadProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _initSellerContact();
  }

  void _initSellerContact() {
    final user = ref.read(authProvider).user;
    if (user != null) {
      if (user.phone != null && user.phone!.isNotEmpty) {
        String phone = user.phone!.replaceAll(RegExp(r'\D'), '');
        if (phone.length == 12 && phone.startsWith('91')) {
          phone = phone.substring(2);
        }
        _phoneController.text = phone;
        _whatsappController.text = phone;
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    super.dispose();
  }

  // ── Media Pickers ──

  Future<void> _pickImagesFromGallery() async {
    try {
      final remainingSlots = 5 - _selectedImages.length;
      if (remainingSlots <= 0) {
        _showWarningSnackBar('You can upload a maximum of 5 images.');
        return;
      }

      final List<XFile> pickedList = await _picker.pickMultiImage(
        imageQuality: 85,
        limit: remainingSlots,
      );

      if (pickedList.isNotEmpty) {
        setState(() {
          final toAdd = pickedList.take(remainingSlots);
          _selectedImages.addAll(toAdd);
        });
      }
    } catch (e) {
      _showWarningSnackBar('Failed to pick images: $e');
    }
  }

  Future<void> _capturePhoto() async {
    try {
      if (_selectedImages.length >= 5) {
        _showWarningSnackBar('You can upload a maximum of 5 images.');
        return;
      }

      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
      );

      if (photo != null) {
        setState(() {
          _selectedImages.add(photo);
        });
      }
    } catch (e) {
      _showWarningSnackBar('Failed to capture photo: $e');
    }
  }

  Future<void> _pickVideo(ImageSource source) async {
    try {
      final XFile? video = await _picker.pickVideo(
        source: source,
        maxDuration: const Duration(minutes: 5),
      );

      if (video != null) {
        final length = await video.length();
        const maxBytes = 200 * 1024 * 1024; // 200MB limit

        if (length > maxBytes) {
          _showWarningSnackBar(
            'Video exceeds 200MB limit (${(length / (1024 * 1024)).toStringAsFixed(1)} MB). Please select a smaller file.',
          );
          return;
        }

        setState(() {
          _selectedVideo = video;
          _videoSizeBytes = length;
        });
      }
    } catch (e) {
      _showWarningSnackBar('Failed to select video: $e');
    }
  }

  void _showMediaPickerOptions() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    showModalBottomSheet(
      context: context,
      backgroundColor: isDark ? AppColors.darkCard : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add Media',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.images, color: AppColors.primary),
                ),
                title: const Text('Choose Photos from Gallery'),
                subtitle: const Text('Select multiple photos (up to 5)'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImagesFromGallery();
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.camera, color: AppColors.primary),
                ),
                title: const Text('Take a Photo'),
                subtitle: const Text('Capture using device camera'),
                onTap: () {
                  Navigator.pop(ctx);
                  _capturePhoto();
                },
              ),
              const Divider(),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.video, color: Colors.blue),
                ),
                title: const Text('Upload Product Video'),
                subtitle: const Text('Select from gallery (up to 200MB)'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickVideo(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.clapperboard, color: Colors.blue),
                ),
                title: const Text('Record Product Video'),
                subtitle: const Text('Record using camera'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickVideo(ImageSource.camera);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  void _removeVideo() {
    setState(() {
      _selectedVideo = null;
      _videoSizeBytes = 0;
    });
  }

  void _openLocationSelector() {
    final state = ref.read(marketplaceProvider);
    final availableCities = state.items
        .map((it) => it.location)
        .where((loc) => loc.isNotEmpty)
        .toSet()
        .toList();

    LocationPickerModal.show(
      context: context,
      currentCity: _selectedLocation ?? 'All',
      availableCities: availableCities,
      onLocationSelected: (city) {
        if (city != 'All') {
          setState(() => _selectedLocation = city);
        } else {
          setState(() => _selectedLocation = null);
        }
      },
    );
  }

  void _showWarningSnackBar(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // ── Publish Action ──

  Future<void> _handlePublish() async {
    if (_isPublishing) return;

    // 1. Form Validation
    if (!_formKey.currentState!.validate()) {
      return;
    }

    // 2. Media Validation
    if (_selectedImages.isEmpty && _selectedVideo == null) {
      _showWarningSnackBar('Please upload at least 1 photo or video of the product.');
      return;
    }

    // 3. Location Validation
    if (_selectedLocation == null || _selectedLocation!.isEmpty) {
      _showWarningSnackBar('Please select the product location/city.');
      return;
    }

    // 4. Contact Phone Validation
    final phone = _phoneController.text.trim();
    if (phone.length != 10 || !RegExp(r'^[0-9]{10}$').hasMatch(phone)) {
      _showWarningSnackBar('Please enter a valid 10-digit seller contact phone number.');
      return;
    }

    // 5. Auth Check
    final userId = StorageService().getUserId() ?? ref.read(authProvider).user?.id;
    if (userId == null || userId.isEmpty) {
      _showWarningSnackBar('You must be logged in to publish products.');
      return;
    }

    final price = double.tryParse(_priceController.text.trim()) ?? 0.0;
    if (price <= 0) {
      _showWarningSnackBar('Please enter a valid positive price.');
      return;
    }

    final whatsapp = _sameAsPhone ? phone : _whatsappController.text.trim();

    setState(() {
      _isPublishing = true;
      _uploadProgress = 0.1;
      _uploadStatus = 'Uploading media and creating listing...';
    });

    Timer? webProgressTimer;
    if (kIsWeb) {
      webProgressTimer = Timer.periodic(const Duration(milliseconds: 250), (t) {
        if (!mounted || !_isPublishing) {
          t.cancel();
          return;
        }
        setState(() {
          if (_uploadProgress < 0.85) {
            _uploadProgress += 0.05;
          }
        });
      });
    }

    try {
      final result = await ApiService().publishMarketplaceProduct(
        userId: userId,
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        price: price,
        location: _selectedLocation!,
        category: _selectedCategory,
        phone: phone,
        whatsapp: whatsapp.isNotEmpty ? whatsapp : phone,
        imageFiles: _selectedImages,
        videoFile: _selectedVideo,
        onProgress: (sent, total) {
          if (total > 0 && mounted) {
            setState(() {
              _uploadProgress = (sent / total).clamp(0.1, 0.9);
            });
          }
        },
      );

      webProgressTimer?.cancel();
      if (!mounted) return;

      if (result['success'] == true) {
        setState(() {
          _uploadProgress = 1.0;
          _uploadStatus = 'Published successfully!';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(LucideIcons.checkCircle, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text('Product published to Marketplace successfully!'),
                ),
              ],
            ),
            backgroundColor: Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
          ),
        );

        // Refresh Marketplace feed
        ref.read(marketplaceProvider.notifier).loadFeed();

        // Return to marketplace
        context.pop();
      } else {
        webProgressTimer?.cancel();
        setState(() {
          _isPublishing = false;
        });
        _showWarningSnackBar(
          result['message'] ?? 'Failed to publish product listing.',
        );
      }
    } catch (e) {
      webProgressTimer?.cancel();
      if (mounted) {
        setState(() {
          _isPublishing = false;
        });
        _showWarningSnackBar('An error occurred: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : const Color(0xFFF8F9FC),
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
        title: Text(
          'Add Product Listing',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
        ),
      ),
      body: Stack(
        children: [
          Form(
            key: _formKey,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── SECTION A: PHOTOS & VIDEOS ──
                  _buildSectionCard(
                    title: 'Product Photos & Videos',
                    subtitle:
                        'Upload up to 5 photos and 1 video. The first image serves as the cover photo.',
                    icon: LucideIcons.camera,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Image Grid
                        _buildMediaGrid(),

                        // Video Preview Card (if video selected)
                        if (_selectedVideo != null) ...[
                          const SizedBox(height: 12),
                          _buildVideoCard(),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── SECTION B: PRODUCT DETAILS ──
                  _buildSectionCard(
                    title: 'Product Details',
                    subtitle: 'Provide the title, category, and thorough description.',
                    icon: LucideIcons.fileText,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Product Title
                        TextFormField(
                          controller: _titleController,
                          decoration: InputDecoration(
                            labelText: 'Product Title *',
                            hintText: 'e.g. Apple MacBook Pro M3 16GB / 512GB',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            prefixIcon: const Icon(LucideIcons.tag, size: 18),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return 'Product title is required';
                            }
                            if (val.trim().length < 3) {
                              return 'Title must be at least 3 characters';
                            }
                            return null;
                          },
                        ),

                        const SizedBox(height: 14),

                        // Category Dropdown
                        DropdownButtonFormField<String>(
                          initialValue: _selectedCategory,
                          decoration: InputDecoration(
                            labelText: 'Marketplace Category *',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            prefixIcon: const Icon(LucideIcons.layoutGrid, size: 18),
                          ),
                          items: _categories.map((cat) {
                            return DropdownMenuItem(
                              value: cat,
                              child: Text(cat),
                            );
                          }).toList(),
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _selectedCategory = val);
                            }
                          },
                        ),

                        const SizedBox(height: 14),

                        // Description
                        TextFormField(
                          controller: _descriptionController,
                          maxLines: 4,
                          maxLength: 2000,
                          decoration: InputDecoration(
                            labelText: 'Product Description *',
                            hintText:
                                'Describe specifications, condition (Brand New / Refurbished / Used), warranty, and key features...',
                            alignLabelWithHint: true,
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return 'Product description is required';
                            }
                            if (val.trim().length < 10) {
                              return 'Please provide at least 10 characters';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── SECTION C: PRICING ──
                  _buildSectionCard(
                    title: 'Product Price',
                    subtitle: 'Set a competitive price for buyers.',
                    icon: LucideIcons.indianRupee,
                    child: TextFormField(
                      controller: _priceController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Price (₹) *',
                        hintText: 'e.g. 35000',
                        prefixIcon: const Icon(
                          LucideIcons.indianRupee,
                          color: AppColors.primary,
                          size: 20,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) {
                          return 'Price is required';
                        }
                        final num = double.tryParse(val.trim());
                        if (num == null || num <= 0) {
                          return 'Enter a valid positive price';
                        }
                        return null;
                      },
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── SECTION D: LOCATION ──
                  _buildSectionCard(
                    title: 'Product Location',
                    subtitle: 'Buyers search and filter products by city / area.',
                    icon: LucideIcons.mapPin,
                    child: InkWell(
                      onTap: _openLocationSelector,
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 14,
                        ),
                        decoration: BoxDecoration(
                          color: _selectedLocation != null
                              ? AppColors.primary.withValues(alpha: 0.06)
                              : Colors.white,
                          border: Border.all(
                            color: _selectedLocation != null
                                ? AppColors.primary
                                : Colors.grey.shade400,
                          ),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              LucideIcons.mapPin,
                              size: 20,
                              color: _selectedLocation != null
                                  ? AppColors.primary
                                  : Colors.grey.shade600,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                _selectedLocation ??
                                    'Select City / Location * (Tap to choose or use GPS)',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: _selectedLocation != null
                                      ? FontWeight.bold
                                      : FontWeight.normal,
                                  color: _selectedLocation != null
                                      ? AppColors.primary
                                      : Colors.grey.shade600,
                                ),
                              ),
                            ),
                            if (_selectedLocation != null)
                              GestureDetector(
                                onTap: () => setState(() => _selectedLocation = null),
                                child: const Icon(
                                  LucideIcons.x,
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                              )
                            else
                              const Icon(
                                LucideIcons.chevronRight,
                                size: 18,
                                color: Colors.grey,
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // ── SECTION E: SELLER CONTACT ──
                  _buildSectionCard(
                    title: 'Seller Contact Details',
                    subtitle: 'Allow interested buyers to reach you directly.',
                    icon: LucideIcons.phone,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          maxLength: 10,
                          decoration: InputDecoration(
                            labelText: 'Contact Phone Number (10 digits) *',
                            hintText: 'e.g. 9876543210',
                            prefixText: '+91 ',
                            prefixIcon: const Icon(LucideIcons.phone, size: 18),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          onChanged: (val) {
                            if (_sameAsPhone) {
                              _whatsappController.text = val;
                            }
                          },
                          validator: (val) {
                            if (val == null || val.trim().isEmpty) {
                              return 'Contact phone is required';
                            }
                            if (val.trim().length != 10) {
                              return 'Phone must be exactly 10 digits';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Checkbox(
                              value: _sameAsPhone,
                              activeColor: AppColors.primary,
                              onChanged: (val) {
                                setState(() {
                                  _sameAsPhone = val ?? true;
                                  if (_sameAsPhone) {
                                    _whatsappController.text = _phoneController.text;
                                  }
                                });
                              },
                            ),
                            const Text(
                              'WhatsApp number is same as contact phone',
                              style: TextStyle(fontSize: 13),
                            ),
                          ],
                        ),
                        if (!_sameAsPhone) ...[
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _whatsappController,
                            keyboardType: TextInputType.phone,
                            maxLength: 10,
                            decoration: InputDecoration(
                              labelText: 'WhatsApp Number',
                              hintText: 'e.g. 9876543210',
                              prefixText: '+91 ',
                              prefixIcon:
                                  const Icon(LucideIcons.messageCircle, size: 18),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // ── PUBLISH BUTTON ──
                  SizedBox(
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isPublishing ? null : _handlePublish,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: _isPublishing
                          ? Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  _uploadStatus.isNotEmpty
                                      ? _uploadStatus
                                      : 'Publishing Product...',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            )
                          : const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.uploadCloud, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Publish Product to Marketplace',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ),

                  const SizedBox(height: 36),
                ],
              ),
            ),
          ),

          // Upload Progress Bar
          if (_isPublishing)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                value: _uploadProgress,
                backgroundColor: Colors.transparent,
                color: AppColors.primary,
                minHeight: 4,
              ),
            ),
        ],
      ),
    );
  }

  // ── Helper Widgets ──

  Widget _buildSectionCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required Widget child,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
        ),
        boxShadow: isDark
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 11,
              color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
            ),
          ),
          Divider(
            height: 20,
            color: isDark ? AppColors.darkCardBorder : Colors.grey.shade200,
          ),
          child,
        ],
      ),
    );
  }

  Widget _buildMediaGrid() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            // Add Media Button Card
            InkWell(
              onTap: _showMediaPickerOptions,
              borderRadius: BorderRadius.circular(10),
              child: Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.4),
                    style: BorderStyle.solid,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        LucideIcons.plus,
                        color: AppColors.primary,
                        size: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Add Media',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppColors.primary,
                      ),
                    ),
                    Text(
                      '${_selectedImages.length}/5 photos',
                      style: TextStyle(
                        fontSize: 9,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Selected Images
            ..._selectedImages.asMap().entries.map((entry) {
              final index = entry.key;
              final image = entry.value;

              return Stack(
                children: [
                  Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: index == 0 ? AppColors.primary : Colors.grey.shade300,
                        width: index == 0 ? 2 : 1,
                      ),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: kIsWeb
                        ? Image.network(
                            image.path,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                const Center(
                              child: Icon(LucideIcons.image, color: Colors.grey),
                            ),
                          )
                        : Image.file(
                            File(image.path),
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                const Center(
                              child: Icon(LucideIcons.image, color: Colors.grey),
                            ),
                          ),
                  ),

                  // "Cover" badge on first image
                  if (index == 0)
                    Positioned(
                      top: 4,
                      left: 4,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 4,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'Cover',
                          style: TextStyle(
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),

                  // Delete button
                  Positioned(
                    top: 2,
                    right: 2,
                    child: GestureDetector(
                      onTap: () => _removeImage(index),
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          LucideIcons.x,
                          size: 12,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }),
          ],
        ),
      ],
    );
  }

  Widget _buildVideoCard() {
    final sizeMb = (_videoSizeBytes / (1024 * 1024)).toStringAsFixed(1);
    final name = _selectedVideo?.name ?? 'Product Video';

    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.blue,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(LucideIcons.video, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
                Text(
                  'Product Video • $sizeMb MB',
                  style: TextStyle(fontSize: 11, color: Colors.blue.shade700),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(LucideIcons.trash2, size: 18, color: Colors.red),
            onPressed: _removeVideo,
            tooltip: 'Remove video',
          ),
        ],
      ),
    );
  }
}
