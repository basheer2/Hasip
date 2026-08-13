#!/usr/bin/env bash
# ============================================================
#  بناء تطبيق أندرويد "الحساب اليومي" (APK)
# ============================================================
#  المتطلبات:
#   - Node.js 20 أو أحدث
#   - Java 17 (OpenJDK)
#   - Android SDK مع ANDROID_HOME (أو افتح المشروع في Android Studio)
#
#  الاستخدام:
#   ./build-apk.sh          ← يبني نسخة Debug قابلة للتثبيت مباشرة
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

echo "▸ 1/4 تثبيت الاعتماديات..."
npm ci

echo "▸ 2/4 بناء الواجهة (تصدير ثابت)..."
npm run build

echo "▸ 3/4 مزامنة ملفات الويب مع مشروع أندرويد..."
npx cap sync android

echo "▸ 4/4 بناء ملف APK..."
cd android
./gradlew assembleDebug --no-daemon

echo ""
echo "✅ تم البناء بنجاح!"
echo "   الملف الجاهز للتثبيت:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "   انقله لهاتفك وافتحه لتثبيته (فعّل 'السماح بتثبيت تطبيقات غير معروفة')."
