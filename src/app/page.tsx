
"use client";

import type { ChangeEvent } from 'react';
import { useState, useCallback, useRef } from 'react';
import { CsvUploader } from '@/components/csv-uploader';
import { DataTable } from '@/components/data-table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Loader2, FileWarning } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { parseCSV, type ParsedCsvData } from '@/lib/csv-parser';


export default function Home() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [pageIsLoading, setPageIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const { toast } = useToast();
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleUploadSuccess = useCallback((newHeaders: string[], newData: Record<string, string>[], fileName: string) => {
    setHeaders(newHeaders);
    setData(newData);
    setUploadError('');
    // newHeaders.length > 0 is already checked in CsvUploader before calling this
    setUploadedFileName(fileName);
    setShowUploader(false);
    toast({
      title: "CSV Uploaded Successfully",
      description: `File "${fileName}" processed. Found ${newHeaders.length} columns and ${newData.length} rows.`,
      variant: "default",
    });
  }, [toast]);

  const handleUploadError = useCallback((errorMessage: string) => {
    setUploadError(errorMessage);
    setHeaders([]);
    setData([]);
    setUploadedFileName(null);
    setShowUploader(true); // Revert to main uploader on any error
    if (errorMessage) {
       toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRowUpdate = useCallback((rowIndex: number, updatedRow: Record<string, string>) => {
    setData(currentData =>
      currentData.map((row, index) => (index === rowIndex ? updatedRow : row))
    );
    toast({
        title: "Row Updated",
        description: `Row ${rowIndex + 1} has been successfully updated.`,
    });
  }, [toast]);

  const handleRowDelete = useCallback((rowIndex: number) => {
    setData(currentData => currentData.filter((_, index) => index !== rowIndex));
    toast({
        title: "Row Deleted",
        description: `Row ${rowIndex + 1} has been successfully deleted.`,
    });
  }, [toast]);

  const handleNewFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input immediately
    }
    if (file) {
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        handleUploadError('Invalid file type. Please upload a CSV file.');
        return;
      }
      setPageIsLoading(true);
      setUploadError('');

      try {
        const text = await file.text();
        const { headers: newHeaders, data: newData }: ParsedCsvData = parseCSV(text);

        if (newHeaders.length === 0) {
          // This will call handleUploadError, which sets showUploader back to true
          handleUploadError('CSV file seems to be empty or not formatted correctly (no headers found).');
        } else {
          handleUploadSuccess(newHeaders, newData, file.name);
        }
      } catch (error) {
        console.error("Error parsing CSV:", error);
        // This will call handleUploadError, which sets showUploader back to true
        handleUploadError('Failed to parse CSV file. Please check its format and content.');
      } finally {
        setPageIsLoading(false);
      }
    }
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12 min-h-screen bg-background text-foreground font-body antialiased">
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-extrabold text-primary mb-3 tracking-tight">
            CSV Data Manager
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload, view, edit, and manage your CSV data with an intuitive interface.
          </p>
        </header>

        {showUploader ? (
          <CsvUploader
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            setPageLoading={setPageIsLoading}
          />
        ) : (
          !pageIsLoading && uploadedFileName && (
            <div className="flex justify-between items-center mb-6 p-4 bg-card rounded-lg shadow-md">
              <div>
                <span className="text-sm font-medium text-foreground mr-2">Uploaded File:</span>
                <span className="text-sm text-primary font-semibold">{uploadedFileName}</span>
              </div>
              <Button onClick={handleChooseFileClick} variant="outline" className="text-primary border-primary/50 hover:bg-primary/10 hover:text-primary">
                Choose New File
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleNewFileSelected}
                accept=".csv"
                className="hidden"
                id="hidden-file-input"
              />
            </div>
          )
        )}

        {pageIsLoading && (
          <div className="flex flex-col items-center justify-center text-center my-12 p-8 bg-card rounded-lg shadow">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg text-foreground font-semibold">Processing CSV file...</p>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </div>
        )}
        
        {!pageIsLoading && uploadError && (
          <Alert variant="destructive" className="max-w-2xl mx-auto my-8 shadow-md">
            <FileWarning className="h-5 w-5" />
            <AlertTitle>Upload Failed</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {!pageIsLoading && !uploadError && headers.length > 0 && (
          <DataTable
            initialHeaders={headers}
            initialData={data}
            onRowUpdate={handleRowUpdate}
            onRowDelete={handleRowDelete}
          />
        )}

      </main>
      <Toaster />
    </>
  );
}
