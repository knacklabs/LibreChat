import type { Row } from '@tanstack/react-table';
import type { TFile } from 'librechat-data-provider';
import { CheckCircle2 } from 'lucide-react';
import ImagePreview from '~/components/Chat/Input/Files/ImagePreview';
import FilePreview from '~/components/Chat/Input/Files/FilePreview';
import { getFileType } from '~/utils';

export default function PanelFileCell({ 
  row, 
  isSelected 
}: { 
  row: Row<TFile | undefined>;
  isSelected?: boolean;
}) {
  const file = row.original;
  return (
    <div className="flex w-full items-center gap-2">
      {isSelected !== undefined && (
        <CheckCircle2 
          className={`h-5 w-5 flex-shrink-0 transition-colors ${
            isSelected 
              ? 'text-green-600 fill-green-100 dark:text-green-500 dark:fill-green-900' 
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      )}
      {file?.type?.startsWith('image') === true ? (
        <ImagePreview
          url={file.filepath}
          className="h-10 w-10 flex-shrink-0"
          source={file.source}
          alt={file.filename}
        />
      ) : (
        <FilePreview fileType={getFileType(file?.type)} file={file} />
      )}
      <div className="min-w-0 flex-1 overflow-hidden">
        <span className="block w-full overflow-hidden truncate text-ellipsis whitespace-nowrap text-xs">
          {file?.filename}
        </span>
      </div>
    </div>
  );
}
