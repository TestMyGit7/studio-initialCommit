
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

interface DatasetSlot {
  id: number;
  headers: string[];
  data: Record<string, string>[];
  fileName: string | null;
  isUploading: boolean;
  uploadError: string;
}

const initialSlots: DatasetSlot[] = [
  { id: 0, headers: [], data: [], fileName: null, isUploading: false, uploadError: '' },
  { id: 1, headers: [], data: [], fileName: null, isUploading: false, uploadError: '' },
];

export default function Home() {
  const [datasetSlots, setDatasetSlots] = useState<DatasetSlot[]>(initialSlots);
  const { toast } = useToast();
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSetSlotUploading = useCallback((slotId: number, loading: boolean) => {
    setDatasetSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId ? { ...slot, isUploading: loading } : slot
      )
    );
  }, []);

  const handleUploadSuccess = useCallback((slotId: number, newHeaders: string[], newData: Record<string, string>[], fileName: string) => {
    setDatasetSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              headers: newHeaders,
              data: newData,
              fileName: fileName,
              uploadError: '',
              isUploading: false,
            }
          : slot
      )
    );
    toast({
      title: `Slot ${slotId + 1}: CSV Uploaded Successfully`,
      description: `File "${fileName}" processed. Found ${newHeaders.length} columns and ${newData.length} rows.`,
      variant: "default",
    });
  }, [toast]);

  const handleUploadError = useCallback((slotId: number, errorMessage: string) => {
    setDatasetSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              headers: [],
              data: [],
              fileName: null,
              uploadError: errorMessage,
              isUploading: false,
            }
          : slot
      )
    );
    if (errorMessage) {
       toast({
        title: `Slot ${slotId + 1}: Upload Error`,
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRowUpdate = useCallback((slotId: number, rowIndex: number, updatedRow: Record<string, string>) => {
    setDatasetSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              data: slot.data.map((row, index) => (index === rowIndex ? updatedRow : row)),
            }
          : slot
      )
    );
    toast({
        title: `Slot ${slotId + 1}: Row Updated`,
        description: `Row ${rowIndex + 1} has been successfully updated.`,
    });
  }, [toast]);

  const handleRowDelete = useCallback((slotId: number, rowIndex: number) => {
    setDatasetSlots(prevSlots =>
      prevSlots.map(slot =>
        slot.id === slotId
          ? {
              ...slot,
              data: slot.data.filter((_, index) => index !== rowIndex),
            }
          : slot
      )
    );
    toast({
        title: `Slot ${slotId + 1}: Row Deleted`,
        description: `Row ${rowIndex + 1} has been successfully deleted.`,
    });
  }, [toast]);

  const handleNewFileSelected = async (slotId: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileInputRefs.current[slotId]) {
      fileInputRefs.current[slotId]!.value = ""; 
    }

    if (file) {
      if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
        handleUploadError(slotId, 'Invalid file type. Please upload a CSV file.');
        return;
      }
      
      handleSetSlotUploading(slotId, true);
      
      try {
        const text = await file.text();
        const { headers: newHeaders, data: newData }: ParsedCsvData = parseCSV(text);

        if (newHeaders.length === 0) {
          handleUploadError(slotId, 'CSV file seems to be empty or not formatted correctly (no headers found).');
        } else {
          handleUploadSuccess(slotId, newHeaders, newData, file.name);
        }
      } catch (error) {
        console.error("Error parsing CSV for slot " + slotId + ":", error);
        handleUploadError(slotId, 'Failed to parse CSV file. Please check its format and content.');
      }
    }
  };

  const handleChooseNewFileClick = (slotId: number) => {
    fileInputRefs.current[slotId]?.click();
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8 md:px-8 md:py-12 min-h-screen bg-background text-foreground font-body antialiased">
        <header className="mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-extrabold text-primary mb-3 tracking-tight">
            CSV Data Manager
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload, view, edit, and manage your CSV data with an intuitive interface. Supports up to 2 files simultaneously.
          </p>
        </header>

        <div className="flex flex-col space-y-12">
          {datasetSlots.map((slot) => (
            <section key={slot.id} className="p-4 md:p-6 bg-card rounded-xl shadow-lg border border-border">
              <h2 className="text-xl font-semibold text-primary mb-4">Data Slot {slot.id + 1}</h2>
              {slot.isUploading && (
                <div className="flex flex-col items-center justify-center text-center my-12 p-8">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg text-foreground font-semibold">Processing CSV file...</p>
                  <p className="text-muted-foreground">Please wait a moment.</p>
                </div>
              )}

              {!slot.isUploading && slot.fileName === null && (
                <>
                  <CsvUploader
                    onUploadSuccess={(headers, data, fileName) => handleUploadSuccess(slot.id, headers, data, fileName)}
                    onUploadError={(error) => handleUploadError(slot.id, error)}
                    setPageLoading={(loading) => handleSetSlotUploading(slot.id, loading)}
                  />
                  {slot.uploadError && (
                    <Alert variant="destructive" className="max-w-2xl mx-auto my-4 shadow-md">
                      <FileWarning className="h-5 w-5" />
                      <AlertTitle>Upload Failed for Slot {slot.id + 1}</AlertTitle>
                      <AlertDescription>{slot.uploadError}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {!slot.isUploading && slot.fileName !== null && (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-3 sm:p-4 bg-background/50 rounded-lg shadow-sm border border-border/50">
                    <div className="mb-2 sm:mb-0">
                      <span className="text-sm font-medium text-foreground mr-2">Uploaded File:</span>
                      <span className="text-sm text-primary font-semibold break-all">{slot.fileName}</span>
                    </div>
                    <Button onClick={() => handleChooseNewFileClick(slot.id)} variant="outline" className="text-primary border-primary/50 hover:bg-primary/10 hover:text-primary w-full sm:w-auto">
                      Choose New File
                    </Button>
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[slot.id] = el; }}
                      onChange={(event) => handleNewFileSelected(slot.id, event)}
                      accept=".csv"
                      className="hidden"
                      id={`hidden-file-input-${slot.id}`}
                    />
                  </div>
                  {slot.headers.length > 0 ? (
                    <DataTable
                      initialHeaders={slot.headers}
                      initialData={slot.data}
                      onRowUpdate={(rowIndex, updatedRow) => handleRowUpdate(slot.id, rowIndex, updatedRow)}
                      onRowDelete={(rowIndex) => handleRowDelete(slot.id, rowIndex)}
                    />
                  ) : (
                     <Alert variant="default" className="max-w-2xl mx-auto my-4 shadow-md">
                        <FileWarning className="h-5 w-5" />
                        <AlertTitle>No Data</AlertTitle>
                        <AlertDescription>The uploaded file for Slot {slot.id + 1} contained no valid data or headers.</AlertDescription>
                     </Alert>
                  )}
                </>
              )}
            </section>
          ))}
        </div>
      </main>
      <Toaster />
    </>
  );
}
