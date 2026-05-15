import { auth } from '../firebase';

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  }
  
  const errorMessage = `Firestore ${operationType} failed: ${errInfo.error}`;
  console.error(errorMessage, errInfo);
  
  // Custom error that includes the structured data
  const finalError = new Error(JSON.stringify(errInfo));
  
  let readableMessage = `Unable to ${operationType.toLowerCase()} data. Please check your permissions or network.`;
  
  if (errInfo.error.includes('unavailable') || errInfo.error.includes('offline')) {
    readableMessage = "Unable to connect to the database. Trying to reconnect... If this persists, please refresh the page.";
  }
  
  (finalError as any).readableMessage = readableMessage;
  (finalError as any).originalError = error;
  (finalError as any).isFirestoreError = true;
  
  return finalError;
}
