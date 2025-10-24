'use client'

import { useState } from 'react'
import { Monitor, Tablet, Smartphone, Eye, EyeOff } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface PreviewPanelProps {
  content: string
  title: string
  keywords: string[]
  format: 'markdown' | 'html'
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'

const DEVICE_WIDTHS: Record<DeviceType, string> = {
  desktop: 'w-full',
  tablet: 'max-w-2xl',
  mobile: 'max-w-sm',
}

export default function PreviewPanel({
  content,
  title,
  keywords,
  format,
}: PreviewPanelProps) {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [showPreview, setShowPreview] = useState(true)

  // Generate SEO preview
  const seoTitle = title || 'Untitled'
  const seoDescription = content.substring(0, 155) || 'No description available'
  const seoUrl = `example.com/${title.toLowerCase().replace(/\s+/g, '-')}`

  // Generate social media preview
  const socialTitle = title || 'Check this out'
  const socialDescription = content.substring(0, 100) || 'Interesting content'

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            {showPreview ? (
              <>
                <Eye className="h-4 w-4" />
                Hide Preview
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Show Preview
              </>
            )}
          </button>
        </div>

        {/* Device Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
          <button
            onClick={() => setDevice('desktop')}
            className={`p-2 rounded transition-colors ${
              device === 'desktop'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Desktop"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice('tablet')}
            className={`p-2 rounded transition-colors ${
              device === 'tablet'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Tablet"
          >
            <Tablet className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDevice('mobile')}
            className={`p-2 rounded transition-colors ${
              device === 'mobile'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="Mobile"
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="space-y-4">
          {/* Content Preview */}
          <div className="border border-gray-200 rounded-lg bg-gray-50 p-6 overflow-auto max-h-96">
            <div className={`mx-auto bg-white rounded-lg shadow-sm p-6 ${DEVICE_WIDTHS[device]}`}>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              <div className="prose prose-sm max-w-none prose-img:rounded-lg prose-img:shadow-md">
                {format === 'markdown' ? (
                  <ReactMarkdown
                    components={{
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="rounded-lg shadow-md my-4 w-full h-auto"
                          alt={props.alt || 'Content image'}
                        />
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: content }} />
                )}
              </div>
            </div>
          </div>

          {/* SEO Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-white">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">SEO Preview</h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-blue-600 hover:underline cursor-pointer">{seoUrl}</p>
              </div>
              <div>
                <p className="text-gray-900 font-medium">{seoTitle}</p>
              </div>
              <div>
                <p className="text-gray-600">{seoDescription}...</p>
              </div>
            </div>
          </div>

          {/* Social Media Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Twitter Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Twitter Preview</h4>
              <div className="border border-gray-300 rounded overflow-hidden bg-white shadow-sm">
                <img
                  src="/images/demo/social-preview.jpg"
                  alt="Twitter preview"
                  className="w-full h-32 object-cover bg-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="p-3">
                  <p className="text-sm text-gray-900 font-medium mb-1">{socialTitle}</p>
                  <p className="text-xs text-gray-600 mb-2">{socialDescription}...</p>
                  <p className="text-xs text-blue-500">{seoUrl}</p>
                </div>
              </div>
            </div>

            {/* LinkedIn Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">LinkedIn Preview</h4>
              <div className="border border-gray-300 rounded overflow-hidden bg-white shadow-sm">
                <div className="flex gap-3 p-3">
                  <img
                    src="/images/demo/linkedin-preview.jpg"
                    alt="LinkedIn preview"
                    className="w-24 h-24 object-cover rounded bg-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium mb-1">{socialTitle}</p>
                    <p className="text-xs text-gray-600 mb-2">{socialDescription}...</p>
                    <p className="text-xs text-blue-500">{seoUrl}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

