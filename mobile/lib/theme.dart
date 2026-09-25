import 'package:flutter/material.dart';

/// Matte black + gold Material 3 dark theme. No analytics.
const Color kMatteBlack = Color(0xFF0B0B0B);
const Color kSurface = Color(0xFF141414);
const Color kGold = Color(0xFFC9A227);
const Color kGoldDim = Color(0xFF8A7219);
const Color kIvory = Color(0xFFE8E0D0);

ThemeData _theme({
  required ColorScheme scheme,
  required Color scaffold,
  required Color appBar,
  required Color appBarInk,
  required Color card,
  required Color field,
  required Color onField,
}) {
  final radius = BorderRadius.circular(10);
  return ThemeData(
    useMaterial3: true,
    brightness: scheme.brightness,
    colorScheme: scheme,
    scaffoldBackgroundColor: scaffold,
    focusColor: kGold,
    appBarTheme: AppBarTheme(
      backgroundColor: appBar,
      foregroundColor: appBarInk,
      elevation: 0,
      centerTitle: false,
    ),
    cardTheme: CardThemeData(
      color: card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Color(0x33C9A227)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: kGold,
        foregroundColor: kMatteBlack,
        minimumSize: const Size.fromHeight(48),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: field,
      labelStyle: TextStyle(color: onField),
      border: OutlineInputBorder(borderRadius: radius),
      focusedBorder: OutlineInputBorder(
        borderRadius: radius,
        borderSide: const BorderSide(color: kGold, width: 2),
      ),
    ),
    segmentedButtonTheme: SegmentedButtonThemeData(
      style: ButtonStyle(
        foregroundColor: WidgetStateProperty.resolveWith((s) {
          return s.contains(WidgetState.selected) ? kMatteBlack : scheme.onSurface;
        }),
        backgroundColor: WidgetStateProperty.resolveWith((s) {
          return s.contains(WidgetState.selected) ? kGold : card;
        }),
      ),
    ),
  );
}

ThemeData buildLightTheme() {
  const scheme = ColorScheme.light(
    primary: kGold,
    onPrimary: kMatteBlack,
    secondary: kGoldDim,
    onSecondary: Color(0xFF1C1915),
    surface: Color(0xFFFFFDF8),
    onSurface: Color(0xFF1C1915),
    error: Color(0xFF9D2C2C),
    onError: Color(0xFFFFFDF8),
  );
  return _theme(
    scheme: scheme,
    scaffold: const Color(0xFFF6F3EC),
    appBar: const Color(0xFFF6F3EC),
    appBarInk: const Color(0xFF1C1915),
    card: const Color(0xFFFFFDF8),
    field: const Color(0xFFFFFDF8),
    onField: const Color(0xFF5C564C),
  );
}

ThemeData buildDarkTheme() {
  const scheme = ColorScheme.dark(
    primary: kGold,
    onPrimary: kMatteBlack,
    secondary: kGoldDim,
    onSecondary: kIvory,
    surface: kSurface,
    onSurface: kIvory,
    error: Color(0xFFF0A8A2),
    onError: kMatteBlack,
  );
  return _theme(
    scheme: scheme,
    scaffold: kMatteBlack,
    appBar: kMatteBlack,
    appBarInk: kGold,
    card: kSurface,
    field: const Color(0xFF1A1A1A),
    onField: kIvory,
  );
}

/// Dark theme kept for callers that want the night surface explicitly.
ThemeData buildAppTheme() => buildDarkTheme();
