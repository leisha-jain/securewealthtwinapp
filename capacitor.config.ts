import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.securewealthtwin.app',
  appName: 'SecureWealthTwin',
  webDir: 'build',
  // Capacitor defaults to serving the app from https://localhost, but the
  // backend here is plain http://. That mismatch is "mixed content" and gets
  // silently blocked by the Android WebView (separate from the
  // usesCleartextTraffic manifest flag, which only covers the native network
  // stack, not WebView sub-resource fetches). Serving the app itself over
  // http matches the backend's scheme and avoids the block entirely.
  server: {
    androidScheme: 'http'
  },
  // The DOM 'resize'/visualViewport events this app previously relied on to
  // detect the keyboard opening don't fire reliably on all Android WebView
  // builds. The Keyboard plugin's native 'body' resize mode has Capacitor's
  // own Android layer resize the WebView directly when the keyboard opens,
  // bypassing that unreliability entirely.
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
