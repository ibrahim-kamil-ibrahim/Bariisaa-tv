import * as admin from 'firebase-admin';
import { env } from './environment';

const isFirebaseConfigured =
  env.FIREBASE_PROJECT_ID &&
  env.FIREBASE_PROJECT_ID !== 'your-firebase-project-id' &&
  env.FIREBASE_CLIENT_EMAIL &&
  env.FIREBASE_CLIENT_EMAIL !== 'your-firebase-client-email' &&
  env.FIREBASE_PRIVATE_KEY &&
  env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');

if (isFirebaseConfigured) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID!,
        clientEmail: env.FIREBASE_CLIENT_EMAIL!,
        privateKey: env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
}

export default admin;
