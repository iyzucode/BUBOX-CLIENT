/** GET /Biodata/Profile. *ChangeAvailableAt (UTC ISO) = kapan boleh diubah lagi; null = boleh sekarang. */
export interface Profile {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  avatarUrl: string | null;
  fullNameChangeAvailableAt: string | null;
  usernameChangeAvailableAt: string | null;
  avatarChangeAvailableAt: string | null;
}

export type EditableProfileField = 'name' | 'username' | 'phone' | 'whatsapp';
