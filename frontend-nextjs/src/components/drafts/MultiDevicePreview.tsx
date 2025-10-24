'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Tablet, Monitor, Copy, Check } from 'lucide-react';

interface MultiDevicePreviewProps {
  content: string;
  title: string;
  metadata?: {
    word_count?: number;
    reading_time?: number;
    seo_score?: number;
  };
}

export function MultiDevicePreview({
  content,
  title,
  metadata,
}: MultiDevicePreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [copied, setCopied] = useState(false);

  const devices = {
    mobile: { width: 375, label: 'Mobile', icon: Smartphone },
    tablet: { width: 768, label: 'Tablet', icon: Tablet },
    desktop: { width: 1024, label: 'Desktop', icon: Monitor },
  };

  const currentDevice = devices[device];
  const DeviceIcon = currentDevice.icon;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Multi-Device Preview</CardTitle>
            <CardDescription>See how your content looks on different devices</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Device Selector */}
        <div className="flex gap-2 border-b pb-4">
          {Object.entries(devices).map(([key, { label, icon: Icon }]) => (
            <Button
              key={key}
              size="sm"
              variant={device === key ? 'default' : 'outline'}
              onClick={() => setDevice(key as 'mobile' | 'tablet' | 'desktop')}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>

        {/* Preview Container */}
        <div className="flex justify-center bg-gray-100 rounded-lg p-4 min-h-[600px]">
          <div
            className="bg-white shadow-lg rounded-lg overflow-hidden transition-all"
            style={{ width: `${currentDevice.width}px` }}
          >
            {/* Device Frame */}
            <div className="bg-gray-900 px-2 py-3 text-center text-xs text-white">
              {currentDevice.label}
            </div>

            {/* Content Preview */}
            <div className="p-4 overflow-y-auto max-h-[500px]">
              {/* Title */}
              <h1 className="text-2xl font-bold mb-4 text-gray-900">{title}</h1>

              {/* Metadata */}
              {metadata && (
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                  {metadata.word_count && (
                    <Badge variant="secondary" className="text-xs">
                      {metadata.word_count} words
                    </Badge>
                  )}
                  {metadata.reading_time && (
                    <Badge variant="secondary" className="text-xs">
                      {metadata.reading_time} min read
                    </Badge>
                  )}
                  {metadata.seo_score && (
                    <Badge
                      variant={metadata.seo_score >= 80 ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      SEO: {metadata.seo_score}
                    </Badge>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                {content.split('\n\n').map((paragraph, index) => {
                  // Handle markdown-like formatting
                  if (paragraph.startsWith('# ')) {
                    return (
                      <h2 key={index} className="text-xl font-bold mt-4 mb-2">
                        {paragraph.replace('# ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h3 key={index} className="text-lg font-bold mt-3 mb-2">
                        {paragraph.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={index} className="list-disc list-inside mb-2">
                        {paragraph.split('\n').map((item, i) => (
                          <li key={i} className="text-sm">
                            {item.replace('- ', '')}
                          </li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={index} className="mb-3 text-sm">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Device Info */}
        <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
          <p className="font-medium mb-1">Preview Information</p>
          <p>
            This preview shows how your content will appear on {currentDevice.label.toLowerCase()}{' '}
            devices ({currentDevice.width}px width). Actual rendering may vary based on browser and
            device settings.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

