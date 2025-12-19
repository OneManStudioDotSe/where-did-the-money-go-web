import { useState, useCallback, useRef } from 'react';
import type { CsvParseError } from '../types/csv';

interface FileUploadProps {
  onFileLoaded: (content: string, fileName: string) => void;
  onError: (error: CsvParseError) => void;
  isLoading?: boolean;
}

export function FileUpload({ onFileLoaded, onError, isLoading = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith('.csv')) {
        onError({
          type: 'invalid_format',
          message: 'Please upload a CSV file',
          details: `Received: ${file.name}`,
        });
        return;
      }

      setFileName(file.name);

      try {
        const content = await file.text();
        onFileLoaded(content, file.name);
      } catch {
        onError({
          type: 'encoding_error',
          message: 'Could not read the file',
          details: 'The file may be corrupted or in an unsupported encoding',
        });
      }
    },
    [onFileLoaded, onError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
        transition-all duration-200
        ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }
        ${isLoading ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleInputChange}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600">Processing file...</p>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <svg
              className={`w-12 h-12 mx-auto ${isDragging ? 'text-primary-500' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          <p className="text-gray-700 font-medium mb-1">
            {isDragging ? 'Drop your CSV file here' : 'Drag & drop your bank CSV export'}
          </p>
          <p className="text-sm text-gray-500 mb-4">or click to browse files</p>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <span className="px-2 py-1 bg-gray-100 rounded">UTF-8</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Semicolon delimited</span>
            <span className="px-2 py-1 bg-gray-100 rounded">.csv</span>
          </div>

          {fileName && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-success-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>{fileName}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
