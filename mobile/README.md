# EmployeeLock — iPhone & Android

On-device log of what happened, what followed, and who owns the row.
Blank owner → UNOWNED. Filled renamed_from → RENAMED.

**Author:** Aziel Eliab

## Start

1. `cd mobile && flutter create --org com.azieeliab --project-name employeelock .`
2. `flutter pub get`
3. `flutter run`

Application id: `com.azieeliab.employeelock`. Offline. No analytics. Light and dark follow the system.

The desktop workbook and CLI remain the full package. These sources live in this repo.

## Open in Android Studio / Xcode

The `android/` and `ios/` folders here are skeleton READMEs because
this tree was written without the Flutter SDK on PATH.

```bash
cd mobile
flutter create --org com.azieeliab --project-name employeelock .
flutter pub get
flutter run
```

Then open `android/` in Android Studio, or `ios/Runner.xcworkspace` in
Xcode.

## Honest scope

THIS IS: a linear hash chain of event/result/blame/owner/outcome rows.
THIS IS NOT: a court filing, UL, TemporalLock, a truth score, or a
charge sheet. Demo rows are format proof.

Counted desktop download:

# → https://employeelock-download-tracker.vibelock.workers.dev/ ←

GitHub: https://github.com/AzielEliab/employeelock

**Forks are welcome and always allowed.**
