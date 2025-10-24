'use client'

import { Copy, Eye } from 'lucide-react'
import { useState } from 'react'
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

interface TemplateListProps {
  templates: Template[]
}

export default function TemplateList({ templates }: TemplateListProps) {
  const [previewId, setPreviewId] = useState<number | null>(null)

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Category
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Variables
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Usage
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {template.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">
                    {template.variables.length}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-medium text-gray-900">
                    {template.usageCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setPreviewId(template.id)}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors">
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

