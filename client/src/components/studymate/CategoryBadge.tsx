import { Category, categoryLabels } from '@/types/chat';
import { cn } from '@/lib/utils';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md';
}

const categoryStyles: Record<Category, string> = {
  study: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  essay: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  code: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  language: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  general: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
};

export function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        categoryStyles[category],
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      )}
    >
      {categoryLabels[category]}
    </span>
  );
}
