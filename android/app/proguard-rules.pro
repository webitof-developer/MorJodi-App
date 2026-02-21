# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:
# Fix for Razorpay Missing proguard.annotation classes
-keep class proguard.annotation.** { *; }
-dontwarn proguard.annotation.**

# Razorpay SDK rules
-keep class com.razorpay.** { *; }
-keep interface com.razorpay.** { *; }
-dontwarn com.razorpay.**
-keepattributes *Annotation*

# React Native & Hermes safe rules
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**
-keep class com.facebook.hermes.** { *; }
-dontwarn com.facebook.hermes.**
-keep class com.facebook.jni.** { *; }
-dontwarn com.facebook.jni.**
