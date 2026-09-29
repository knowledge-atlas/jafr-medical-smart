#!/bin/bash
echo "🔨 بدء إخراج التطبيق..."
npx expo install react-dom react-native-web
npx expo start -c --no-dev &
sleep 5
kill %1 2>/dev/null
npx expo export:web
if [ -d "web-build" ]; then tar -czf jafr-web.tar.gz web-build/; echo "✅ تم ضغط نسخة الويب."; else echo "⚠️ لم يتم العثور على web-build"; fi
echo "📱 لبناء APK: npx eas build --platform android --profile preview"
echo "✅ اكتملت العمليات الأساسية."
