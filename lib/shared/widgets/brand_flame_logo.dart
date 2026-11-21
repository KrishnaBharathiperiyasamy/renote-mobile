import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

class BrandFlameLogo extends StatelessWidget {
  final double size;

  const BrandFlameLogo({super.key, this.size = 28});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(size: Size(size, size), painter: _FlameLogoPainter()),
    );
  }
}

class _FlameLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final scale = size.width / 24.0;
    canvas.scale(scale, scale);

    // 1. Inner core gradient
    final innerPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.bottomLeft,
        end: Alignment.topRight,
        colors: [AppColors.flameOrange, AppColors.flameYellow],
      ).createShader(const Rect.fromLTWH(0, 0, 24, 24))
      ..style = PaintingStyle.fill;

    final innerPath = Path()
      ..moveTo(12, 2)
      ..cubicTo(10.2, 4.8, 8.5, 7.2, 8.5, 10.2)
      ..cubicTo(8.5, 13, 10.2, 14.8, 12, 15.8)
      ..cubicTo(13.8, 14.8, 15.5, 13, 15.5, 10.2)
      ..cubicTo(15.5, 7.2, 13.8, 4.8, 12, 2)
      ..close();

    canvas.drawPath(innerPath, innerPaint);

    // 2. Outer droplet flame contour
    final outerPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.bottomLeft,
        end: Alignment.topRight,
        colors: [
          AppColors.flameRed,
          AppColors.flameOrange,
          AppColors.flameAmber,
        ],
      ).createShader(const Rect.fromLTWH(0, 0, 24, 24))
      ..style = PaintingStyle.fill;

    final outerPath = Path()
      ..fillType = PathFillType.evenOdd
      // Outer contour
      ..moveTo(12, 22)
      ..cubicTo(16.6395, 22, 20.4, 18.2395, 20.4, 13.6)
      ..cubicTo(20.4, 8.87, 16.2, 5.2, 12, 1)
      ..cubicTo(7.8, 5.2, 3.6, 8.87, 3.6, 13.6)
      ..cubicTo(3.6, 18.2395, 7.3605, 22, 12, 22)
      ..close()
      // Cutout hole
      ..moveTo(12, 18)
      ..cubicTo(14.43, 18, 16.4, 16.03, 16.4, 13.6)
      ..cubicTo(16.4, 10.85, 14.2, 8.65, 12, 6.45)
      ..cubicTo(9.8, 8.65, 7.6, 10.85, 7.6, 13.6)
      ..cubicTo(7.6, 16.03, 9.57, 18, 12, 18)
      ..close();

    canvas.drawPath(outerPath, outerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
