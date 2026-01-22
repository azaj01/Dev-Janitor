/**
 * AI Cleanup Scanner Module
 * 
 * Scans and cleans up junk files created by AI coding assistants.
 * Supports: Claude, Cursor, Aider, Copilot, Windsurf, and other AI tools.
 * 
 * Common junk files include:
 * - nul/NUL files (Windows device name accidentally created)
 * - .aider* temporary files
 * - .claude_* cache files
 * - AI tool backup and temp files
 */

import { promises as fs } from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface AIJunkFile {
  id: string                    // Unique identifier
  name: string                  // File/folder name
  path: string                  // Full path
  size: number                  // Size in bytes
  sizeFormatted: string         // Human-readable size
  type: 'file' | 'directory'    // Type
  source: string                // Which AI tool likely created it
  description: string           // Description
  riskLevel: 'low' | 'medium'   // Risk level for deletion
  lastModified?: Date           // Last modification time
}

export interface AICleanupResult {
  id: string
  success: boolean
  freedSpace: number
  freedSpaceFormatted: string
  error?: string
}

export interface AICleanupScanResult {
  files: AIJunkFile[]
  totalSize: number
  totalSizeFormatted: string
  scanTime: number
  scannedPaths: string[]
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Get file/directory size
 */
async function getSize(itemPath: string): Promise<number> {
  try {
    const stats = await fs.stat(itemPath)
    if (stats.isFile()) {
      return stats.size
    }
    if (stats.isDirectory()) {
      let size = 0
      const entries = await fs.readdir(itemPath, { withFileTypes: true })
      for (const entry of entries) {
        size += await getSize(path.join(itemPath, entry.name))
      }
      return size
    }
  } catch {
    return 0
  }
  return 0
}

/**
 * AI junk file patterns to scan for
 */
interface JunkPattern {
  pattern: RegExp | string
  source: string
  description: string
  descriptionZh: string
  riskLevel: 'low' | 'medium'
  isExactMatch?: boolean
}

const JUNK_PATTERNS: JunkPattern[] = [
  // Windows device name files (created by buggy AI tools)
  // These are definitely junk - Windows reserved names should never be files
  {
    pattern: /^(nul|NUL|con|CON|prn|PRN|aux|AUX|com[1-9]|COM[1-9]|lpt[1-9]|LPT[1-9])$/i,
    source: 'AI Tool Bug',
    description: 'Windows reserved device name accidentally created as file - safe to delete',
    descriptionZh: 'Windows 保留设备名被意外创建为文件 - 可安全删除',
    riskLevel: 'low',
    isExactMatch: true,
  },
  // Aider specific files (in project directories, not config)
  {
    pattern: /^\.aider\.(tags|chat|history|input).*$/,
    source: 'Aider',
    description: 'Aider session/history files - usually safe to delete after session ends',
    descriptionZh: 'Aider 会话/历史文件 - 会话结束后通常可安全删除',
    riskLevel: 'low',
  },
  // Claude Code specific backup files
  {
    pattern: /^\.claude\.json\.backup$/,
    source: 'Claude Code',
    description: 'Claude Code backup file - safe to delete if main config exists',
    descriptionZh: 'Claude Code 备份文件 - 如主配置存在则可安全删除',
    riskLevel: 'low',
  },
  // AI tool temp/draft files with specific naming patterns
  {
    pattern: /^(ai_temp_|_ai_draft_|\.ai_tmp_)/i,
    source: 'AI Tool',
    description: 'AI temporary working files - safe to delete',
    descriptionZh: 'AI 临时工作文件 - 可安全删除',
    riskLevel: 'low',
  },
]

/**
 * Common directories to scan
 */
function getScanDirectories(): string[] {
  const homeDir = os.homedir()
  const dirs: string[] = []
  
  // User home directory (shallow scan)
  dirs.push(homeDir)
  
  // Common project directories
  const projectDirs = [
    path.join(homeDir, 'Desktop'),
    path.join(homeDir, 'Documents'),
    path.join(homeDir, 'Projects'),
    path.join(homeDir, 'projects'),
    path.join(homeDir, 'dev'),
    path.join(homeDir, 'Development'),
    path.join(homeDir, 'workspace'),
    path.join(homeDir, 'code'),
    path.join(homeDir, 'Code'),
    path.join(homeDir, 'repos'),
    path.join(homeDir, 'git'),
  ]
  
  dirs.push(...projectDirs)
  
  return dirs
}

class AICleanupScanner {
  private language: 'en-US' | 'zh-CN' = 'en-US'

  setLanguage(lang: 'en-US' | 'zh-CN'): void {
    this.language = lang
  }

  /**
   * Check if a file/folder matches any junk pattern
   */
  private matchesPattern(name: string): JunkPattern | null {
    for (const pattern of JUNK_PATTERNS) {
      if (pattern.isExactMatch) {
        if (typeof pattern.pattern === 'string') {
          if (name === pattern.pattern) return pattern
        } else if (pattern.pattern.test(name)) {
          return pattern
        }
      } else {
        if (typeof pattern.pattern === 'string') {
          if (name.includes(pattern.pattern)) return pattern
        } else if (pattern.pattern.test(name)) {
          return pattern
        }
      }
    }
    return null
  }

