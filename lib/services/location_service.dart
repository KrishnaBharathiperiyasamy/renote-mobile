import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';

class LocationResult {
  final bool success;
  final String? cityName;
  final String? errorMessage;
  final bool permissionDenied;

  const LocationResult({
    required this.success,
    this.cityName,
    this.errorMessage,
    this.permissionDenied = false,
  });
}

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  /// Known major Indian city coordinates (latitude, longitude, name, displayLabel)
  static const List<Map<String, dynamic>> popularCities = [
    {
      'name': 'Coimbatore',
      'label': 'Coimbatore, Tamil Nadu',
      'lat': 11.0168,
      'lon': 76.9558,
    },
    {
      'name': 'RS Puram',
      'label': 'RS Puram, Coimbatore',
      'lat': 11.0086,
      'lon': 76.9452,
    },
    {
      'name': 'Bengaluru',
      'label': 'Bengaluru, Karnataka',
      'lat': 12.9716,
      'lon': 77.5946,
    },
    {
      'name': 'Chennai',
      'label': 'Chennai, Tamil Nadu',
      'lat': 13.0827,
      'lon': 80.2707,
    },
    {
      'name': 'Mumbai',
      'label': 'Mumbai, Maharashtra',
      'lat': 19.0760,
      'lon': 72.8777,
    },
    {
      'name': 'Delhi',
      'label': 'Delhi / NCR',
      'lat': 28.6139,
      'lon': 77.2090,
    },
    {
      'name': 'Hyderabad',
      'label': 'Hyderabad, Telangana',
      'lat': 17.3850,
      'lon': 78.4867,
    },
    {
      'name': 'Pune',
      'label': 'Pune, Maharashtra',
      'lat': 18.5204,
      'lon': 73.8567,
    },
    {
      'name': 'Kolkata',
      'label': 'Kolkata, West Bengal',
      'lat': 22.5726,
      'lon': 88.3639,
    },
    {
      'name': 'Ahmedabad',
      'label': 'Ahmedabad, Gujarat',
      'lat': 23.0225,
      'lon': 72.5714,
    },
    {
      'name': 'Tiruppur',
      'label': 'Tiruppur, Tamil Nadu',
      'lat': 11.1085,
      'lon': 77.3411,
    },
    {
      'name': 'Salem',
      'label': 'Salem, Tamil Nadu',
      'lat': 11.6643,
      'lon': 78.1460,
    },
    {
      'name': 'Madurai',
      'label': 'Madurai, Tamil Nadu',
      'lat': 9.9252,
      'lon': 78.1198,
    },
    {
      'name': 'Kochi',
      'label': 'Kochi, Kerala',
      'lat': 9.9312,
      'lon': 76.2673,
    },
  ];

  /// Request device GPS permission and return current city name
  Future<LocationResult> getCurrentCity() async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return const LocationResult(
          success: false,
          errorMessage: 'Location services are disabled on this device.',
        );
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return const LocationResult(
            success: false,
            permissionDenied: true,
            errorMessage: 'Location permission was denied by the user.',
          );
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return const LocationResult(
          success: false,
          permissionDenied: true,
          errorMessage:
              'Location permission is permanently denied. Please enable in device settings.',
        );
      }

      // Get position
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 6),
        ),
      );

      final city = await _resolveCityFromCoordinates(
        position.latitude,
        position.longitude,
      );

      return LocationResult(
        success: true,
        cityName: city,
      );
    } catch (e) {
      if (kDebugMode) {
        print('Error retrieving current location: $e');
      }
      return LocationResult(
        success: false,
        errorMessage: 'Unable to detect location: ${e.toString()}',
      );
    }
  }

  /// Resolve city from lat/lon using fast bounding proximity with Nominatim fallback
  Future<String> _resolveCityFromCoordinates(double lat, double lon) async {
    // 1. Check proximity to popular predefined Indian commercial centers
    double minDistance = double.infinity;
    String? closestCity;

    for (final city in popularCities) {
      final cLat = city['lat'] as double;
      final cLon = city['lon'] as double;
      final dist = (lat - cLat) * (lat - cLat) + (lon - cLon) * (lon - cLon);
      if (dist < minDistance) {
        minDistance = dist;
        closestCity = city['name'] as String;
      }
    }

    // Within ~0.5 degree (~50km)
    if (minDistance < 0.25 && closestCity != null) {
      return closestCity;
    }

    // 2. Fallback to OpenStreetMap reverse geocode
    try {
      final dio = Dio(
        BaseOptions(
          connectTimeout: const Duration(seconds: 3),
          receiveTimeout: const Duration(seconds: 3),
          headers: {'User-Agent': 'ReNoteMobile/1.0'},
        ),
      );
      final response = await dio.get(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'format': 'json',
          'lat': lat,
          'lon': lon,
          'zoom': 10,
        },
      );

      if (response.statusCode == 200 && response.data is Map) {
        final data = response.data as Map;
        final addr = data['address'] as Map<String, dynamic>?;
        if (addr != null) {
          final city = addr['city'] ??
              addr['town'] ??
              addr['suburb'] ??
              addr['county'] ??
              addr['state_district'];
          if (city != null && city.toString().isNotEmpty) {
            return city.toString();
          }
        }
      }
    } catch (_) {
      // Fall through to closest city
    }

    return closestCity ?? 'Coimbatore';
  }
}
