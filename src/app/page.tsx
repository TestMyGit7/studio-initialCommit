
"use client";

import { useState, useCallback } from 'react';
import { CsvUploader } from '@/components/csv-uploader';
import { DataTable } from '@/components/data-table';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, FileWarning } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster"; // For potential future use if errors become toasts.
import { useToast } from "@/hooks/use-toast";


export default function Home() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [pageIsLoading, setPageIsLoading] = useState(false); // For CSV processing
  const [uploadError, setUploadError] = useState<string>('');
  const { toast } = useToast();


  const handleUploadSuccess = useCallback((newHeaders: string[], newData: Record<string, string>[]) => {
    setHeaders(newHeaders);
    setData(newData);
    setUploadError('');
    if (newHeaders.length > 0) {
      toast({
        title: "CSV Uploaded Successfully",
        description: `Found ${newHeaders.length} columns and ${newData.length} rows.`,
        variant: "default", 
      });
    }
  }, [toast]);

  const handleUploadError = useCallback((errorMessage: string) => {
    setUploadError(errorMessage);
    setHeaders([]);
    setData([]);
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

        <CsvUploader
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          setPageLoading={setPageIsLoading}
        />

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

        {!pageIsLoading && !uploadError && headers.length === 0 && (
          <div className="text-center text-muted-foreground mt-16 p-8 bg-card rounded-lg shadow max-w-md mx-auto">
            <Info size={48} className="mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Ready to Start?</h2>
            <p className="text-sm">
              Upload a CSV file using the panel above to begin managing your data.
            </p>
          </div>
        )}
      </main>
      <Toaster />
    </>
  );
}
