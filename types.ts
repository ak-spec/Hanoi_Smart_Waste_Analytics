export type WasteCategory = 'Organic' | 'Recyclable' | 'Residual';

export const DISTRICTS = [
  'Ba Dinh',
  'Hoan Kiem',
  'Tay Ho',
  'Cau Giay',
  'Dong Da',
  'Hai Ba Trung'
] as const;

export type District = typeof DISTRICTS[number];

export interface WasteRecord {
  id: string;
  householdId: string;
  district: District;
  category: WasteCategory;
  weightKg: number;
  timestamp: string; // ISO string
  routeId: string;
}

export interface HouseholdStats {
  householdId: string;
  district: District;
  totalWeight: number;
  composition: Record<WasteCategory, number>; // Percentage 0-100
  weights: Record<WasteCategory, number>; // Absolute weight
  complianceScore: number; // 0-100
  isFlagged: boolean; // High residual flag
}

export interface DistrictStats {
  name: District;
  totalWeight: number;
  composition: Record<WasteCategory, number>;
  weights: Record<WasteCategory, number>;
  averageHouseholdWeight: number;
  flaggedHouseholdsCount: number;
}

export interface AnalysisResult {
  records: WasteRecord[];
  householdStats: HouseholdStats[];
  districtStats: DistrictStats[];
  totalWeight: number;
  averageCompliance: number;
}

export interface AIInsight {
  title: string;
  content: string;
  type: 'alert' | 'observation' | 'recommendation';
}