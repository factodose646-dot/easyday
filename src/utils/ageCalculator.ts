export interface AgeResult {
  ok: boolean;
  errorKey?: 'empty' | 'invalid' | 'future';
  years?: number;
  months?: number;
  days?: number;
  totalMonths?: number;
  totalDays?: number;
  nextBirthdayDays?: number;
  nextBirthdayDate?: Date;
  isBirthdayToday?: boolean;
}

function parseISODate(dateStr: string): { y: number; m: number; d: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [yStr, mStr, dStr] = dateStr.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900) return null;

  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d };
}

function daysInMonthUTC(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

export function calculateExactAge(
  dobStr: string,
  referenceDate: Date = new Date()
): AgeResult {
  if (!dobStr.trim()) {
    return { ok: false, errorKey: 'empty' };
  }

  const dob = parseISODate(dobStr.trim());
  if (!dob) {
    return { ok: false, errorKey: 'invalid' };
  }

  const refY = referenceDate.getFullYear();
  const refM = referenceDate.getMonth() + 1;
  const refD = referenceDate.getDate();

  const dobUTC = Date.UTC(dob.y, dob.m - 1, dob.d);
  const refUTC = Date.UTC(refY, refM - 1, refD);

  if (dobUTC > refUTC) {
    return { ok: false, errorKey: 'future' };
  }

  let years = refY - dob.y;
  let months = refM - dob.m;
  let days = refD - dob.d;

  if (days < 0) {
    // Borrow days from the month preceding the reference month
    const prevMonthIndex0 = refM - 2 < 0 ? 11 : refM - 2;
    const prevMonthYear = refM - 2 < 0 ? refY - 1 : refY;
    days += daysInMonthUTC(prevMonthYear, prevMonthIndex0);
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const totalMonths = years * 12 + months;
  const totalDays = Math.floor((refUTC - dobUTC) / 86400000);

  // Compute next birthday (handle Feb 29 on non-leap years as Mar 1 or next valid date)
  const buildBirthdayUTC = (targetYear: number): number => {
    if (dob.m === 2 && dob.d === 29) {
      const isLeap =
        (targetYear % 4 === 0 && targetYear % 100 !== 0) ||
        targetYear % 400 === 0;
      return isLeap
        ? Date.UTC(targetYear, 1, 29)
        : Date.UTC(targetYear, 2, 1);
    }
    return Date.UTC(targetYear, dob.m - 1, dob.d);
  };

  let nextBdayUTC = buildBirthdayUTC(refY);
  const isBirthdayToday = nextBdayUTC === refUTC;

  if (nextBdayUTC < refUTC) {
    nextBdayUTC = buildBirthdayUTC(refY + 1);
  }

  const nextBirthdayDays = Math.round((nextBdayUTC - refUTC) / 86400000);
  const nextBirthdayDate = new Date(nextBdayUTC);

  return {
    ok: true,
    years,
    months,
    days,
    totalMonths,
    totalDays,
    nextBirthdayDays,
    nextBirthdayDate,
    isBirthdayToday,
  };
}
