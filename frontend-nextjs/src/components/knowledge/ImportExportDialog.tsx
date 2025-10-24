'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileJson, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImportExportDialogProps {
  onExport?: (format: 'json' | 'csv') => void;
  onImport?: (file: File, format: 'json' | 'csv') => void;
  totalItems?: number;
}

export function ImportExportDialog({
  onExport,
  onImport,
  totalItems = 0,
}: ImportExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle'
  );
  const [importMessage, setImportMessage] = useState('');

  const handleExport = (format: 'json' | 'csv') => {
    onExport?.(format);
    setIsOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, format: 'json' | 'csv') => {
    const file = e.target.files?.[0];
    if (file) {
      setImportStatus('loading');
      setImportMessage('Processing file...');

      // Simulate import
      setTimeout(() => {
        setImportStatus('success');
        setImportMessage(`Successfully imported ${file.name}`);
        onImport?.(file, format);

        setTimeout(() => {
          setIsOpen(false);
          setImportStatus('idle');
          setImportMessage('');
        }, 2000);
      }, 1500);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Import / Export
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import / Export Knowledge</DialogTitle>
          <DialogDescription>
            Backup your knowledge base or import from external sources
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Alert>
              <FileJson className="h-4 w-4" />
              <AlertDescription>
                You have <strong>{totalItems}</strong> knowledge items to export
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Export Format</h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleExport('json')}
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <p className="text-sm font-medium">JSON Format</p>
                      <p className="text-xs text-gray-600">
                        Complete backup with all metadata
                      </p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleExport('csv')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <p className="text-sm font-medium">CSV Format</p>
                      <p className="text-xs text-gray-600">
                        Spreadsheet-compatible format
                      </p>
                    </div>
                  </Button>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-900">
                  Exported files can be imported later or shared with team members
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            {importStatus === 'success' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs text-green-900">
                  {importMessage}
                </AlertDescription>
              </Alert>
            )}

            {importStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">{importMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-2">Select File Format</h4>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <FileJson className="h-4 w-4 mr-2 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">JSON File</p>
                      <p className="text-xs text-gray-600">
                        .json files from previous exports
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => handleFileSelect(e, 'json')}
                      className="hidden"
                      disabled={importStatus === 'loading'}
                    />
                  </label>

                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <FileText className="h-4 w-4 mr-2 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">CSV File</p>
                      <p className="text-xs text-gray-600">
                        .csv files from spreadsheets
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileSelect(e, 'csv')}
                      className="hidden"
                      disabled={importStatus === 'loading'}
                    />
                  </label>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-900">
                  Duplicate knowledge items will be skipped during import
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

