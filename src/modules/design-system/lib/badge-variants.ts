import { cva } from 'class-variance-authority';

export const extendedBadgeVariants = cva('', {
  variants: {
    variant: {
      navy: 'bg-navy-900 text-white',
      accent: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
      success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
      warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      error: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    },
  },
});
