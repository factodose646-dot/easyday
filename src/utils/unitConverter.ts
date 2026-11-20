export type ConverterCategory = 'length' | 'weight' | 'temperature' | 'volume';

export type LengthUnit = 'mm' | 'cm' | 'm' | 'km' | 'in' | 'ft' | 'yd' | 'mi';
export type WeightUnit = 'mg' | 'g' | 'kg' | 'lb' | 'oz';
export type TempUnit = 'c' | 'f' | 'k';
export type VolumeUnit = 'ml' | 'l' | 'gal';

export type UnitCode = LengthUnit | WeightUnit | TempUnit | VolumeUnit;

export interface UnitDefinition {
  code: UnitCode;
  symbol: string;
}

export const CATEGORY_UNITS: Record<ConverterCategory, UnitDefinition[]> = {
  length: [
    { code: 'mm', symbol: 'mm' },
    { code: 'cm', symbol: 'cm' },
    { code: 'm', symbol: 'm' },
    { code: 'km', symbol: 'km' },
    { code: 'in', symbol: 'in' },
    { code: 'ft', symbol: 'ft' },
    { code: 'yd', symbol: 'yd' },
    { code: 'mi', symbol: 'mi' },
  ],
  weight: [
    { code: 'mg', symbol: 'mg' },
    { code: 'g', symbol: 'g' },
    { code: 'kg', symbol: 'kg' },
    { code: 'lb', symbol: 'lb' },
    { code: 'oz', symbol: 'oz' },
  ],
  temperature: [
    { code: 'c', symbol: '°C' },
    { code: 'f', symbol: '°F' },
    { code: 'k', symbol: 'K' },
  ],
  volume: [
    { code: 'ml', symbol: 'mL' },
    { code: 'l', symbol: 'L' },
    { code: 'gal', symbol: 'gal' },
  ],
};

// Base factors: meter for length, kilogram for weight, liter for volume
const LENGTH_TO_METER: Record<LengthUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  km: 1000,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
};

const WEIGHT_TO_KG: Record<WeightUnit, number> = {
  mg: 1e-6,
  g: 0.001,
  kg: 1,
  lb: 0.45359237,
  oz: 0.028349523125,
};

const VOLUME_TO_LITER: Record<VolumeUnit, number> = {
  ml: 0.001,
  l: 1,
  gal: 3.785411784,
};

export interface ConversionResult {
  ok: boolean;
  value?: number;
  formatted?: string;
  errorKey?: 'invalidNumber' | 'belowAbsoluteZero';
}

export function formatConvertedNumber(num: number): string {
  if (!Number.isFinite(num)) return '0';
  if (Object.is(num, -0) || Math.abs(num) === 0) return '0';
  const cleaned = Number(num.toPrecision(10));
  if (Math.abs(cleaned) >= 1e9 || (Math.abs(cleaned) > 0 && Math.abs(cleaned) < 1e-6)) {
    return cleaned.toExponential(4);
  }
  return cleaned.toLocaleString('en-US', {
    maximumFractionDigits: 6,
    useGrouping: false,
  });
}

export function convertUnitValue(
  category: ConverterCategory,
  rawValue: string,
  from: UnitCode,
  to: UnitCode
): ConversionResult {
  const trimmed = rawValue.trim();
  if (!trimmed || trimmed === '-' || trimmed === '.') {
    return { ok: false, errorKey: 'invalidNumber' };
  }

  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    return { ok: false, errorKey: 'invalidNumber' };
  }

  let result = num;

  if (category === 'length') {
    const meters = num * LENGTH_TO_METER[from as LengthUnit];
    result = meters / LENGTH_TO_METER[to as LengthUnit];
  } else if (category === 'weight') {
    const kg = num * WEIGHT_TO_KG[from as WeightUnit];
    result = kg / WEIGHT_TO_KG[to as WeightUnit];
  } else if (category === 'volume') {
    const liters = num * VOLUME_TO_LITER[from as VolumeUnit];
    result = liters / VOLUME_TO_LITER[to as VolumeUnit];
  } else if (category === 'temperature') {
    let celsius = num;
    if (from === 'f') celsius = ((num - 32) * 5) / 9;
    if (from === 'k') celsius = num - 273.15;

    if (celsius < -273.15 - 1e-9) {
      return { ok: false, errorKey: 'belowAbsoluteZero' };
    }

    if (to === 'c') result = celsius;
    if (to === 'f') result = (celsius * 9) / 5 + 32;
    if (to === 'k') result = celsius + 273.15;
  }

  return {
    ok: true,
    value: result,
    formatted: formatConvertedNumber(result),
  };
}
