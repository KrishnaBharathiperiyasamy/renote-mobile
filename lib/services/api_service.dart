import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import '../core/constants/api_constants.dart';
import '../core/network/api_client.dart';
import '../models/company_model.dart';
import '../models/customer_model.dart';
import '../models/marketplace_item_model.dart';
import '../models/product_model.dart';
import '../models/quotation_model.dart';
import '../models/invoice_model.dart';
import '../models/poster_model.dart';
import '../models/plan_model.dart';
import '../models/subscription_model.dart';
import 'storage_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  final Dio _dio = ApiClient().dio;

  // ── Companies (Vendors) ──
  Future<List<CompanyModel>> fetchCompanies(String userId) async {
    try {
      final response = await _dio.get(ApiConstants.getCompanies(userId));
      final data = response.data;
      final List list = (data is Map && data['data'] != null)
          ? data['data']
          : (data is Map && data['company'] != null)
          ? data['company']
          : (data is List ? data : []);
      return list.map((e) => CompanyModel.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  // ── Customers ──
  Future<List<CustomerModel>> fetchCustomers(String userId) async {
    try {
      final response = await _dio.get(
        ApiConstants.getCustomers(userId),
        queryParameters: {'flag': 'customer'},
      );
      final data = response.data;
      final List list = (data is Map && data['data'] != null)
          ? data['data']
          : (data is Map && data['company'] != null)
          ? data['company']
          : (data is List ? data : []);
      return list.map((e) => CustomerModel.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<CustomerModel> createCustomer(
    String userId,
    CustomerModel customer,
  ) async {
    final response = await _dio.post(
      ApiConstants.createCompany(userId),
      data: customer.toJson(),
    );
    final data = response.data;
    final item = (data is Map && data['company'] != null)
        ? data['company']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return CustomerModel.fromJson(item);
  }

  Future<CustomerModel> updateCustomer(
    String customerId,
    CustomerModel customer,
  ) async {
    final response = await _dio.put(
      ApiConstants.editCompany(customerId),
      data: customer.toJson(),
    );
    final data = response.data;
    final item = (data is Map && data['company'] != null)
        ? data['company']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return CustomerModel.fromJson(item);
  }

  Future<bool> deleteCustomer(String customerId) async {
    try {
      await _dio.delete(ApiConstants.deleteCompany(customerId));
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Products ──
  Future<List<ProductModel>> fetchProducts(
    String userId, {
    String? companyId,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (companyId != null) queryParams['companyId'] = companyId;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;

      final response = await _dio.get(
        ApiConstants.getProducts(userId),
        queryParameters: queryParams,
      );
      final data = response.data;
      final List list = (data is Map && data['products'] != null)
          ? data['products']
          : (data is Map && data['data'] != null)
          ? data['data']
          : (data is List ? data : []);
      return list.map((e) => ProductModel.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<ProductModel> createProduct(
    String userId,
    ProductModel product,
    String companyId,
  ) async {
    final payload = product.toJson(companyId: companyId);
    payload['userId'] = userId;
    final response = await _dio.post(
      ApiConstants.createProduct(userId),
      data: payload,
    );
    final data = response.data;
    final item = (data is Map && data['product'] != null)
        ? data['product']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return ProductModel.fromJson(item);
  }

  Future<ProductModel> updateProduct(
    String productId,
    ProductModel product,
    String companyId, {
    String? userId,
  }) async {
    final payload = product.toJson(companyId: companyId);
    final effectiveUserId = userId ?? StorageService().getUserId();
    if (effectiveUserId != null && effectiveUserId.isNotEmpty) {
      payload['userId'] = effectiveUserId;
    }
    final response = await _dio.post(
      ApiConstants.updateProduct(productId),
      data: payload,
    );
    final data = response.data;
    final item = (data is Map && data['product'] != null)
        ? data['product']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return ProductModel.fromJson(item);
  }

  Future<bool> deleteProduct(String productId, {String? userId}) async {
    try {
      await _dio.post(
        ApiConstants.deleteProduct,
        data: {
          'productIds': [productId],
        },
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteMultipleProducts(List<String> productIds) async {
    try {
      await _dio.post(
        ApiConstants.deleteProduct,
        data: {'productIds': productIds},
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> toggleFavoriteProduct(String productId) async {
    try {
      final res = await _dio.patch(
        ApiConstants.toggleFavoriteProduct(productId),
      );
      final data = res.data;
      if (data is Map && data['isHeart'] != null) {
        return data['isHeart'] == true;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Quotations (Estimations) ──
  Future<List<QuotationModel>> fetchQuotations(
    String userId, {
    String? companyId,
  }) async {
    try {
      final Map<String, dynamic> params = {};
      if (companyId != null && companyId.isNotEmpty && companyId != 'All') {
        params['companyId'] = companyId;
      }
      final response = await _dio.get(
        ApiConstants.getQuotations(userId),
        queryParameters: params.isNotEmpty ? params : null,
      );
      final data = response.data;
      final List list = (data is Map && data['quotations'] != null)
          ? data['quotations']
          : (data is Map && data['data'] != null)
          ? data['data']
          : (data is List ? data : []);
      return list.map((e) => QuotationModel.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<String> fetchNextQuotationId(String userId) async {
    try {
      final response = await _dio.get(
        '${ApiConstants.nextQuotationId}/$userId',
      );
      final data = response.data;
      return data['nextEstimateID']?.toString() ??
          data['nextId']?.toString() ??
          'EST-001';
    } catch (_) {
      return 'EST-001';
    }
  }

  Future<QuotationModel> createQuotation(
    String userId,
    QuotationModel quotation,
  ) async {
    final response = await _dio.post(
      ApiConstants.createQuotation(userId),
      data: quotation.toJson(),
    );
    final data = response.data;
    final item = (data is Map && data['quotation'] != null)
        ? data['quotation']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return QuotationModel.fromJson(item);
  }

  Future<QuotationModel> updateQuotation(
    String quotationId,
    QuotationModel quotation,
  ) async {
    final response = await _dio.put(
      ApiConstants.updateQuotation(quotationId),
      data: quotation.toJson(),
    );
    final data = response.data;
    final item = (data is Map && data['quotation'] != null)
        ? data['quotation']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return QuotationModel.fromJson(item);
  }

  Future<bool> deleteQuotation(String id) async {
    try {
      await _dio.delete(ApiConstants.deleteQuotation(id));
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteMultipleQuotations(List<String> ids) async {
    try {
      await _dio.post(
        ApiConstants.deleteMultipleQuotations,
        data: {'ids': ids},
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> toggleFavoriteQuotation(String quotationId) async {
    try {
      final res = await _dio.patch(
        ApiConstants.toggleFavoriteQuotation(quotationId),
      );
      final data = res.data;
      if (data is Map && data['isHeart'] != null) {
        return data['isHeart'] == true;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Invoices ──
  Future<List<InvoiceModel>> fetchInvoices(
    String userId, {
    String? companyId,
    String? status,
    String? search,
    double? minPrice,
    double? maxPrice,
    DateTime? startDate,
    DateTime? endDate,
    bool? isHeart,
  }) async {
    try {
      final Map<String, dynamic> params = {'limit': 100};
      if (companyId != null && companyId.isNotEmpty && companyId != 'All') {
        params['companyId'] = companyId;
      }
      if (status != null && status != 'All' && status.isNotEmpty) {
        params['status'] = status;
      }
      if (search != null && search.isNotEmpty) {
        params['search'] = search;
      }
      if (minPrice != null) params['minPrice'] = minPrice;
      if (maxPrice != null) params['maxPrice'] = maxPrice;
      if (startDate != null) params['startDate'] = startDate.toIso8601String();
      if (endDate != null) params['endDate'] = endDate.toIso8601String();
      if (isHeart == true) params['isHeart'] = 'true';

      final response = await _dio.get(
        ApiConstants.getInvoices(userId),
        queryParameters: params,
      );
      final data = response.data;
      final List list = (data is Map && data['invoices'] != null)
          ? data['invoices']
          : (data is Map && data['data'] != null)
          ? data['data']
          : (data is List ? data : []);
      return list.map((e) => InvoiceModel.fromJson(e)).toList();
    } catch (_) {
      return [];
    }
  }

  Future<String> fetchNextInvoiceId(String userId) async {
    try {
      final response = await _dio.get(ApiConstants.nextInvoiceId(userId));
      final data = response.data;
      return data['invoiceID']?.toString() ??
          data['nextInvoiceID']?.toString() ??
          data['nextId']?.toString() ??
          'I/26-27/0001';
    } catch (_) {
      return 'I/26-27/0001';
    }
  }

  Future<InvoiceModel> createInvoice(
    String userId,
    InvoiceModel invoice,
  ) async {
    final response = await _dio.post(
      ApiConstants.createInvoice(userId),
      data: invoice.toJson(),
    );
    final data = response.data;
    final item = (data is Map && data['invoice'] != null)
        ? data['invoice']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return InvoiceModel.fromJson(item);
  }

  Future<InvoiceModel> updateInvoice(String id, InvoiceModel invoice) async {
    final response = await _dio.put(
      ApiConstants.updateInvoice(id),
      data: invoice.toJson(),
    );
    final data = response.data;
    final item = (data is Map && data['invoice'] != null)
        ? data['invoice']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return InvoiceModel.fromJson(item);
  }

  Future<bool> deleteInvoice(String id) async {
    try {
      await _dio.post(
        ApiConstants.deleteMultipleInvoices,
        data: {
          'ids': [id],
        },
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> deleteMultipleInvoices(List<String> ids) async {
    try {
      await _dio.post(ApiConstants.deleteMultipleInvoices, data: {'ids': ids});
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> toggleFavoriteInvoice(String invoiceId) async {
    try {
      final res = await _dio.patch(
        ApiConstants.toggleFavoriteInvoice(invoiceId),
      );
      final data = res.data;
      if (data is Map && data['isHeart'] != null) {
        return data['isHeart'] == true;
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Marketplace Feed & Details ──
  Future<List<MarketplaceItemModel>> fetchMarketplaceFeed({
    String? category,
    String? subcategory,
    String? city,
    String? search,
    String? sort,
    int page = 1,
    int limit = 100,
  }) async {
    final queryParams = <String, dynamic>{'page': page, 'limit': limit};
    if (category != null &&
        category.isNotEmpty &&
        category.toLowerCase() != 'all') {
      queryParams['category'] = category;
    }
    if (subcategory != null &&
        subcategory.isNotEmpty &&
        subcategory.toLowerCase() != 'all') {
      queryParams['subcategory'] = subcategory;
    }
    if (city != null && city.isNotEmpty && city.toLowerCase() != 'all') {
      queryParams['city'] = city;
    }
    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    if (sort != null && sort.isNotEmpty) {
      queryParams['sort'] = sort;
    }

    try {
      final response = await _dio.get(
        ApiConstants.marketplaceFeed,
        queryParameters: queryParams,
      );

      final data = response.data;
      final List rawList = (data is Map && data['posters'] != null)
          ? data['posters']
          : (data is Map && data['data'] != null)
          ? data['data']
          : (data is Map && data['items'] != null)
          ? data['items']
          : (data is List ? data : []);

      final items = <MarketplaceItemModel>[];
      for (final e in rawList) {
        if (e is Map) {
          try {
            items.add(
              MarketplaceItemModel.fromJson(Map<String, dynamic>.from(e)),
            );
          } catch (err) {
            debugPrint('Skipping malformed marketplace item: $err');
          }
        }
      }
      return items;
    } catch (e) {
      debugPrint('fetchMarketplaceFeed error: $e - retrying once');
      try {
        await Future.delayed(const Duration(milliseconds: 1000));
        final retryResponse = await _dio.get(
          ApiConstants.marketplaceFeed,
          queryParameters: queryParams,
        );
        final retryData = retryResponse.data;
        final List retryRawList = (retryData is Map && retryData['posters'] != null)
            ? retryData['posters']
            : (retryData is Map && retryData['data'] != null)
            ? retryData['data']
            : (retryData is Map && retryData['items'] != null)
            ? retryData['items']
            : (retryData is List ? retryData : []);
        final retryItems = <MarketplaceItemModel>[];
        for (final e in retryRawList) {
          if (e is Map) {
            try {
              retryItems.add(
                MarketplaceItemModel.fromJson(Map<String, dynamic>.from(e)),
              );
            } catch (_) {}
          }
        }
        if (retryItems.isNotEmpty) return retryItems;
      } catch (retryErr) {
        debugPrint('fetchMarketplaceFeed retry failed: $retryErr');
      }
      return [];
    }
  }

  Future<MarketplaceItemModel?> fetchMarketplaceItem(String id) async {
    try {
      final response = await _dio.get(ApiConstants.marketplaceItem(id));
      final data = response.data;
      final item = (data is Map && data['poster'] != null)
          ? data['poster']
          : (data is Map && data['item'] != null)
          ? data['item']
          : data;
      if (item is Map) {
        return MarketplaceItemModel.fromJson(Map<String, dynamic>.from(item));
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<bool> reactMarketplaceItem(
    String id, {
    String reaction = 'like',
  }) async {
    try {
      await _dio.post(
        ApiConstants.marketplaceReaction(id),
        data: {'reaction': reaction},
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> rateMarketplaceItem(String id, double rating) async {
    try {
      await _dio.post(
        ApiConstants.marketplaceRate(id),
        data: {'rating': rating.clamp(1.0, 5.0)},
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>> publishMarketplaceProduct({
    required String userId,
    required String title,
    required String description,
    required double price,
    required String location,
    required String category,
    String? subcategory,
    required String phone,
    String? whatsapp,
    String? companyId,
    List<XFile>? imageFiles,
    XFile? videoFile,
    void Function(int sent, int total)? onProgress,
  }) async {
    try {
      final formData = FormData();

      formData.fields.addAll([
        MapEntry('poster_title', title),
        MapEntry('product_name', title),
        MapEntry('product_description', description),
        MapEntry('product_price', price.toString()),
        MapEntry('marketplaceCategory', category),
        MapEntry('marketplaceSubcategory', subcategory ?? category),
        MapEntry('marketplaceCity', location),
      ]);

      if (companyId != null && companyId.isNotEmpty) {
        formData.fields.add(MapEntry('company_id', companyId));
      }

      // Primary media: video or image
      if (videoFile != null) {
        final videoBytes = await videoFile.readAsBytes();
        formData.files.add(
          MapEntry(
            'product_image',
            MultipartFile.fromBytes(
              videoBytes,
              filename: videoFile.name.isNotEmpty
                  ? videoFile.name
                  : 'product_video.mp4',
            ),
          ),
        );
      } else if (imageFiles != null && imageFiles.isNotEmpty) {
        final primaryImg = imageFiles.first;
        final primaryBytes = await primaryImg.readAsBytes();
        formData.files.add(
          MapEntry(
            'product_image',
            MultipartFile.fromBytes(
              primaryBytes,
              filename: primaryImg.name.isNotEmpty
                  ? primaryImg.name
                  : 'product_image.jpg',
            ),
          ),
        );
      }

      // Additional gallery images (up to 4)
      if (imageFiles != null) {
        final galleryList = videoFile != null
            ? imageFiles.take(4)
            : imageFiles.skip(1).take(4);
        for (final img in galleryList) {
          final imgBytes = await img.readAsBytes();
          formData.files.add(
            MapEntry(
              'product_gallery_images',
              MultipartFile.fromBytes(
                imgBytes,
                filename: img.name.isNotEmpty
                    ? img.name
                    : 'gallery_image.jpg',
              ),
            ),
          );
        }
      }

      final createResponse = await _dio.post(
        ApiConstants.createPoster(userId),
        data: formData,
        onSendProgress: kIsWeb ? null : onProgress,
      );

      final createData = createResponse.data;
      final posterObj = (createData is Map && createData['poster'] != null)
          ? createData['poster']
          : createData;
      final String? posterId = posterObj is Map
          ? (posterObj['_id'] ?? posterObj['id'])?.toString()
          : null;

      if (posterId == null || posterId.isEmpty) {
        return {
          'success': false,
          'message': 'Failed to create product listing',
        };
      }

      final publishResponse = await _dio.patch(
        ApiConstants.publishMarketplaceItem(posterId),
        data: {
          'isPublishedToMarketplace': true,
          'poster_title': title,
          'product_name': title,
          'product_description': description,
          'marketplacePrice': price,
          'marketplaceCity': location,
          'contactPhone': phone,
          'whatsappNumber':
              whatsapp != null && whatsapp.isNotEmpty ? whatsapp : phone,
          'marketplaceCategory': category,
          'marketplaceSubcategory': subcategory ?? category,
        },
      );

      final publishData = publishResponse.data;
      return {
        'success': true,
        'posterId': posterId,
        'data': publishData,
      };
    } on DioException catch (dioErr) {
      String errMsg = 'Failed to publish product';
      if (dioErr.response?.data is Map) {
        final d = dioErr.response!.data as Map;
        if (d['details'] is List && (d['details'] as List).isNotEmpty) {
          errMsg = (d['details'] as List).map((e) => e.toString()).join(', ');
        } else {
          errMsg = d['message']?.toString() ?? d['error']?.toString() ?? errMsg;
        }
      } else if (dioErr.response?.data is String &&
          (dioErr.response!.data as String).isNotEmpty) {
        errMsg = dioErr.response!.data as String;
      } else if (dioErr.message != null && dioErr.message!.isNotEmpty) {
        errMsg = dioErr.message!;
      }
      return {
        'success': false,
        'message': errMsg,
      };
    } catch (e) {
      return {
        'success': false,
        'message': e.toString(),
      };
    }
  }

  // ── Posters ──
  Future<List<PosterModel>> fetchPosters(
    String userId, {
    String? search,
    String? companyId,
    int page = 1,
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': 50};
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (companyId != null && companyId.isNotEmpty) {
        queryParams['companyId'] = companyId;
      }

      final response = await _dio.get(
        ApiConstants.getPosters(userId),
        queryParameters: queryParams,
      );
      final data = response.data;
      final List list = (data is Map && data['posters'] != null)
          ? data['posters']
          : (data is List ? data : []);
      return list
          .map((e) => PosterModel.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<PosterModel?> fetchPosterById(String id) async {
    try {
      final response = await _dio.get(ApiConstants.getPoster(id));
      final data = response.data;
      final item = (data is Map && data['poster'] != null)
          ? data['poster']
          : data;
      return PosterModel.fromJson(Map<String, dynamic>.from(item as Map));
    } catch (_) {
      return null;
    }
  }

  Future<PosterModel> createPoster(String userId, PosterModel poster) async {
    final response = await _dio.post(
      ApiConstants.createPoster(userId),
      data: poster.toJson(),
    );
    final data = response.data;
    final item = (data is Map && data['poster'] != null)
        ? data['poster']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return PosterModel.fromJson(Map<String, dynamic>.from(item as Map));
  }

  Future<PosterModel> updatePoster(String posterId, PosterModel poster) async {
    final response = await _dio.put(
      ApiConstants.updatePoster(posterId),
      data: poster.toJson(),
    );
    final data = response.data;
    final item = (data is Map && data['poster'] != null)
        ? data['poster']
        : (data is Map && data['data'] != null)
        ? data['data']
        : data;
    return PosterModel.fromJson(Map<String, dynamic>.from(item as Map));
  }

  Future<String?> deletePoster(String posterId) async {
    try {
      final response = await _dio.delete(
        ApiConstants.deletePoster(posterId),
        data: {
          'ids': [posterId],
          'id': posterId,
        },
      );
      if (response.statusCode == 200 || response.statusCode == 204) {
        return null;
      }
      return 'Failed to delete poster';
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map) {
        final err = data['error'] ?? data['message'];
        if (err != null) return err.toString();
      }
      return e.message ?? 'Failed to delete poster';
    } catch (e) {
      return e.toString();
    }
  }

  Future<bool> togglePosterFavorite(String posterId) async {
    try {
      await _dio.post(ApiConstants.togglePosterFavorite(posterId));
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── Subscriptions & Plans ──
  Future<List<PlanModel>> fetchPlans() async {
    try {
      final response = await _dio.get(ApiConstants.plans);
      final data = response.data;
      final List list = (data is Map && data['plans'] != null)
          ? data['plans']
          : (data is List ? data : []);
      return list
          .whereType<Map>()
          .map((e) => PlanModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<Map<String, dynamic>> fetchSubscriptionHistory() async {
    try {
      final response = await _dio.get(ApiConstants.subscriptionHistory);
      final data = response.data;
      if (data is Map) {
        final currentPlanData = data['currentPlan'];
        SubscriptionModel? currentSub;
        if (currentPlanData is Map) {
          currentSub = SubscriptionModel.fromJson(
            Map<String, dynamic>.from(currentPlanData),
          );
        }

        final List subList = data['subscriptions'] is List
            ? data['subscriptions']
            : [];
        final history = subList
            .whereType<Map>()
            .map(
              (e) => SubscriptionModel.fromJson(Map<String, dynamic>.from(e)),
            )
            .toList();

        return {
          'currentPlan': currentSub,
          'resolvedPlan': data['resolvedPlan'],
          'subscriptions': history,
        };
      }
      return {'currentPlan': null, 'subscriptions': <SubscriptionModel>[]};
    } catch (_) {
      return {'currentPlan': null, 'subscriptions': <SubscriptionModel>[]};
    }
  }

  Future<SubscriptionModel?> createSubscription(String planId) async {
    try {
      final response = await _dio.post(
        ApiConstants.createSubscription,
        data: {'planId': planId},
      );
      final data = response.data;
      final item = (data is Map && data['subscription'] != null)
          ? data['subscription']
          : data;
      if (item is Map) {
        return SubscriptionModel.fromJson(Map<String, dynamic>.from(item));
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<bool> cancelSubscription() async {
    try {
      await _dio.post(ApiConstants.cancelSubscription);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<Map<String, dynamic>?> createRazorpaySubscriptionSession(
    String planId,
  ) async {
    try {
      final response = await _dio.post(
        ApiConstants.razorpayCreateSession,
        data: {'planId': planId},
      );
      if (response.data is Map) {
        return Map<String, dynamic>.from(response.data);
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<bool> verifyRazorpayPayment({
    required String planId,
    required String paymentId,
    required String subscriptionId,
    required String signature,
  }) async {
    try {
      await _dio.post(
        ApiConstants.razorpayVerifyPayment,
        data: {
          'planId': planId,
          'razorpay_payment_id': paymentId,
          'razorpay_subscription_id': subscriptionId,
          'razorpay_signature': signature,
        },
      );
      return true;
    } catch (_) {
      return false;
    }
  }
}
