import '../config/env_config.dart';

class ApiConstants {
  ApiConstants._();

  // Auth endpoints (Auth Service on Port 3005)
  static String get login => '${EnvConfig.authBaseUrl}/auth/login';
  static String get register => '${EnvConfig.authBaseUrl}/auth/register';
  static String get forgotPassword =>
      '${EnvConfig.authBaseUrl}/auth/forgot-password';
  static String get resetPassword =>
      '${EnvConfig.authBaseUrl}/auth/reset-password';
  static String get refreshToken =>
      '${EnvConfig.authBaseUrl}/auth/refresh-token';
  static String get getMe => '${EnvConfig.authBaseUrl}/users/me';
  static String get updateProfile => '${EnvConfig.authBaseUrl}/users/me';
  static String get uploadProfilePic =>
      '${EnvConfig.authBaseUrl}/users/me/upload-profile-pic';
  static String get deleteAccount => '${EnvConfig.authBaseUrl}/users/me';

  // OTP Endpoints
  static String get otpSend => '${EnvConfig.authBaseUrl}/otp/send';
  static String get otpVerify => '${EnvConfig.authBaseUrl}/otp/verify';

  // Backend Data API Endpoints (Backend on Port 6003)
  static String get marketplaceFeed =>
      '${EnvConfig.dataBaseUrl}/api/marketplace/feed';
  static String marketplaceItem(String id) =>
      '${EnvConfig.dataBaseUrl}/api/marketplace/item/$id';
  static String marketplaceLike(String id) =>
      '${EnvConfig.dataBaseUrl}/api/marketplace/item/$id/like';
  static String marketplaceReaction(String id) =>
      '${EnvConfig.dataBaseUrl}/api/marketplace/item/$id/reaction';
  static String marketplaceRate(String id) =>
      '${EnvConfig.dataBaseUrl}/api/marketplace/item/$id/rate';
  static String marketplaceFeedback(String id) =>
      '${EnvConfig.dataBaseUrl}/api/marketplace/item/$id/feedback';
  static String publishMarketplaceItem(String id) =>
      '${EnvConfig.dataBaseUrl}/api/marketplace/publish/$id';
  static String get uploadTempVideo =>
      '${EnvConfig.dataBaseUrl}/api/posters/uploadTempVideo';

  // Company Endpoints
  static String getCompanies(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/companies/getAllCompanies/$userId';
  static String createCompany(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/companies/createCompany/$userId';
  static String editCompany(String companyId) =>
      '${EnvConfig.dataBaseUrl}/api/companies/editCompany/$companyId';
  static String deleteCompany(String companyId) =>
      '${EnvConfig.dataBaseUrl}/api/companies/deleteCompany/$companyId';

  // Customer Endpoints
  static String getCustomers(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/companies/getAllCompanies/$userId';

  // Quotation Endpoints
  static String getQuotations(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/quotations/getQuotations/$userId';
  static String getQuotation(String id) =>
      '${EnvConfig.dataBaseUrl}/api/quotations/getQuotation/$id';
  static String createQuotation(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/quotations/createQuotation/$userId';
  static String updateQuotation(String id) =>
      '${EnvConfig.dataBaseUrl}/api/quotations/updateQuotation/$id';
  static String deleteQuotation(String id) =>
      '${EnvConfig.dataBaseUrl}/api/quotations/deleteQuotation/$id';
  static String get deleteMultipleQuotations =>
      '${EnvConfig.dataBaseUrl}/api/quotations/deleteQuotation';
  static String toggleFavoriteQuotation(String id) =>
      '${EnvConfig.dataBaseUrl}/api/quotations/getQuotations/$id/favorite';
  static String get nextQuotationId =>
      '${EnvConfig.dataBaseUrl}/api/quotations/next-id';

  // Invoice Endpoints
  static String getInvoices(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/invoice/getInvoiceByUser/$userId';
  static String createInvoice(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/invoice/createInvoice/$userId';
  static String updateInvoice(String id) =>
      '${EnvConfig.dataBaseUrl}/api/invoice/updateInvoice/$id';
  static String deleteInvoice(String id) =>
      '${EnvConfig.dataBaseUrl}/api/invoice/deleteInvoice/$id';
  static String get deleteMultipleInvoices =>
      '${EnvConfig.dataBaseUrl}/api/invoice/deleteInvoices';
  static String toggleFavoriteInvoice(String id) =>
      '${EnvConfig.dataBaseUrl}/api/invoice/getInvoice/$id/favorite';
  static String nextInvoiceId(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/invoice/next-id/$userId';
  static String downloadInvoice(String id) =>
      '${EnvConfig.dataBaseUrl}/api/invoice/invoice/download/$id';

  // Product Endpoints
  static String getProducts(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/products/get/$userId';
  static String createProduct(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/products/create/$userId';
  static String updateProduct(String productId) =>
      '${EnvConfig.dataBaseUrl}/api/products/update/$productId';
  static String get deleteProduct =>
      '${EnvConfig.dataBaseUrl}/api/products/delete';
  static String toggleFavoriteProduct(String productId) =>
      '${EnvConfig.dataBaseUrl}/api/products/getProduct/$productId/favorite';

  // Poster Endpoints
  static String getPosters(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/posters/getPoster/$userId';
  static String getPoster(String posterId) =>
      '${EnvConfig.dataBaseUrl}/api/posters/$posterId';
  static String createPoster(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/posters/createPoster/$userId';
  static String updatePoster(String posterId) =>
      '${EnvConfig.dataBaseUrl}/api/posters/updatePoster/$posterId';
  static String deletePoster(String posterId) =>
      '${EnvConfig.dataBaseUrl}/api/posters/deletePoster/$posterId';
  static String togglePosterFavorite(String posterId) =>
      '${EnvConfig.dataBaseUrl}/api/posters/$posterId/favorite';

  // Subscriptions & Plans
  static String get plans => '${EnvConfig.dataBaseUrl}/api/plans/get-plans';
  static String get subscriptionHistory =>
      '${EnvConfig.dataBaseUrl}/api/subscription/history';
  static String get createSubscription =>
      '${EnvConfig.dataBaseUrl}/api/subscription/create';
  static String get cancelSubscription =>
      '${EnvConfig.dataBaseUrl}/api/subscription/cancel';

  // Razorpay Gateway
  static String get razorpayCreateSession =>
      '${EnvConfig.dataBaseUrl}/api/razorpay/create-subscription-session';
  static String get razorpayVerifyPayment =>
      '${EnvConfig.dataBaseUrl}/api/razorpay/verify-payment';

  // Notifications
  static String getNotifications(String userId) =>
      '${EnvConfig.dataBaseUrl}/api/notifications/notifications/$userId';

  // Helper for resolving full image URLs
  static String resolveImageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    final cleaned = path.replaceAll('\\', '/').replaceFirst(RegExp(r'^/+'), '');
    return '${EnvConfig.dataBaseUrl}/$cleaned';
  }
}
