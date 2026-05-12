export type WasteType = 'Plastic' | 'Organic' | 'Electronic' | 'Metal' | 'Other';
export type ReportStatus = 'Pending' | 'Cleaned';
export type UserRole = 'volunteer' | 'authority';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  ecoKarma: number;
  role: UserRole;
}

export interface WasteReport {
  id: string;
  lat: number;
  lng: number;
  wasteType: WasteType;
  description: string;
  imageUrl: string;
  status: ReportStatus;
  reportedBy: string;
  reportedByName: string;
  reportedAt: any; // Firestore Timestamp
  cleanedBy?: string;
  cleanedAt?: any; // Firestore Timestamp
  cleanedLat?: number;
  cleanedLng?: number;
}
