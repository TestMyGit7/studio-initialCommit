
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ROWS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRow, setEditingRow] = useState<{ index: number; data: Record<string, string> } | null>(null);
  const [rowToDelete, setRowToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setHeaders(initialHeaders);
    setData(initialData);
    setCurrentPage(1); // Reset to first page on new data
    setSortConfig(null); // Reset sort on new data
    setSearchTerm(''); // Reset search on new data
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

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return sortedData.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleEdit = (rowIndexInPaginatedData: number) => {
    const originalIndex = data.indexOf(paginatedData[rowIndexInPaginatedData]);
    if (originalIndex !== -1) {
      setEditingRow({ index: originalIndex, data: paginatedData[rowIndexInPaginatedData] });
    }
  };

  const handleSaveEdit = (updatedRow: Record<string, string>) => {
    if (editingRow !== null) {
      onRowUpdate(editingRow.index, updatedRow);
      // Data state will be updated via prop change from parent, no direct setData here
    }
    setEditingRow(null);
  };

  const handleDelete = (rowIndexInPaginatedData: number) => {
    const originalIndex = data.indexOf(paginatedData[rowIndexInPaginatedData]);
    if (originalIndex !== -1) {
     setRowToDelete(originalIndex);
    }
  };

  const confirmDelete = () => {
    if (rowToDelete !== null) {
      onRowDelete(rowToDelete);
      // Data state will be updated via prop change from parent
      if (currentPage > 1 && paginatedData.length === 1 && data.length -1 < (currentPage -1) * ROWS_PER_PAGE +1) {
        setCurrentPage(currentPage - 1);
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

  return (
    <div className="mt-8 bg-card p-4 md:p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search table..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="max-w-sm bg-background border-input focus:ring-primary"
        />
        {headers.length > 0 && (
           <div className="text-sm text-muted-foreground text-right">
            <span>Columns: {headers.length}</span>
            <span className="mx-2">|</span>
            <span>Rows: {sortedData.length} / {initialData.length}</span>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {headers.map((header) => (
                <TableHead 
                  key={header} 
                  onClick={() => requestSort(header)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap"
                  aria-sort={sortConfig?.key === header ? sortConfig.direction : "none"}
                >
                  <div className="flex items-center">
                    {header}
                    {getSortIcon(header)}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
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
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="h-24 text-center text-muted-foreground">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="text-primary border-primary/50 hover:bg-primary/10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="text-primary border-primary/50 hover:bg-primary/10"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

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
