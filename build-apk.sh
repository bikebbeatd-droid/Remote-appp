#!/bin/bash
set -e

echo "=== Android APK Build Pipeline for Universal Smart TV Remote ==="

# 1. Detect Java 17
if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
elif [ -d "/usr/lib/jvm/default-java" ]; then
    export JAVA_HOME="/usr/lib/jvm/default-java"
fi
export PATH="$JAVA_HOME/bin:$PATH"

echo "Using Java:"
java -version

# 2. Setup Android SDK if not already present
export ANDROID_HOME="/opt/android-sdk"
export ANDROID_SDK_ROOT="/opt/android-sdk"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"

if [ ! -d "$ANDROID_HOME/cmdline-tools" ]; then
    echo "Downloading and configuring Android Command-Line Tools..."
    mkdir -p "$ANDROID_HOME/cmdline-tools"
    cd /tmp
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
    unzip -q cmdline-tools.zip
    mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
    mv cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/" || cp -r cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"
    rm -rf cmdline-tools.zip cmdline-tools
    cd - >/dev/null

    echo "Accepting Android SDK licenses and installing build-tools and platform..."
    yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses >/dev/null 2>&1 || true
    "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
fi

# 3. Create local.properties for Gradle
WORKSPACE_DIR="$(pwd)"
echo "sdk.dir=$ANDROID_HOME" > "$WORKSPACE_DIR/android/local.properties"

# 4. Sync web distribution to Android assets
echo "Syncing web assets to Android native project..."
npm run build
npx cap sync android

# 5. Build Debug APK using Gradle
echo "Running Gradle assembleDebug..."
cd "$WORKSPACE_DIR/android"
chmod +x ./gradlew
./gradlew assembleDebug --stacktrace --no-daemon

# 6. Verify Debug APK output
APK_PATH="$WORKSPACE_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo "========================================================="
    echo "SUCCESS: Debug APK built successfully!"
    echo "APK Location: $APK_PATH"
    ls -la "$APK_PATH"
    echo "========================================================="
else
    echo "ERROR: Debug APK not found at $APK_PATH"
    find "$WORKSPACE_DIR/android/app/build/outputs" -name "*.apk" || true
    exit 1
fi
