
"use client";

import type { UIEvent} from 'react';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditRowDialog } from './edit-row-dialog';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ROWS_PER_BATCH = 20; // Number of rows to load per scroll/batch
const SCROLL_THRESHOLD = 100; // Pixels from bottom to trigger load

interface DataTableProps {
  initialHeaders: string[];
  initialData: Record<string, string>[];
  onRowUpdate: (rowIndex: number, updatedData: Record<string, string>) => void;
  onRowDelete: (rowIndex: number) => void;
}

export function DataTable({ initialHeaders, initialData, onRowUpdate, onRowDelete }: DataTableProps) {
  const [headers, setHeaders] = useState<string[]>(initialHeaders);
  const [data, setData] = useState<Record<string, string>[]>(initialData);
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [editingRow, setEditingRow] = useState<{ index: number; data: Record<string, string> } | null>(null);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedRowsCount, setDisplayedRowsCount] = useState(ROWS_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeaders(initialHeaders);
    setData(initialData);
    setDisplayedRowsCount(ROWS_PER_BATCH); 
    setSortConfig(null); 
    setSearchTerm(''); 
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0; // Scroll to top on new data
    }
  }, [initialHeaders, initialData]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lowercasedFilter = searchTerm.toLowerCase();
    return data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(lowercasedFilter)
      )
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        
        // Attempt to compare as numbers if both are numeric strings
        const numA = parseFloat(valA);
        const numB = parseFloat(valB);

        if (!isNaN(numA) && !isNaN(numB)) {
          if (numA < numB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (numA > numB) return sortConfig.direction === 'ascending' ? 1 : -1;
          return 0;
        }

        // Fallback to string comparison
        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const visibleData = useMemo(() => {
    return sortedData.slice(0, displayedRowsCount);
  }, [sortedData, displayedRowsCount]);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setDisplayedRowsCount(ROWS_PER_BATCH); // Reset visible rows on sort
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleEdit = (rowIndexInVisibleData: number) => {
    const originalIndex = data.indexOf(visibleData[rowIndexInVisibleData]);
    if (originalIndex !== -1) {
      setEditingRow({ index: originalIndex, data: visibleData[rowIndexInVisibleData] });
    }
  };

  const handleSaveEdit = (updatedRow: Record<string, string>) => {
    if (editingRow !== null) {
      onRowUpdate(editingRow.index, updatedRow);
    }
    setEditingRow(null);
  };

  const handleDelete = (rowIndexInVisibleData: number) => {
    const originalIndex = data.indexOf(visibleData[rowIndexInVisibleData]);
    if (originalIndex !== -1) {
     setRowToDelete(originalIndex);
    }
  };

  const confirmDelete = () => {
    if (rowToDelete !== null) {
      onRowDelete(rowToDelete);
      // After deletion, the 'data' prop will update, triggering useEffect,
      // which will reset displayedRowsCount if needed.
      // Check if displayed count needs adjustment
      if (displayedRowsCount > sortedData.length -1 && sortedData.length -1 >= ROWS_PER_BATCH ) {
         setDisplayedRowsCount(sortedData.length -1);
      } else if (sortedData.length -1 < ROWS_PER_BATCH) {
         setDisplayedRowsCount(Math.max(ROWS_PER_BATCH, sortedData.length -1));
      }
    }
    setRowToDelete(null);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ArrowUp className="ml-2 h-4 w-4 text-primary" /> : 
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />;
  };

  const loadMoreRows = useCallback(() => {
    if (isLoadingMore || displayedRowsCount >= sortedData.length) return;

    setIsLoadingMore(true);
    // Simulate a small delay for loading, can be removed if data processing is instant
    setTimeout(() => {
      setDisplayedRowsCount(prevCount => Math.min(prevCount + ROWS_PER_BATCH, sortedData.length));
      setIsLoadingMore(false);
    }, 300); // Adjust delay as needed, or remove for instant load
  }, [isLoadingMore, displayedRowsCount, sortedData.length]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD) {
      loadMoreRows();
    }
  };
  
  useEffect(() => {
    // If initialData causes sortedData to be less than current displayedRowsCount, adjust it.
    // This is important if data shrinks significantly (e.g. after a delete and new file upload)
    if (sortedData.length < displayedRowsCount) {
        setDisplayedRowsCount(Math.max(ROWS_PER_BATCH, sortedData.length));
    }
  }, [sortedData, displayedRowsCount]);


  return (
    <div className="mt-8 bg-card p-4 md:p-6 rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <Input
          placeholder="Search table..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setDisplayedRowsCount(ROWS_PER_BATCH); // Reset on search
             if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = 0;
            }
          }}
          className="max-w-full sm:max-w-xs md:max-w-sm bg-background border-input focus:ring-primary"
        />
        {headers.length > 0 && (
           <div className="text-sm text-muted-foreground text-right whitespace-nowrap">
            <span>Columns: {headers.length}</span>
            <span className="mx-2">|</span>
            <span>
                Rows: {filteredData.length < data.length ? `${filteredData.length} (filtered) / ` : ''}
                {data.length} (total)
            </span>
          </div>
        )}
      </div>
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll} 
        className="overflow-x-auto overflow-y-auto max-h-[600px] relative border rounded-md"
      >
        <Table className="relative">
          <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
            <TableRow className="hover:bg-transparent">
              {headers.map((header) => (
                <TableHead 
                  key={header} 
                  onClick={() => requestSort(header)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap py-3 px-4"
                  aria-sort={sortConfig?.key === header ? sortConfig.direction : "none"}
                >
                  <div className="flex items-center">
                    {header}
                    {getSortIcon(header)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right whitespace-nowrap py-3 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleData.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`} className="hover:bg-muted/30 transition-colors duration-150">
                {headers.map((header) => (
                  <TableCell key={`${header}-${rowIndex}`} className="py-3 px-4 whitespace-nowrap max-w-xs truncate" title={row[header]}>
                    {row[header]}
                  </TableCell>
                ))}
                <TableCell className="text-right py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(rowIndex)} 
                      className="text-accent-foreground hover:bg-accent/80 p-1.5 h-auto"
                      aria-label={`Edit row ${rowIndex + 1}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(rowIndex)} 
                      className="text-accent-foreground hover:bg-accent/80 p-1.5 h-auto"
                      aria-label={`Delete row ${rowIndex + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {visibleData.length === 0 && !isLoadingMore && (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {isLoadingMore && (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading more...</span>
          </div>
        )}
        {!isLoadingMore && displayedRowsCount < sortedData.length && (
             <div className="h-1"></div> // Placeholder to ensure scroll event can trigger if content is short
        )}
      </div>

      {editingRow && (
        <EditRowDialog
          isOpen={!!editingRow}
          onClose={() => setEditingRow(null)}
          rowData={editingRow.data}
          headers={headers}
          onSave={handleSaveEdit}
          rowIndex={editingRow.index}
        />
      )}

      <AlertDialog open={rowToDelete !== null} onOpenChange={(open) => !open && setRowToDelete(null)}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground font-headline">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the row.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRowToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

