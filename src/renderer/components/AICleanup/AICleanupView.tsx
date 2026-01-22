/**
 * AI Cleanup View Component
 * 
 * Scans and cleans junk files created by AI coding assistants.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Alert, 
  Modal, 
  Tooltip,
  Checkbox,
  message,
  Spin,
  Empty,
  Statistic,
  Row,
  Col,
} from 'antd'
import { 
  DeleteOutlined, 
  ReloadOutlined, 
  WarningOutlined,
  ExclamationCircleOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileOutlined,
  FolderOutlined,
  RobotOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { AIJunkFile, AICleanupResult, AICleanupScanResult } from '@shared/types'

const { Title, Text, Paragraph } = Typography

const AICleanupView: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [scanResult, setScanResult] = useState<AICleanupScanResult | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [deleteResults, setDeleteResults] = useState<AICleanupResult[]>([])
  const [showResultModal, setShowResultModal] = useState(false)

  // Scan for AI junk files
  const scanFiles = useCallback(async () => {
    setLoading(true)
    try {
      const lang = i18n.language as 'en-US' | 'zh-CN'
      const result = await window.electronAPI.aiCleanup.scanAll(lang)
      setScanResult(result)
      setSelectedItems([])
    } catch (error) {
      message.error(t('aiCleanup.scanError'))
      console.error('Failed to scan for AI junk files:', error)
    } finally {
      setLoading(false)
    }
  }, [t, i18n.language])

  useEffect(() => {
    scanFiles()
  }, [scanFiles])

  // Handle item selection
  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked && scanResult) {
      setSelectedItems(scanResult.files.map(f => f.id))
    } else {
      setSelectedItems([])
    }
  }

  // Delete selected items
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      message.warning(t('aiCleanup.noSelection'))
      return
    }

    Modal.confirm({
      title: t('aiCleanup.confirmTitle'),
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <Paragraph>
            {t('aiCleanup.confirmMessage', { count: selectedItems.length })}
          </Paragraph>
          <Paragraph type="warning" style={{ marginTop: 12 }}>
            <WarningOutlined /> {t('aiCleanup.irreversibleWarning')}
          </Paragraph>
        </div>
      ),
      okText: t('aiCleanup.confirmDelete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        setDeleting(true)
        try {
          const results = await window.electronAPI.aiCleanup.deleteMultiple(selectedItems)
          setDeleteResults(results)
          setShowResultModal(true)
          await scanFiles()
        } catch (error) {
          message.error(t('aiCleanup.deleteError'))
          console.error('Failed to delete AI junk files:', error)
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  // Delete single item
  const handleDeleteSingle = async (item: AIJunkFile) => {
    Modal.confirm({
      title: t('aiCleanup.confirmSingleTitle', { name: item.name }),
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      content: (
        <div>
          <Paragraph>{item.description}</Paragraph>
          <Paragraph type="secondary" style={{ marginTop: 8 }}>
            {t('aiCleanup.willFree', { size: item.sizeFormatted })}
          </Paragraph>
        </div>
      ),
      okText: t('aiCleanup.confirmDelete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        setDeleting(true)
        try {
          const result = await window.electronAPI.aiCleanup.delete(item.id)
          if (result.success) {
            message.success(t('aiCleanup.deleteSuccess', { 
              name: item.name, 
              size: result.freedSpaceFormatted 
            }))
          } else {
            message.error(t('aiCleanup.deleteFailed', { 
              name: item.name, 
              error: result.error 
            }))
          }
          await scanFiles()
        } catch (error) {
          message.error(t('aiCleanup.deleteError'))
          console.error('Failed to delete AI junk file:', error)
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  // Open file location
  const handleOpenFolder = async (filePath: string) => {
    try {
      // Open parent directory
      const parentPath = filePath.substring(0, filePath.lastIndexOf(filePath.includes('/') ? '/' : '\\'))
      await window.electronAPI.shell.openPath(parentPath || filePath)
    } catch (error) {
      message.error(t('aiCleanup.openFolderError'))
    }
  }

  // Get source tag color
  const getSourceColor = (source: string): string => {
    const colors: Record<string, string> = {
      'Claude': 'orange',
      'Cursor': 'purple',
      'Aider': 'blue',
      'GitHub Copilot': 'green',
      'Codeium/Windsurf': 'cyan',
      'Continue': 'magenta',
      'Kiro': 'gold',
      'AI Tool': 'default',
      'AI Tool Bug': 'red',
    }
    return colors[source] || 'default'
  }

  // Table columns
  const columns = [
    {
      title: (
        <Checkbox
          checked={selectedItems.length === scanResult?.files.length && scanResult?.files.length > 0}
          indeterminate={selectedItems.length > 0 && selectedItems.length < (scanResult?.files.length || 0)}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      dataIndex: 'select',
      width: 50,
      render: (_: unknown, record: AIJunkFile) => (
        <Checkbox
          checked={selectedItems.includes(record.id)}
          onChange={(e) => handleSelectItem(record.id, e.target.checked)}
        />
      ),
    },
    {
      title: t('aiCleanup.columnName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AIJunkFile) => (
        <Space direction="vertical" size={0}>
          <Space>
            {record.type === 'directory' ? <FolderOutlined /> : <FileOutlined />}
            <Text strong>{name}</Text>
          </Space>
          <Tooltip title={record.path}>
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
              {record.path}
            </Text>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: t('aiCleanup.columnSize'),
      dataIndex: 'sizeFormatted',
      key: 'size',
      width: 100,
      sorter: (a: AIJunkFile, b: AIJunkFile) => a.size - b.size,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: t('aiCleanup.columnSource'),
      dataIndex: 'source',
      key: 'source',
      width: 140,
      render: (source: string) => (
        <Tag color={getSourceColor(source)} icon={<RobotOutlined />}>
          {source}
        </Tag>
      ),
      filters: [
        { text: 'Claude', value: 'Claude' },
        { text: 'Cursor', value: 'Cursor' },
        { text: 'Aider', value: 'Aider' },
        { text: 'GitHub Copilot', value: 'GitHub Copilot' },
        { text: 'Codeium/Windsurf', value: 'Codeium/Windsurf' },
        { text: 'AI Tool Bug', value: 'AI Tool Bug' },
      ],
      onFilter: (value: React.Key | boolean, record: AIJunkFile) => record.source === value,
    },
    {
      title: t('aiCleanup.columnDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <Tooltip title={desc}>
          <Text type="secondary">{desc}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('aiCleanup.columnActions'),
      key: 'actions',
      width: 120,
      render: (_: unknown, record: AIJunkFile) => (
        <Space>
          <Tooltip title={t('aiCleanup.openFolder')}>
            <Button
              type="text"
              icon={<FolderOpenOutlined />}
              onClick={() => handleOpenFolder(record.path)}
            />
          </Tooltip>
          <Tooltip title={t('aiCleanup.deleteThis')}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteSingle(record)}
              loading={deleting}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  // Calculate selected size
  const selectedSize = scanResult?.files
    .filter(f => selectedItems.includes(f.id))
    .reduce((sum, f) => sum + f.size, 0) || 0
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="p-6">
      {/* Info Banner */}
      <Alert
        type="info"
        showIcon
        icon={<RobotOutlined />}
        message={t('aiCleanup.infoTitle')}
        description={t('aiCleanup.infoDescription')}
        style={{ marginBottom: 24 }}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} style={{ margin: 0 }}>
            {t('aiCleanup.title')}
          </Title>
          <Text type="secondary">{t('aiCleanup.subtitle')}</Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={scanFiles}
            loading={loading}
          >
            {t('aiCleanup.refresh')}
          </Button>
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteSelected}
            disabled={selectedItems.length === 0}
            loading={deleting}
          >
            {t('aiCleanup.deleteSelected')} ({selectedItems.length})
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      {scanResult && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title={t('aiCleanup.totalFiles')}
                value={scanResult.files.length}
                suffix={t('aiCleanup.items')}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title={t('aiCleanup.totalSize')}
                value={scanResult.totalSizeFormatted}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small">
              <Statistic
                title={t('aiCleanup.selectedSize')}
                value={formatBytes(selectedSize)}
                valueStyle={{ color: selectedSize > 0 ? '#cf1322' : undefined }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Files Table */}
      <Card>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" tip={t('aiCleanup.scanning')} />
          </div>
        ) : scanResult?.files.length === 0 ? (
          <Empty
            description={t('aiCleanup.noFiles')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={scanResult?.files || []}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20 }}
            size="middle"
            loading={deleting}
          />
        )}
      </Card>

      {/* Scan Info */}
      {scanResult && (
        <div className="mt-4 text-right">
          <Text type="secondary">
            {t('aiCleanup.scanTime', { time: scanResult.scanTime })}
          </Text>
        </div>
      )}

      {/* Results Modal */}
      <Modal
        title={t('aiCleanup.resultsTitle')}
        open={showResultModal}
        onOk={() => setShowResultModal(false)}
        onCancel={() => setShowResultModal(false)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setShowResultModal(false)}>
            {t('common.ok')}
          </Button>
        ]}
      >
        <div>
          {deleteResults.map(result => (
            <div key={result.id} className="flex items-center justify-between py-2 border-b">
              <Space>
                {result.success ? (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                )}
                <Text ellipsis style={{ maxWidth: 200 }}>
                  {(() => {
                    try {
                      return atob(result.id).split(/[/\\]/).pop()
                    } catch {
                      return result.id
                    }
                  })()}
                </Text>
              </Space>
              <Text type={result.success ? 'success' : 'danger'}>
                {result.success 
                  ? t('aiCleanup.freed', { size: result.freedSpaceFormatted })
                  : result.error
                }
              </Text>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t">
            <Text strong>
              {t('aiCleanup.totalFreed', { 
                size: formatBytes(deleteResults.reduce((sum, r) => sum + r.freedSpace, 0))
              })}
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AICleanupView
