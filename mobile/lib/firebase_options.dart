import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return ios;
      case TargetPlatform.windows:
        return web;
      case TargetPlatform.linux:
        return web;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBwn60gZyG4rpZv4vJ1rKrIlJEBaY-EH2U',
    appId: '1:446551709086:web:feb2c7cdee5cc4cec8728f',
    messagingSenderId: '446551709086',
    projectId: 'bariisaa-tv',
    authDomain: 'bariisaa-tv.firebaseapp.com',
    storageBucket: 'bariisaa-tv.firebasestorage.app',
    measurementId: 'G-5FEZ3824LH',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyATVNwwyunnyDKeO1hgd1HAdwTEG-M0SkM',
    appId: '1:446551709086:android:eed81952bb49d64dc8728f',
    messagingSenderId: '446551709086',
    projectId: 'bariisaa-tv',
    storageBucket: 'bariisaa-tv.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCsDJHRUANsugp0g--p4V_cPd7XwGgVxlY',
    appId: '1:446551709086:ios:fb45db6d957c7958c8728f',
    messagingSenderId: '446551709086',
    projectId: 'bariisaa-tv',
    storageBucket: 'bariisaa-tv.firebasestorage.app',
    iosBundleId: 'com.naik.naikMobile',
  );
}
