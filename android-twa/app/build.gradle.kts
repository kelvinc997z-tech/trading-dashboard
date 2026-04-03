android {
    namespace = "com.trading.dashboard.pro"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.trading.dashboard.pro"
        minSdk = 21
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("androidx.browser:browser:1.6.0")
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.4.0")
}
