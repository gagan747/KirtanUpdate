import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates responsive class names based on mobile and desktop variants
 */
export function responsive(
  mobile: string, 
  desktop: string
): string {
  return `${mobile} ${desktop.split(' ').map(cls => `sm:${cls}`).join(' ')}`;
}

/**
 * Generates responsive font size class names
 */
export function responsiveText(
  mobile: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl',
  desktop: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
): string {
  return `text-${mobile} sm:text-${desktop}`;
}
