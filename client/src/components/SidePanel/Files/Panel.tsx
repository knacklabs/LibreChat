import type { TFile } from 'librechat-data-provider';
import { useGetFiles } from '~/data-provider';
import { columns } from './PanelColumns';
import DataTable from './PanelTable';

interface FilesPanelProps {
  showSelection?: boolean;
}

export default function FilesPanel({ showSelection = false }: FilesPanelProps) {
  const { data: files = [] } = useGetFiles<TFile[]>();

  return (
    <div className="h-auto max-w-full overflow-x-hidden">
      <DataTable columns={columns} data={files} showSelection={showSelection} />
    </div>
  );
}
