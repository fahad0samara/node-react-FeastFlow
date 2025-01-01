import mongoose, { Schema, Document } from 'mongoose';

interface DailyStats {
  date: Date;
  totalKwh: number;
  peakKwh: number;
  offPeakKwh: number;
  cost: number;
  co2Emissions: number;
  efficiency: number;
}

interface MonthlyStats {
  month: number;
  year: number;
  totalKwh: number;
  peakKwh: number;
  offPeakKwh: number;
  cost: number;
  co2Emissions: number;
  efficiency: number;
  dailyAverage: number;
  peakDemandDay: Date;
  lowestDemandDay: Date;
}

interface YearlyStats {
  year: number;
  totalKwh: number;
  peakKwh: number;
  offPeakKwh: number;
  cost: number;
  co2Emissions: number;
  efficiency: number;
  monthlyAverage: number;
  peakDemandMonth: number;
  lowestDemandMonth: number;
}

interface Analytics {
  daily: DailyStats[];
  monthly: MonthlyStats[];
  yearly: YearlyStats[];
  lastUpdated: Date;
}

interface DeviceUsage {
  deviceId: string;
  deviceName: string;
  powerRating: number; // in watts
  dailyUsageHours: number;
  weeklyUsageHours: number;
  monthlyKwh: number;
  monthlyCost: number;
  efficiency: number;
}

export interface IEnergyConsumption extends Document {
  restaurantId: string;
  analytics: Analytics;
  devices: DeviceUsage[];
  totalCost: number;
  totalKwh: number;
  lastUpdated: Date;
  calculateEfficiencyScore(deviceId: string): number;
  updateDeviceUsage(deviceId: string, usageHours: number): Promise<void>;
  calculateMonthlyCost(): number;
}

const DeviceUsageSchema = new Schema({
  deviceId: {
    type: String,
    required: true,
  },
  deviceName: {
    type: String,
    required: true,
  },
  powerRating: {
    type: Number,
    required: true,
    min: 0,
  },
  dailyUsageHours: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  weeklyUsageHours: {
    type: Number,
    required: true,
    min: 0,
    max: 168,
  },
  monthlyKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  monthlyCost: {
    type: Number,
    required: true,
    min: 0,
  },
  efficiency: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
});

const DailyStatsSchema = new Schema({
  date: {
    type: Date,
    required: true,
  },
  totalKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  peakKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  offPeakKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  co2Emissions: {
    type: Number,
    required: true,
    min: 0,
  },
  efficiency: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
});

const MonthlyStatsSchema = new Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  totalKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  peakKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  offPeakKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  co2Emissions: {
    type: Number,
    required: true,
    min: 0,
  },
  efficiency: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  dailyAverage: {
    type: Number,
    required: true,
    min: 0,
  },
  peakDemandDay: {
    type: Date,
    required: true,
  },
  lowestDemandDay: {
    type: Date,
    required: true,
  },
});

const YearlyStatsSchema = new Schema({
  year: {
    type: Number,
    required: true,
  },
  totalKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  peakKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  offPeakKwh: {
    type: Number,
    required: true,
    min: 0,
  },
  cost: {
    type: Number,
    required: true,
    min: 0,
  },
  co2Emissions: {
    type: Number,
    required: true,
    min: 0,
  },
  efficiency: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  monthlyAverage: {
    type: Number,
    required: true,
    min: 0,
  },
  peakDemandMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  lowestDemandMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
});

