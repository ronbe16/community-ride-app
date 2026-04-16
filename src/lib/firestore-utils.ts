import { DocumentReference, DocumentSnapshot, getDoc } from 'firebase/firestore';

export async function getDocWithRetry(ref: DocumentReference, retries = 2): Promise<DocumentSnapshot> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await getDoc(ref);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw new Error('unreachable');
}
