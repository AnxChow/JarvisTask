// app.config.js
export default {
  expo: {
    extra: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_ORG_ID: process.env.OPENAI_ORG_ID, // define in your .env file or directly here
      eas: {
        projectId: process.env.EAS_PROJECT_ID, // You'll get this from EAS
      },
    },
    name: "JarvisTasks",
    slug: "JarvisTasks",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSSpeechRecognitionUsageDescription:
          "Allow $(PRODUCT_NAME) to use speech recognition.",
        NSMicrophoneUsageDescription:
          "Allow $(PRODUCT_NAME) to access your microphone.",
      },
      bundleIdentifier: "com.anonymous.JarvisTasks",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: ["android.permission.RECORD_AUDIO"],
      package: "com.anonymous.JarvisTasks",
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      [
        "expo-speech-recognition",
        {
          microphonePermission: "Allow JarvisTasks to access the microphone",
          speechRecognitionPermission:
            "Allow JarvisTasks to access speech recognition",
          NSMicrophoneUsageDescription:
            "This app uses the microphone to record your voice for tasks",
          NSSpeechRecognitionUsageDescription:
            "This app uses speech recognition to convert your voice to text",
        },
      ],
      "expo-sqlite",
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
