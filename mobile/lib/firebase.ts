import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  // @ts-expect-error - exists in RN bundle, missing from web type definitions
  getReactNativePersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from '../firebase-config.json';
import { FIRESTORE_DATABASE_ID } from '@shared/constants';

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
