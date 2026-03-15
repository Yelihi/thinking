import type { SearchItem } from './interface';

const categories = ['Render', 'Paging', 'Worker', 'Profiler', 'Scheduling'];

export const items: SearchItem[] = Array.from({ length: 200_000_0 }, (_, index) => {
  const category = categories[index % categories.length];

  return {
    id: index,
    title: `${category} sample ${index + 1}`,
  };
});
