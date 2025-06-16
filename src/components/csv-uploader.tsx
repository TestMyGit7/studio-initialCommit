
"use client";

import type { ChangeEvent, DragEvent } from 'react';
import { useCallback, useState } from 'react';
import { UploadCloud, Loader2, FileWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parseCSV, type ParsedCsvData } from '@/lib/csv-parser';

interface CsvUploaderProps {
  onUploadSuccess: (headers: string[], data: Record<string, string>[]) => void;
  onUploadError: (error: string) => void;
  setPageLoading: (loading: boolean) => void;
}

export function CsvUploader({ onUploadSuccess, onUploadError, setPageLoading }: CsvUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File | null) => {
    if (file) {
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        onUploadError('Invalid file type. Please upload a CSV file.');
        setFileName(null);
        return;
      }
      setPageLoading(true);
      onUploadError(''); 
      setFileName(file.name);

      try {
        const text = await file.text();
        const { headers, data }: ParsedCsvData = parseCSV(text);
        
        if (headers.length === 0) {
          onUploadError('CSV file seems to be empty or not formatted correctly (no headers found).');
          onUploadSuccess([], []);
        } else {
          onUploadSuccess(headers, data);
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        onUploadError('Failed to parse CSV file. Please check its format and content.');
        onUploadSuccess([], []);
      } finally {
        setPageLoading(false);
      }
    }
  }, [onUploadSuccess, onUploadError, setPageLoading]);

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <form
        id="form-file-upload"
        onDragEnter={handleDrag}
        onSubmit={(e) => e.preventDefault()} 
        className="relative"
      >
        <input
          type="file"
          id="input-file-upload"
          multiple={false}
          onChange={handleChange}
          accept=".csv"
          className="hidden"
        />
        <label
          htmlFor="input-file-upload"
          className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/70 bg-card"}
          `}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className={`w-10 h-10 mb-3 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
            <p className={`mb-2 text-sm ${dragActive ? "text-primary" : "text-muted-foreground"}`}>
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className={`text-xs ${dragActive ? "text-primary" : "text-muted-foreground"}`}>
              CSV files only (up to 10MB)
            </p>
            {fileName && !dragActive && (
              <p className="mt-4 text-sm text-primary font-medium">Selected file: {fileName}</p>
            )}
          </div>
        </label>
        {dragActive && (
          <div
            className="absolute inset-0 w-full h-full rounded-lg"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          ></div>
        )}
      </form>
    </div>
  );
}