const AnalyticsSchema = new Schema({
  daily: [DailyStatsSchema],
  monthly: [MonthlyStatsSchema],
  yearly: [YearlyStatsSchema],
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

const EnergyConsumptionSchema = new Schema({
  restaurantId: {
    type: String,
    required: true,
    index: true,
  },
  analytics: {
    type: AnalyticsSchema,
    required: true,
    default: {
      daily: [],
      monthly: [],
      yearly: [],
      lastUpdated: new Date(),
    },
  },
  devices: {
    type: [DeviceUsageSchema],
    required: true,
    default: [],
  },
  totalCost: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  totalKwh: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
EnergyConsumptionSchema.index({ restaurantId: 1, 'analytics.lastUpdated': -1 });
EnergyConsumptionSchema.index({ 'devices.deviceId': 1 });

// Calculate efficiency score for a device based on its usage pattern and power rating
EnergyConsumptionSchema.methods.calculateEfficiencyScore = function(deviceId: string): number {
  const device = this.devices.find((d: { deviceId: string; }) => d.deviceId === deviceId);
  if (!device) {
    return 0;
  }

  // Calculate efficiency based on:
  // 1. Daily usage pattern (penalize if used during peak hours)
  // 2. Power rating (compare with industry standard)
  // 3. Monthly consumption trend

  const PEAK_HOURS_PENALTY = 0.2;
  const POWER_RATING_WEIGHT = 0.4;
  const USAGE_PATTERN_WEIGHT = 0.4;

  // Assume peak hours are 9 AM to 5 PM (8 hours)
  const peakHoursUsage = (device.dailyUsageHours / 24) * 8;
  const peakHoursScore = Math.max(0, 1 - (peakHoursUsage * PEAK_HOURS_PENALTY));

  // Compare power rating with industry standard (example values)
  const INDUSTRY_STANDARD_POWER = {
    refrigerator: 150,
    oven: 2000,
    stove: 1500,
    dishwasher: 1800,
    default: 1000,
  };
  const standardPower = INDUSTRY_STANDARD_POWER[device.deviceName.toLowerCase() as keyof typeof INDUSTRY_STANDARD_POWER] || 
    INDUSTRY_STANDARD_POWER.default;
  const powerRatingScore = Math.min(1, standardPower / device.powerRating);

  // Calculate usage pattern score
  const MAX_DAILY_HOURS = 24;
  const usagePatternScore = 1 - (device.dailyUsageHours / MAX_DAILY_HOURS);

  // Calculate final efficiency score
  const efficiencyScore = 
    (powerRatingScore * POWER_RATING_WEIGHT) +
    (peakHoursScore * PEAK_HOURS_PENALTY) +
    (usagePatternScore * USAGE_PATTERN_WEIGHT);

  // Convert to percentage and ensure it's between 0 and 100
  return Math.min(100, Math.max(0, efficiencyScore * 100));
};

// Update device usage hours and recalculate related metrics
EnergyConsumptionSchema.methods.updateDeviceUsage = async function(
  deviceId: string,
  usageHours: number
): Promise<void> {
  const device = this.devices.find((d: { deviceId: string; }) => d.deviceId === deviceId);
  if (!device) {
    throw new Error('Device not found');
  }

  // Update usage hours
  device.dailyUsageHours = usageHours;
  device.weeklyUsageHours = usageHours * 7;

  // Calculate monthly kWh
  const DAYS_IN_MONTH = 30;
  device.monthlyKwh = (device.powerRating * device.dailyUsageHours * DAYS_IN_MONTH) / 1000;

  // Calculate monthly cost (example rate of $0.12 per kWh)
  const RATE_PER_KWH = 0.12;
  device.monthlyCost = device.monthlyKwh * RATE_PER_KWH;

  // Update efficiency score
  device.efficiency = this.calculateEfficiencyScore(deviceId);

  // Update total consumption and cost
  this.totalKwh = this.devices.reduce((sum: any, d: { monthlyKwh: any; }) => sum + d.monthlyKwh, 0);
  this.totalCost = this.devices.reduce((sum: any, d: { monthlyCost: any; }) => sum + d.monthlyCost, 0);
  this.lastUpdated = new Date();

  await this.save();
};

// Calculate total monthly cost
EnergyConsumptionSchema.methods.calculateMonthlyCost = function(): number {
  return this.devices.reduce((total: any, device: { monthlyCost: any; }) => total + device.monthlyCost, 0);
};

export const EnergyConsumption = mongoose.model<IEnergyConsumption>(
  'EnergyConsumption',
  EnergyConsumptionSchema
);
