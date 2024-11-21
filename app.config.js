// app.config.js
module.exports = ({ config }) => {
  const isProduction = process.env.APP_ENV === "production";

  return {
    expo: {
      extra: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_ORG_ID: process.env.OPENAI_ORG_ID,
        eas: {
          // projectId: process.env.EAS_PROJECT_ID,
          projectId: "a6151950-c017-4d31-b0e2-c81dd5a91dc7",
        },
      },
      name: "JarvisTasks",
      slug: "JarvisTasks",
      version: "1.0.5",
      orientation: "portrait",
      icon: "./assets/images/icon.png",
      scheme: "myapp",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      ios: {
        supportsTablet: true,
        buildNumber: "5", //incrememnt for each build
        infoPlist: {
          NSSpeechRecognitionUsageDescription:
            "Allow $(PRODUCT_NAME) to use speech recognition. Your voice recordings are used to create tasks using AI assistance. Voice data is processed by OpenAI and not stored permanently.",
          NSMicrophoneUsageDescription:
            "Allow $(PRODUCT_NAME) to access your microphone. Voice recognition is used to convert your speech to text for AI task processing. Recordings are processed by OpenAI and not stored permanently.",
          // Privacy policy: https://ankitachowdhry.com/JarvisTasksPrivacyPolicy/privacy-policy.md
          NSPhotoLibraryUsageDescription:
            "This app does not actually use or access your photos.",
          NSPhotoLibraryAddUsageDescription:
            "This app does not actually use or access your photos.", // Add this
          NSCameraUsageDescription: "This app does not use the camera.", // And this
          NSMediaLibraryUsageDescription:
            "This app does not access your media library.", // And this
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
};
