import { WasteRecord, WasteCategory, District, DISTRICTS, AnalysisResult, HouseholdStats, DistrictStats } from '../types';

// Utility to get random item
const getRandom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Generate simulated IoT data
export const generateData = (days: number = 7, householdsPerDistrict: number = 20): AnalysisResult => {
  const records: WasteRecord[] = [];
  const now = new Date();

  // Helper to generate realistic weight based on category
  const getWeight = (category: WasteCategory): number => {
    // Organic is usually heavier and more frequent in Hanoi
    if (category === 'Organic') return Number((Math.random() * 3 + 1.5).toFixed(2));
    if (category === 'Recyclable') return Number((Math.random() * 2 + 0.5).toFixed(2));
    // Residual depends on compliance
    return Number((Math.random() * 2 + 1.0).toFixed(2)); 
  };

  const householdIds: Record<District, string[]> = {} as any;

  // Init households
  DISTRICTS.forEach(d => {
    householdIds[d] = Array.from({ length: householdsPerDistrict }, (_, i) => `${d.replace(/\s/g, '').toUpperCase()}-${1000 + i}`);
  });

  // Generate records
  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    
    DISTRICTS.forEach(district => {
      const households = householdIds[district];
      const routeId = `R-${district.substring(0,2).toUpperCase()}-${100 + d}`;

      households.forEach(hhId => {
        // Not every household throws out every type of trash every day
        // 80% chance of organic
        if (Math.random() > 0.2) {
          records.push({
            id: crypto.randomUUID(),
            householdId: hhId,
            district,
            category: 'Organic',
            weightKg: getWeight('Organic'),
            timestamp: date.toISOString(),
            routeId
          });
        }
        
        // 40% chance of recyclable
        if (Math.random() > 0.6) {
           records.push({
            id: crypto.randomUUID(),
            householdId: hhId,
            district,
            category: 'Recyclable',
            weightKg: getWeight('Recyclable'),
            timestamp: date.toISOString(),
            routeId
          });
        }

        // Residual: Varies by "Compliance Profile" simulated randomly
        // Some households are bad actors (high residual)
        const isBadActor = hhId.endsWith('5') || hhId.endsWith('9'); // Arbitrary bad actors
        if (Math.random() > 0.1) {
           let weight = getWeight('Residual');
           if (isBadActor) weight *= 2.5; // High residual for bad actors

           records.push({
            id: crypto.randomUUID(),
            householdId: hhId,
            district,
            category: 'Residual',
            weightKg: Number(weight.toFixed(2)),
            timestamp: date.toISOString(),
            routeId
          });
        }
      });
    });
  }

  return processData(records);
};

// Aggregate and Analyze
const processData = (records: WasteRecord[]): AnalysisResult => {
  const householdMap = new Map<string, { district: District; weights: Record<WasteCategory, number> }>();
  
  // 1. Sum weights per household
  records.forEach(r => {
    if (!householdMap.has(r.householdId)) {
      householdMap.set(r.householdId, { 
        district: r.district, 
        weights: { Organic: 0, Recyclable: 0, Residual: 0 } 
      });
    }
    const h = householdMap.get(r.householdId)!;
    h.weights[r.category] += r.weightKg;
  });

  // 2. Calculate Household Stats
  const householdStats: HouseholdStats[] = [];
  Array.from(householdMap.entries()).forEach(([hhId, data]) => {
    const total = data.weights.Organic + data.weights.Recyclable + data.weights.Residual;
    const composition = {
      Organic: (data.weights.Organic / total) * 100,
      Recyclable: (data.weights.Recyclable / total) * 100,
      Residual: (data.weights.Residual / total) * 100,
    };
    
    // Simple logic: Flag if residual > 50% (Hanoi target might be < 30%)
    const isFlagged = composition.Residual > 50;
    
    // Compliance Score: Higher organic/recycling is better
    const complianceScore = Math.max(0, 100 - composition.Residual);

    householdStats.push({
      householdId: hhId,
      district: data.district,
      totalWeight: total,
      composition,
      weights: data.weights,
      complianceScore,
      isFlagged
    });
  });

  // 3. District Stats
  const districtMap = new Map<District, { weights: Record<WasteCategory, number>; householdCount: number; flaggedCount: number }>();
  DISTRICTS.forEach(d => districtMap.set(d, { weights: { Organic: 0, Recyclable: 0, Residual: 0 }, householdCount: 0, flaggedCount: 0 }));

  householdStats.forEach(h => {
    const d = districtMap.get(h.district)!;
    d.weights.Organic += h.weights.Organic;
    d.weights.Recyclable += h.weights.Recyclable;
    d.weights.Residual += h.weights.Residual;
    d.householdCount += 1;
    if (h.isFlagged) d.flaggedCount += 1;
  });

  const districtStats: DistrictStats[] = [];
  districtMap.forEach((val, key) => {
    const total = val.weights.Organic + val.weights.Recyclable + val.weights.Residual;
    districtStats.push({
      name: key,
      totalWeight: total,
      composition: {
         Organic: total > 0 ? (val.weights.Organic / total) * 100 : 0,
         Recyclable: total > 0 ? (val.weights.Recyclable / total) * 100 : 0,
         Residual: total > 0 ? (val.weights.Residual / total) * 100 : 0,
      },
      weights: val.weights,
      averageHouseholdWeight: total / (val.householdCount || 1),
      flaggedHouseholdsCount: val.flaggedCount
    });
  });

  const totalSystemWeight = districtStats.reduce((acc, d) => acc + d.totalWeight, 0);
  const averageCompliance = householdStats.reduce((acc, h) => acc + h.complianceScore, 0) / householdStats.length;

  return {
    records,
    householdStats,
    districtStats,
    totalWeight: totalSystemWeight,
    averageCompliance
  };
};