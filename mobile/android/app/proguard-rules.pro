# Flutter
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# MediaKit
-keep class xyz.luan.audioplayers.** { *; }

# Syncfusion
-keep class com.syncfusion.** { *; }

# Keep annotation
-keepattributes *Annotation*

# Play Core classes referenced by Flutter deferred-components (not bundled)
-dontwarn com.google.android.play.core.splitcompat.SplitCompatApplication
-dontwarn com.google.android.play.core.splitinstall.**
-dontwarn com.google.android.play.core.tasks.**
