const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export async function uploadToCloudinary(
  file: File,
  folder: string,
): Promise<CloudinaryUploadResult> {
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
