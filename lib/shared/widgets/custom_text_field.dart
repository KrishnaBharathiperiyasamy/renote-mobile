import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';

class CustomTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final String? hintText;
  final String? errorText;
  final bool obscureText;
  final TextInputType keyboardType;
  final dynamic prefixIcon;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final void Function(String)? onChanged;
  final int maxLines;
  final TextCapitalization textCapitalization;

  const CustomTextField({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.hintText,
    this.errorText,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.prefixIcon,
    this.suffixIcon,
    this.validator,
    this.onChanged,
    this.maxLines = 1,
    this.textCapitalization = TextCapitalization.none,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Widget? resolvedPrefix;
    if (prefixIcon != null) {
      if (prefixIcon is IconData) {
        resolvedPrefix = Icon(
          prefixIcon as IconData,
          size: 18,
          color: isDark ? AppColors.darkTextSecondary : AppColors.textSecondary,
        );
      } else if (prefixIcon is Widget) {
        resolvedPrefix = prefixIcon as Widget;
      }
    }

    final effectiveHint = hint ?? hintText;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
        ],
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          onChanged: onChanged,
          maxLines: maxLines,
          textCapitalization: textCapitalization,
          style: TextStyle(
            fontSize: 14,
            color: isDark ? AppColors.darkTextPrimary : AppColors.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: effectiveHint,
            hintStyle: TextStyle(
              color: isDark ? AppColors.darkTextMuted : AppColors.textMuted,
            ),
            errorText: errorText,
            prefixIcon: resolvedPrefix,
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: isDark ? AppColors.darkInputBg : Colors.white,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: isDark ? AppColors.darkInputBorder : AppColors.inputBorder,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(
                color: AppColors.primary,
                width: 1.5,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
