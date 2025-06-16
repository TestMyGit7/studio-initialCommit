
"use client";

import type { ChangeEvent } from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EditRowDialogProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: Record<string, string> | null;
  headers: string[];
  onSave: (updatedRow: Record<string, string>) => void;
  rowIndex: number | null;
}

export function EditRowDialog({ isOpen, onClose, rowData, headers, onSave, rowIndex }: EditRowDialogProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rowData) {
      setFormData({ ...rowData });
    }
  }, [rowData]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  if (!rowData || rowIndex === null) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg bg-background shadow-xl rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground font-headline">Edit Row {rowIndex + 1}</DialogTitle>
          <DialogDescription>
            Modify the values for this row. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="grid gap-4 py-4">
            {headers.map(header => (
              <div key={header} className="grid grid-cols-1 md:grid-cols-3 items-center gap-2 md:gap-4">
                <Label htmlFor={header} className="md:text-right text-foreground text-sm break-all">
                  {header}
                </Label>
                <Input
                  id={header}
                  name={header}
                  value={formData[header] || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(header, e.target.value)}
                  className="col-span-1 md:col-span-2 bg-card border-input text-foreground focus:ring-primary"
                  aria-label={`Value for ${header}`}
                />
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
