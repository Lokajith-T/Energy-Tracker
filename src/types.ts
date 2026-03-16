export interface UserProfile {
  email: string;
  tariff: number;
  usageLimit: number;
  currentUnits: number;
  consumerType?: 'domestic' | 'commercial';
}

export interface ApplianceUsage {
  name: string;
  power: number; // in Watts
  status: 'on' | 'off';
  icon: string;
}

export interface EnergyStats {
  voltage: number;
  current: number;
  power: number;
  units: number;
  lastUpdated: any;
  appliances?: ApplianceUsage[];
  detectionMethod?: string;
}

export type NavTab = 'dashboard' | 'appliances' | 'cost' | 'alerts' | 'profile';
