'use client'

import { X, Copy } from 'lucide-react'

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

interface TemplatePreviewProps {
  template: Template
  onClose: () => void
}

export default function TemplatePreview({
  template,
  onClose,
}: TemplatePreviewProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{template.name}</h2>
            <p className="text-sm text-blue-100">{template.category}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600">{template.description}</p>
          </div>

          {/* Variables */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Variables</h3>
            <div className="space-y-2">
              {template.variables.map((variable) => (
                <div
                  key={variable.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{variable.name}</p>
                    <p className="text-xs text-gray-600 capitalize">
                      {variable.type}
                      {variable.required && ' (required)'}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded ${
                      variable.required
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {variable.required ? 'Required' : 'Optional'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Template Content */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Template</h3>
            <pre className="bg-gray-50 p-4 rounded-lg text-xs text-gray-700 overflow-x-auto">
              {template.content}
            </pre>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600">Usage Count</p>
              <p className="text-2xl font-bold text-gray-900">
                {template.usageCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-lg font-medium text-gray-900">
                {new Date(template.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Copy className="h-4 w-4" />
              Use Template
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

