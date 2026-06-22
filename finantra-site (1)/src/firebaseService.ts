import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { Transaction, MonthlyBill, Investment } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();

// Error logger as required by firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Wrappers
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out Error:', error);
    throw error;
  }
}

// Check database connection
export async function testFirebaseConnection(): Promise<boolean> {
  // If we can get a light reference, connection is active
  try {
    return !!db;
  } catch (e) {
    return false;
  }
}

// Firestore operations for TRANSACTIONS
export async function fetchTransactions(profileId: string): Promise<Transaction[] | null> {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  const colPath = 'transactions';
  try {
    const q = query(
      collection(db, colPath),
      where('userId', '==', userId),
      where('profileId', '==', profileId)
    );
    const querySnapshot = await getDocs(q);
    const list: Transaction[] = [];
    querySnapshot.forEach((document) => {
      const data = document.data();
      list.push({
        id: data.id,
        type: data.type as any,
        description: data.description,
        amount: Number(data.amount),
        category: data.category,
        date: data.date,
        paymentMethod: data.paymentMethod || 'Manual',
        notes: data.notes || '',
        profileId: data.profileId
      });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
    return null;
  }
}

export async function upsertTransaction(transaction: Transaction): Promise<boolean> {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  const colPath = 'transactions';
  try {
    const payload = {
      id: transaction.id,
      type: transaction.type,
      description: transaction.description || '',
      amount: Number(transaction.amount) || 0,
      category: transaction.category || '',
      date: transaction.date || '',
      paymentMethod: transaction.paymentMethod || 'Manual',
      notes: transaction.notes || '',
      profileId: transaction.profileId,
      userId: userId
    };

    await setDoc(doc(db, colPath, transaction.id), payload);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, colPath);
    return false;
  }
}

export async function deleteTransactionFromDb(id: string): Promise<boolean> {
  const colPath = 'transactions';
  try {
    await deleteDoc(doc(db, colPath, id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, colPath);
    return false;
  }
}

// Firestore operations for MONTHLY BILLS
export async function fetchMonthlyBills(profileId: string): Promise<MonthlyBill[] | null> {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  const colPath = 'monthly_bills';
  try {
    const q = query(
      collection(db, colPath),
      where('userId', '==', userId),
      where('profileId', '==', profileId)
    );
    const querySnapshot = await getDocs(q);
    const list: MonthlyBill[] = [];
    querySnapshot.forEach((document) => {
      const data = document.data();
      list.push({
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        dueDate: data.dueDate,
        category: data.category,
        isPaid: Boolean(data.isPaid),
        notes: data.notes || '',
        profileId: data.profileId
      });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
    return null;
  }
}

export async function upsertMonthlyBill(bill: MonthlyBill): Promise<boolean> {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  const colPath = 'monthly_bills';
  try {
    const payload = {
      id: bill.id,
      description: bill.description || '',
      amount: Number(bill.amount) || 0,
      dueDate: bill.dueDate || '',
      category: bill.category || '',
      isPaid: Boolean(bill.isPaid),
      notes: bill.notes || '',
      profileId: bill.profileId,
      userId: userId
    };

    await setDoc(doc(db, colPath, bill.id), payload);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, colPath);
    return false;
  }
}

export async function deleteMonthlyBillFromDb(id: string): Promise<boolean> {
  const colPath = 'monthly_bills';
  try {
    await deleteDoc(doc(db, colPath, id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, colPath);
    return false;
  }
}

// Firestore operations for INVESTMENTS
export async function fetchInvestments(profileId: string): Promise<Investment[] | null> {
  const userId = auth.currentUser?.uid;
  if (!userId) return null;

  const colPath = 'investments';
  try {
    const q = query(
      collection(db, colPath),
      where('userId', '==', userId),
      where('profileId', '==', profileId)
    );
    const querySnapshot = await getDocs(q);
    const list: Investment[] = [];
    querySnapshot.forEach((document) => {
      const data = document.data();
      list.push({
        id: data.id,
        name: data.name,
        type: data.type as any,
        amountInvested: Number(data.amountInvested),
        currentAmount: Number(data.currentAmount),
        yieldRate: data.yieldRate !== undefined ? Number(data.yieldRate) : undefined,
        acquisitionDate: data.acquisitionDate,
        broker: data.broker,
        profileId: data.profileId
      });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, colPath);
    return null;
  }
}

export async function upsertInvestment(investment: Investment): Promise<boolean> {
  const userId = auth.currentUser?.uid;
  if (!userId) return false;

  const colPath = 'investments';
  try {
    const payload = {
      id: investment.id,
      name: investment.name || '',
      type: investment.type,
      amountInvested: Number(investment.amountInvested) || 0,
      currentAmount: Number(investment.currentAmount) || 0,
      yieldRate: investment.yieldRate !== undefined ? Number(investment.yieldRate) : 0,
      acquisitionDate: investment.acquisitionDate || '',
      broker: investment.broker || '',
      profileId: investment.profileId,
      userId: userId
    };

    await setDoc(doc(db, colPath, investment.id), payload);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, colPath);
    return false;
  }
}

export async function deleteInvestmentFromDb(id: string): Promise<boolean> {
  const colPath = 'investments';
  try {
    await deleteDoc(doc(db, colPath, id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, colPath);
    return false;
  }
}
