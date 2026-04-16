import { uploadToCloudinary } from './cloudinary';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { PhotoType } from '@/types';

export async function uploadExchangePhoto(
  file: File,
  tripId: string,
  uploadedBy: string,
  photoType: PhotoType,
): Promise<string> {
  const result = await uploadToCloudinary(
    file,
    'community-ride',
  );

  const key = `${uploadedBy}_${photoType}`;
  await updateDoc(doc(db, 'trips', tripId), {
    [`exchangePhotos.${key}`]: {
      url: result.secure_url,
      publicId: result.public_id,
      type: photoType,
      uploadedBy,
      uploadedAt: serverTimestamp(),
    },
  });

  return result.secure_url;
}
