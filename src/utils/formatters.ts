/**
 * Format number to Vietnamese Currency string: 1.500.000 ₫
 */
export function formatVND(amount: number, showSymbol = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) return showSymbol ? '0 ₫' : '0';
  const formatted = Math.round(amount).toLocaleString('vi-VN');
  return showSymbol ? `${formatted} ₫` : formatted;
}

/**
 * Compact currency for charts or badges (ví dụ: 1.5 tr, 25 tr, 500 k)
 */
export function formatCompactVND(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.0', '')} tr`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)} k`;
  }
  return `${sign}${abs} ₫`;
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format Month YYYY-MM to "Tháng MM, YYYY"
 */
export function formatMonthVN(monthStr: string): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  return `Tháng ${parseInt(month, 10)}, ${year}`;
}

/**
 * Get readable day with relative reference (Hôm nay, Hôm qua)
 */
export function formatRelativeDateVN(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  if (dateStr === today) return 'Hôm nay';
  if (dateStr === yesterday) return 'Hôm qua';
  return formatDateVN(dateStr);
}

/**
 * Convert number in VND to Vietnamese words
 * e.g., 1500000 -> "Một triệu năm trăm nghìn đồng"
 */
export function numberToVietnameseWords(n: number): string {
  if (isNaN(n) || n === 0) return 'Không đồng';
  if (n < 0) return `Âm ${numberToVietnameseWords(-n).toLowerCase()}`;

  const defaultUnits = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroupOfThree(num: number, showZeroHundred: boolean): string {
    let result = '';
    const hundred = Math.floor(num / 100);
    const ten = Math.floor((num % 100) / 10);
    const unit = num % 10;

    if (hundred > 0 || showZeroHundred) {
      result += `${digits[hundred]} trăm `;
    }

    if (ten > 1) {
      result += `${digits[ten]} mươi `;
      if (unit === 1) result += 'mốt ';
      else if (unit === 5) result += 'lăm ';
      else if (unit > 0) result += `${digits[unit]} `;
    } else if (ten === 1) {
      result += 'mười ';
      if (unit === 5) result += 'lăm ';
      else if (unit > 0) result += `${digits[unit]} `;
    } else if (unit > 0) {
      if (hundred > 0 || showZeroHundred) {
        result += `lẻ ${digits[unit]} `;
      } else {
        result += `${digits[unit]} `;
      }
    }

    return result.trim();
  }

  const groups: number[] = [];
  let temp = Math.floor(n);
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let words = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal > 0) {
      const showZero = i < groups.length - 1;
      const groupWords = readGroupOfThree(groupVal, showZero);
      const unit = defaultUnits[i] ? ` ${defaultUnits[i]}` : '';
      words += `${groupWords}${unit} `;
    }
  }

  words = words.trim();
  if (!words) return 'Không đồng';
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1);
  return `${capitalized} đồng`;
}

/**
 * Format gold quantity in Phân into readable string with Chỉ and Phân:
 * E.g., 25 phan -> "2 chỉ 5 phân"
 * 10 phan -> "1 chỉ"
 * 5 phan -> "5 phân"
 */
export function formatGoldQuantity(totalPhan: number): string {
  if (totalPhan === undefined || totalPhan === null || isNaN(totalPhan) || totalPhan === 0) {
    return '0 phân';
  }
  const absPhan = Math.abs(totalPhan);
  const chi = Math.floor(absPhan / 10);
  const phan = Math.round((absPhan % 10) * 100) / 100;

  let str = '';
  if (chi > 0 && phan > 0) {
    str = `${chi} chỉ ${phan} phân`;
  } else if (chi > 0) {
    str = `${chi} chỉ`;
  } else {
    str = `${phan} phân`;
  }

  return totalPhan < 0 ? `-${str}` : str;
}

