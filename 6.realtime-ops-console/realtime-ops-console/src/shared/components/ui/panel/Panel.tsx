export function Panel({ title, children, ...props }: React.ComponentProps<'div'> & { title: string }) {
    return (
        <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg overflow-hidden" {...props}>
            {title && (
                <header className="px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-700">
                    {title}
                </header>
            )}
            <div className="flex-1 overflow-auto p-4">{children}</div>
        </div>
    );
}