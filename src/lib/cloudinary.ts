const CLOUD_NAME = 'dwpchrzqq';
const UPLOAD_PRESET = 'community-ride';
const BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<CloudinaryUploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type "${file.type}". Only JPEG, PNG, WebP, and HEIC images are allowed.`);
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 10 MB.`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const response = await fetch(BASE_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Cloudinary upload failed for folder "${folder}": ${response.statusText}`);
  }

  return response.json() as Promise<CloudinaryUploadResult>;
}

export async function uploadIdPhoto(file: File, userId: string): Promise<string> {
  const result = await uploadToCloudinary(file, `community-ride/id-photos/${userId}`);
  return result.secure_url;
}

export async function uploadPassengerScan(
  file: File,
  tripId: string,
  _seatIndex: number,
): Promise<string> {
  const result = await uploadToCloudinary(
    file,
    `community-ride/passenger-scans/${tripId}`,
  );
  return result.secure_url;
}

export async function uploadLtfrbQr(file: File, userId: string): Promise<string> {
  const result = await uploadToCloudinary(file, `community-ride/ltfrb-qr/${userId}`);
  return result.secure_url;
}
