'use client'

import { useState } from 'react'
import { Copy, Eye } from 'lucide-react'
import TemplatePreview from './TemplatePreview'

interface Template {
  id: number
  name: string
  category: string
  description: string
  content: string
  variables: Array<{
    name: string
    type: string
    required: boolean
  }>
  usageCount: number
  createdAt: string
}

interface TemplateGridProps {
  templates: Template[]
}

export default function TemplateGrid({ templates }: TemplateGridProps) {
  const [previewId, setPreviewId] = useState<number | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <h3 className="font-semibold text-lg">{template.name}</h3>
              <p className="text-sm text-blue-100">{template.category}</p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-600">{template.description}</p>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{template.variables.length} variables</span>
                <span>{template.usageCount} uses</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => setPreviewId(template.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Copy className="h-4 w-4" />
                  Use
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewId !== null && (
        <TemplatePreview
          template={templates.find((t) => t.id === previewId)!}
          onClose={() => setPreviewId(null)}
        />
      )}
    </>
  )
}

