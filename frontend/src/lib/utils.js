import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует цену с разделением тысяч пробелами
 * @param {number|string} price - Цена для форматирования
 * @returns {string} Отформатированная цена
 */
export function formatPrice(price) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0.00';
  
  // Округляем до 2 знаков после запятой
  const fixed = numPrice.toFixed(2);
  
  // Разделяем целую и десятичную части
  const parts = fixed.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '00';
  
  // Форматируем целую часть с разделением тысяч пробелами
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return `${formattedInteger}.${decimalPart}`;
}