  /**
   * Scan a directory for AI junk files (non-recursive for safety)
   */
  private async scanDirectory(dirPath: string, maxDepth: number = 2, currentDepth: number = 0): Promise<AIJunkFile[]> {
    const results: AIJunkFile[] = []
    
    if (currentDepth > maxDepth) return results
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)
        const pattern = this.matchesPattern(entry.name)
        
        if (pattern) {
          try {
            const stats = await fs.stat(fullPath)
            const size = entry.isDirectory() ? await getSize(fullPath) : stats.size
            
            results.push({
              id: Buffer.from(fullPath).toString('base64'),
              name: entry.name,
              path: fullPath,
              size,
              sizeFormatted: formatBytes(size),
              type: entry.isDirectory() ? 'directory' : 'file',
              source: pattern.source,
              description: this.language === 'zh-CN' ? pattern.descriptionZh : pattern.description,
              riskLevel: pattern.riskLevel,
              lastModified: stats.mtime,
            })
          } catch {
            // Skip inaccessible files
          }
        }
        
        // Recursively scan subdirectories (but skip node_modules, .git, etc.)
        if (entry.isDirectory() && currentDepth < maxDepth) {
          const skipDirs = ['node_modules', '.git', '.svn', '.hg', 'vendor', '__pycache__', 'venv', '.venv']
          if (!skipDirs.includes(entry.name)) {
            const subResults = await this.scanDirectory(fullPath, maxDepth, currentDepth + 1)
            results.push(...subResults)
          }
        }
      }
    } catch {
      // Directory not accessible, skip
    }
    
    return results
  }

  /**
   * Scan all common directories for AI junk files
   */
  async scanAll(): Promise<AICleanupScanResult> {
    const startTime = Date.now()
    const scanDirs = getScanDirectories()
    const allFiles: AIJunkFile[] = []
    const scannedPaths: string[] = []
    
    for (const dir of scanDirs) {
      try {
        await fs.access(dir)
        scannedPaths.push(dir)
        // Use depth 1 for home, depth 2 for project directories
        const depth = dir === os.homedir() ? 1 : 2
        const files = await this.scanDirectory(dir, depth)
        allFiles.push(...files)
      } catch {
        // Directory doesn't exist or not accessible
      }
    }
    
    // Remove duplicates by path
    const uniqueFiles = Array.from(
      new Map(allFiles.map(f => [f.path, f])).values()
    )
    
    // Sort by size descending
    uniqueFiles.sort((a, b) => b.size - a.size)
    
    const totalSize = uniqueFiles.reduce((sum, f) => sum + f.size, 0)
    
    return {
      files: uniqueFiles,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      scanTime: Date.now() - startTime,
      scannedPaths,
    }
  }

  /**
   * Scan a specific directory
   */
  async scanPath(targetPath: string): Promise<AICleanupScanResult> {
    const startTime = Date.now()
    
    try {
      await fs.access(targetPath)
      const files = await this.scanDirectory(targetPath, 3)
      
      // Sort by size descending
      files.sort((a, b) => b.size - a.size)
      
      const totalSize = files.reduce((sum, f) => sum + f.size, 0)
      
      return {
        files,
        totalSize,
        totalSizeFormatted: formatBytes(totalSize),
        scanTime: Date.now() - startTime,
        scannedPaths: [targetPath],
      }
    } catch {
      return {
        files: [],
        totalSize: 0,
        totalSizeFormatted: '0 B',
        scanTime: Date.now() - startTime,
        scannedPaths: [],
      }
    }
  }

  /**
   * Delete a single junk file/directory
   */
  async deleteItem(itemId: string): Promise<AICleanupResult> {
    try {
      const itemPath = Buffer.from(itemId, 'base64').toString('utf-8')
      
      // Get size before deletion
      const sizeBefore = await getSize(itemPath)
      
      // Delete the item
      const stats = await fs.stat(itemPath)
      if (stats.isDirectory()) {
        await fs.rm(itemPath, { recursive: true, force: true })
      } else {
        await fs.unlink(itemPath)
      }
      
      return {
        id: itemId,
        success: true,
        freedSpace: sizeBefore,
        freedSpaceFormatted: formatBytes(sizeBefore),
      }
    } catch (error) {
      return {
        id: itemId,
        success: false,
        freedSpace: 0,
        freedSpaceFormatted: '0 B',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Delete multiple junk files/directories
   */
  async deleteMultiple(itemIds: string[]): Promise<AICleanupResult[]> {
    const results: AICleanupResult[] = []
    
    for (const id of itemIds) {
      const result = await this.deleteItem(id)
      results.push(result)
    }
    
    return results
  }
}

export const aiCleanupScanner = new AICleanupScanner()
export default aiCleanupScanner
