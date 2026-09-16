#!/bin/bash
set -e

echo "=== Android APK Build Pipeline for Universal Smart TV Remote ==="

# 1. Detect Java (Java 21 / 17 / default)
if [ -z "$JAVA_HOME" ]; then
    if [ -d "/usr/lib/jvm/java-21-openjdk-amd64" ]; then
        export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
    elif [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
        export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    elif [ -d "/usr/lib/jvm/default-java" ]; then
        export JAVA_HOME="/usr/lib/jvm/default-java"
    fi
fi
if [ -n "$JAVA_HOME" ]; then
    export PATH="$JAVA_HOME/bin:$PATH"
fi

echo "Java Environment:"
if command -v java >/dev/null 2>&1; then
    java -version
else
    echo "Notice: Java binary not in local shell. Please ensure JDK 17/21 is installed."
fi

# 2. Setup Android SDK path
if [ -z "$ANDROID_HOME" ]; then
    if [ -d "/opt/android-sdk" ]; then
        export ANDROID_HOME="/opt/android-sdk"
    elif [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    fi
fi
if [ -n "$ANDROID_HOME" ]; then
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
    export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools"
fi

WORKSPACE_DIR="$(pwd)"

# 3. Create local.properties for Gradle if ANDROID_HOME exists
if [ -n "$ANDROID_HOME" ] && [ -d "$ANDROID_HOME" ]; then
    echo "sdk.dir=$ANDROID_HOME" > "$WORKSPACE_DIR/android/local.properties"
fi

# 4. Resolve App Version
PACKAGE_VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
export VERSION_NAME="${VERSION_NAME:-$PACKAGE_VERSION}"
echo "Building version: $VERSION_NAME"

# 5. Build web assets and sync Capacitor
echo "Building web assets and syncing Capacitor Android..."
npm run build
npx cap sync android

# 6. Determine build target (release or debug)
BUILD_MODE="${1:-${BUILD_TYPE:-release}}"
echo "Target build mode: $BUILD_MODE"

cd "$WORKSPACE_DIR/android"
chmod +x ./gradlew

if [ "$BUILD_MODE" = "release" ]; then
    echo "Running Gradle assembleRelease..."
    ./gradlew assembleRelease --stacktrace --no-daemon
else
    echo "Running Gradle assembleDebug..."
    ./gradlew assembleDebug --stacktrace --no-daemon
fi

# 7. Locate generated APK dynamically
cd "$WORKSPACE_DIR"
FOUND_APK=$(find "$WORKSPACE_DIR/android/app/build/outputs/apk" -type f -name "*.apk" | sort | tail -n 1)

if [ -n "$FOUND_APK" ] && [ -f "$FOUND_APK" ]; then
    FILE_SIZE=$(wc -c < "$FOUND_APK" | tr -d ' ')
    if [ "$FILE_SIZE" -le 0 ]; then
        echo "ERROR: Generated APK file is empty (0 bytes): $FOUND_APK"
        exit 1
    fi

    echo "========================================================="
    echo "SUCCESS: APK built successfully!"
    echo "APK Location: $FOUND_APK"
    echo "File Size: $FILE_SIZE bytes"
    ls -lh "$FOUND_APK"
    
    # Generate SHA-256 Checksum
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$FOUND_APK"
    fi
    echo "========================================================="
else
    echo "ERROR: No APK was generated in $WORKSPACE_DIR/android/app/build/outputs/apk"
    find "$WORKSPACE_DIR/android/app/build/outputs" -name "*.apk" || true
    exit 1
fi

