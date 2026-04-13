import type { OrgGroup } from './entites';

export const MOCK_GROUPS: OrgGroup[] = [
    { id: 'root', name: '전체', parentId: null },
    { id: 'web', name: 'Web Tier', parentId: 'root' },
    { id: 'db', name: 'DB Tier', parentId: 'root' },
    { id: 'batch', name: 'Batch Tier', parentId: 'root' },
];