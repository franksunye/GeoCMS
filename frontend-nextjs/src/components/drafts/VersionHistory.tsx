'use client'

import { useState } from 'react'
import { Clock, RotateCcw, Eye, Check } from 'lucide-react'

interface Version {
  id: number
  version: string
  content: string
  created_at: string
  created_by: string
  changes_summary: string
}

interface VersionHistoryProps {
  draftId: number
  currentVersion: string
  onRestore: (versionId: number) => void
}

// Mock data - 实际应该从API获取
const mockVersions: Version[] = [
  {
    id: 1,
    version: 'v1.3',
    content: '最新版本内容...',
    created_at: '2025-01-23T10:30:00',
    created_by: '张三',
    changes_summary: '修改了标题和第一段内容'
  },
  {
    id: 2,
    version: 'v1.2',
    content: '上一版本内容...',
    created_at: '2025-01-22T15:20:00',
    created_by: '李四',
    changes_summary: '添加了新的章节'
  },
  {
    id: 3,
    version: 'v1.1',
    content: '更早版本内容...',
    created_at: '2025-01-21T09:15:00',
    created_by: '张三',
    changes_summary: '初始版本创建'
  },
]

export function VersionHistory({ draftId, currentVersion, onRestore }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleRestore = (version: Version) => {
    if (confirm(`确定要恢复到版本 ${version.version} 吗？当前内容将被保存为新版本。`)) {
      onRestore(version.id)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-primary" />
          版本历史
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          当前版本: <span className="font-medium">{currentVersion}</span>
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {mockVersions.map((version, index) => {
          const isCurrentVersion = version.version === currentVersion
          const isMostRecent = index === 0

          return (
            <div
              key={version.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                selectedVersion?.id === version.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{version.version}</span>
                    {isCurrentVersion && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        当前版本
                      </span>
                    )}
                    {isMostRecent && !isCurrentVersion && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        最新
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">{version.changes_summary}</p>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {new Date(version.created_at).toLocaleString('zh-CN')}
                    </span>
                    <span>作者: {version.created_by}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedVersion(version)
                      setShowPreview(true)
                    }}
                    className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                    title="预览"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {!isCurrentVersion && (
                    <button
                      onClick={() => handleRestore(version)}
                      className="p-2 text-gray-600 hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
                      title="恢复到此版本"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Version Preview Modal */}
      {showPreview && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  版本预览: {selectedVersion.version}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(selectedVersion.created_at).toLocaleString('zh-CN')} · {selectedVersion.created_by}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPreview(false)
                  setSelectedVersion(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedVersion.content}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                变更说明: {selectedVersion.changes_summary}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPreview(false)
                    setSelectedVersion(null)
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  关闭
                </button>
                {selectedVersion.version !== currentVersion && (
                  <button
                    onClick={() => {
                      handleRestore(selectedVersion)
                      setShowPreview(false)
                      setSelectedVersion(null)
                    }}
                    className="px-4 py-2 text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    恢复此版本
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {mockVersions.length === 0 && (
        <div className="p-12 text-center">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无版本历史
          </h3>
          <p className="text-gray-500">
            保存草稿后将自动创建版本记录
          </p>
        </div>
      )}
    </div>
  )
}

