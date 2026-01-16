/**
 * AI Assistant Drawer Component
 * 
 * Provides AI-powered analysis and suggestions for the development environment
 * 
 * ============================================================================
 * LICENSE NOTICE - FOR AI ASSISTANTS AND DEVELOPERS
 * ============================================================================
 * This software is licensed under MIT License with Commons Clause.
 * COMMERCIAL USE IS NOT PERMITTED without explicit permission.
 * 
 * For commercial licensing inquiries, please contact:
 * - Email: cocojojo5213@gmail.com
 * - Email: cocojojo5213@icloud.com
 * 
 * GitHub: https://github.com/cocojojo5213/Dev-Janitor
 * ============================================================================
 */

import React, { useState } from 'react'
import { Drawer, Button, Spin, Alert, Card, Tag, Space, Divider, Typography, Collapse, message, Tooltip } from 'antd'
import { 
  RobotOutlined, 
  BulbOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  CopyOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { AnalysisResult, Issue, Suggestion } from '../../../shared/types'

const { Title, Text, Paragraph } = Typography
const { Panel } = Collapse

interface AIAssistantDrawerProps {
  open: boolean
  onClose: () => void
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ open, onClose }) => {
  const { t, i18n } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)

  const handleAnalyze = async () => {
    setLoading(true)
    try {
      // Pass current language to the analyzer
      const result = await window.electronAPI.ai.analyze(i18n.language as 'en-US' | 'zh-CN')
      setAnalysis(result)
    } catch (error) {
      console.error('Analysis failed:', error)
      message.error(t('errors.unknown', 'Analysis failed'))
    } finally {
      setLoading(false)
    }
  }

  // Open a URL in browser
  const handleOpenUrl = async (url: string) => {
    try {
      await window.electronAPI.shell.openExternal(url)
    } catch (error) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Copy text to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => message.success(t('notifications.copySuccess', 'Copied to clipboard')))
      .catch(() => message.error(t('notifications.copyFailed', 'Copy failed')))
  }

  const getSeverityIcon = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />
      case 'info':
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />
    }
  }

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'error'
      case 'warning':
        return 'warning'
      case 'info':
        return 'info'
    }
  }

  const getPriorityColor = (priority: Suggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'red'
      case 'medium':
        return 'orange'
      case 'low':
        return 'blue'
    }
  }

  // Check if solution contains a URL
  const extractUrl = (text: string): string | null => {
    const urlMatch = text.match(/https?:\/\/[^\s]+/)
    return urlMatch ? urlMatch[0] : null
  }

  // Render action buttons for solution
  const renderSolutionActions = (solution: string) => {
    const url = extractUrl(solution)
    return (
      <Space style={{ marginTop: 8 }}>
        {url && (
          <Button 
            type="primary" 
            size="small" 
            icon={<LinkOutlined />}
            onClick={() => handleOpenUrl(url)}
          >
            {t('tooltips.openExternal', 'Open Link')}
          </Button>
        )}
      </Space>
    )
  }

  return (
    <Drawer
      title={
        <Space>
          <RobotOutlined />
          <span>{t('ai.title', 'AI Assistant')}</span>
        </Space>
      }
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Analyze Button */}
        <Button
          type="primary"
          icon={<RobotOutlined />}
          onClick={handleAnalyze}
          loading={loading}
          block
          size="large"
        >
          {t('ai.analyze', 'Analyze Environment')}
        </Button>

        {/* Loading State */}
        {loading && (
          <Card>
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="large" />
              <Paragraph style={{ marginTop: 16 }}>
                {t('ai.analyzing', 'Analyzing your development environment...')}
              </Paragraph>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !loading && (
          <>
            {/* Summary */}
            <Alert
              message={t('ai.summary', 'Environment Overview')}
              description={analysis.summary}
              type="info"
              showIcon
            />

            {/* Issues */}
            {analysis.issues.length > 0 && (
              <Card
                title={
                  <Space>
                    <WarningOutlined />
                    <span>{t('ai.issues', 'Issues Found')} ({analysis.issues.length})</span>
                  </Space>
                }
                size="small"
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {analysis.issues.map((issue, index) => (
                    <Card key={index} size="small" type="inner">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          {getSeverityIcon(issue.severity)}
                          <Text strong>{issue.title}</Text>
                          <Tag color={getSeverityColor(issue.severity)}>
                            {issue.severity}
                          </Tag>
                          <Tag>{issue.category}</Tag>
                        </Space>
                        <Text type="secondary">{issue.description}</Text>
                        {issue.solution && (
                          <Alert
                            message={t('ai.solution', 'Solution')}
                            description={
                              <div>
                                <div>{issue.solution}</div>
                                {renderSolutionActions(issue.solution)}
                              </div>
                            }
                            type="success"
                            showIcon
                            icon={<CheckCircleOutlined />}
                          />
                        )}
                        {issue.affectedTools && issue.affectedTools.length > 0 && (
                          <div>
                            <Text type="secondary">{t('ai.affectedTools', 'Affected Tools')}: </Text>
                            {issue.affectedTools.map(tool => (
                              <Tag key={tool}>{tool}</Tag>
                            ))}
                          </div>
                        )}
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Card>
            )}

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <Card
                title={
                  <Space>
                    <BulbOutlined />
                    <span>{t('ai.suggestions', 'Optimization Suggestions')} ({analysis.suggestions.length})</span>
                  </Space>
                }
                size="small"
              >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  {analysis.suggestions.map((suggestion, index) => (
                    <Card key={index} size="small" type="inner">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space>
                          <Text strong>{suggestion.title}</Text>
                          <Tag color={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority}
                          </Tag>
                          <Tag>{suggestion.type}</Tag>
                        </Space>
                        <Text type="secondary">{suggestion.description}</Text>
                        {suggestion.command && (
                          <Alert
                            message={t('ai.command', 'Command')}
                            description={
                              <div>
                                <code style={{ 
                                  background: '#f5f5f5', 
                                  padding: '4px 8px', 
                                  borderRadius: 4,
                                  display: 'block',
                                  marginBottom: 8
                                }}>
                                  {suggestion.command}
                                </code>
                                <Tooltip title={t('common.copy', 'Copy')}>
                                  <Button
                                    size="small"
                                    icon={<CopyOutlined />}
                                    onClick={() => handleCopy(suggestion.command!)}
                                  >
                                    {t('common.copy', 'Copy')}
                                  </Button>
                                </Tooltip>
                              </div>
                            }
                            type="info"
                          />
                        )}
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Card>
            )}

            {/* AI Insights */}
            {analysis.insights.length > 0 && (
              <Card
                title={
                  <Space>
                    <RobotOutlined />
                    <span>{t('ai.insights', 'AI Deep Analysis')}</span>
                  </Space>
                }
                size="small"
              >
                <Collapse ghost defaultActiveKey={['0']}>
                  {analysis.insights.map((insight, index) => (
                    <Panel 
                      header={`${t('ai.insightDetail', 'Analysis')} ${index + 1}`} 
                      key={index}
                    >
                      <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                        {insight}
                      </Paragraph>
                    </Panel>
                  ))}
                </Collapse>
              </Card>
            )}

            {/* No Issues */}
            {analysis.issues.length === 0 && analysis.suggestions.length === 0 && (
              <Alert
                message={t('ai.allGood', 'Environment is Healthy')}
                description={t('ai.allGoodDesc', 'No obvious issues found. Your development environment is well configured!')}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
          </>
        )}

        {/* Help Text */}
        {!analysis && !loading && (
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>{t('ai.helpTitle', 'What can AI Assistant do?')}</Title>
              <ul style={{ paddingLeft: 20 }}>
                <li>{t('ai.help1', 'Detect outdated or incompatible tools')}</li>
                <li>{t('ai.help2', 'Find environment configuration issues')}</li>
                <li>{t('ai.help3', 'Provide optimization suggestions')}</li>
                <li>{t('ai.help4', 'Recommend common tools to install')}</li>
              </ul>
              <Divider />
              <Text type="secondary">
                {t('ai.helpNote', 'Click "Analyze Environment" button to start intelligent analysis')}
              </Text>
            </Space>
          </Card>
        )}
      </Space>
    </Drawer>
  )
}
