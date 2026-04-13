import type { OrgGroup } from '@/entities/org-group/models/entites';

interface OrgTreeProps {
    groups: OrgGroup[];
    selectedGroupId: string | null;
    onSelect: (id: string) => void;
}

export function OrgTree({ groups, selectedGroupId, onSelect }: OrgTreeProps) {
    const root = groups.find((g) => g.parentId === null);
    const children = groups.filter((g) => g.parentId === root?.id);

    return (
        <nav className="p-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Groups
            </h3>
            <ul className="flex flex-col gap-0.5">
                {root && (
                    <li>
                        <button
                            onClick={() => onSelect(root.id)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${selectedGroupId === root.id
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            {root.name}
                        </button>
                    </li>
                )}
                {children.map((g) => (
                    <li key={g.id} className="ml-3">
                        <button
                            onClick={() => onSelect(g.id)}
                            className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${selectedGroupId === g.id
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {g.name}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}