import type { VirtualFile } from "@/lib/types";

type FilePanelProps = {
  files: VirtualFile[];
  selectedFilePath: string | null;
  onSelectFile: (path: string) => void;
};

export function FilePanel({ files, selectedFilePath, onSelectFile }: FilePanelProps) {
  const sortedFiles = [...files].sort((left, right) => left.path.localeCompare(right.path));

  return (
    <section className="panel-surface rounded-lg">
      <div className="flex items-center justify-between border-b border-slate-800/90 px-3 py-2">
        <h2 className="text-sm font-medium text-slate-100">Files</h2>
        <span className="font-mono text-xs text-slate-600">{files.length} files</span>
      </div>
      <div className="p-2">
        {sortedFiles.length === 0 ? (
          <div className="px-1 py-1 text-sm text-slate-500">No generated files yet.</div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {sortedFiles.map((file) => {
              const isSelected = file.path === selectedFilePath;
              const fileName = file.path.split("/").pop() ?? file.path;

              return (
                <button
                  key={file.path}
                  onClick={() => onSelectFile(file.path)}
                  className={`min-w-[132px] rounded-md border px-3 py-2 text-left transition ${
                    isSelected
                      ? "border-blue-500/50 bg-blue-500/10 text-blue-100"
                      : "border-slate-800 bg-[#070a0f] text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span className="block truncate font-mono text-sm">{fileName}</span>
                  <span className="mt-1 block font-mono text-[11px] text-slate-600">
                    {file.language} · {file.content.length} chars
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
