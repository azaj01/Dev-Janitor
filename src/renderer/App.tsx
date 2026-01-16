/**
 * Dev Janitor - App Component
 * 
 * Root component for the Dev Janitor application.
 * Uses AppLayout to provide the main UI structure.
 * Wrapped with ErrorBoundary for global error handling.
 * 
 * Validates: Requirements 5.1, 5.6, 8.1, 8.2, 8.5
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

import { useEffect } from 'react'
import { ConfigProvider } from 'antd'
import { AppLayout, ErrorBoundary } from './components'
import './i18n'

function App() {
  // Load saved AI config on startup and send to main process
  useEffect(() => {
    const loadAIConfig = async () => {
      const savedConfig = localStorage.getItem('aiConfig')
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          await window.electronAPI.ai.updateConfig(config)
          console.log('AI config loaded from localStorage')
        } catch (error) {
          console.error('Failed to load AI config:', error)
        }
      }
    }
    loadAIConfig()
  }, [])

  return (
    <ErrorBoundary>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
          },
        }}
      >
        <AppLayout />
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
