# Implementation Plan: Enhanced Package Discovery

## Overview

扩展 Dev Janitor 的包管理器发现能力，增加 Homebrew、Conda、Pipx、Poetry、Pyenv 支持，并实现智能分层路径搜索功能。

## Tasks

- [x] 1. 类型系统和基础设施
  - [x] 1.1 扩展类型定义
    - 在 `src/shared/types/index.ts` 中添加新的包管理器类型
    - 创建 `src/shared/types/packageManagerConfig.ts` 配置接口
    - 创建 `src/main/packageDiscovery/types.ts` 处理器接口
    - _Requirements: 6.1, 8.1, 8.2, 11.1, 11.3_
  
  - [x] 1.2 实现路径缓存（PathCache）
    - 创建 `src/main/packageDiscovery/pathCache.ts`
    - 实现会话级缓存，存储路径和可用性状态
    - 编写属性测试（Property 5: Path Caching Correctness）
    - _Requirements: 12.3, 13.2_
  
  - [x] 1.3 实现分层路径搜索（TieredPathSearch）
    - 创建 `src/main/packageDiscovery/tieredPathSearch.ts`
    - 实现四层搜索：命令检查 → PATH 扫描 → 常见路径 → 自定义路径
    - 编写属性测试（Property 7: Tiered Search Order）
    - _Requirements: 10.1, 10.6, 13.3, 13.4_

- [x] 2. 实现 Homebrew 支持
  - [x] 2.1 创建 BrewHandler
    - 创建 `src/main/packageDiscovery/handlers/brewHandler.ts`
    - 实现 formula 和 cask 列表、解析、卸载功能
    - 编写属性测试（Property 1: Parser Output, Property 3: Uninstall Command）
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 7.1, 7.2_

- [x] 3. 实现 Conda 支持
  - [x] 3.1 创建 CondaHandler
    - 创建 `src/main/packageDiscovery/handlers/condaHandler.ts`
    - 实现 JSON 解析、channel 提取、卸载功能
    - 编写属性测试（Property 1: Parser Output）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 7.3_

- [x] 4. 实现 Pipx 支持
  - [x] 4.1 创建 PipxHandler
    - 创建 `src/main/packageDiscovery/handlers/pipxHandler.ts`
    - 实现 venvs JSON 解析、卸载功能
    - 编写属性测试（Property 1: Parser Output）
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 7.4_

- [x] 5. 实现 Poetry 和 Pyenv 支持
  - [x] 5.1 创建 PoetryHandler
    - 创建 `src/main/packageDiscovery/handlers/poetryHandler.ts`
    - 实现 Poetry 数据目录扫描
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [x] 5.2 创建 PyenvHandler
    - 创建 `src/main/packageDiscovery/handlers/pyenvHandler.ts`
    - 实现版本列表解析、卸载功能
    - 编写属性测试（Property 1: Parser Output）
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.5_

- [x] 6. Checkpoint - 验证所有处理器
  - 运行所有测试，确保各个包管理器处理器正常工作
  - 如有问题，询问用户

- [x] 7. 实现主类和容错机制
  - [x] 7.1 创建 PackageDiscovery 主类
    - 创建 `src/main/packageDiscovery/packageDiscovery.ts`
    - 实现并行可用性检测和进度回调
    - 实现 PATH 配置状态检测（区分 available、path_missing、not_installed）
    - 返回 PackageManagerStatus 包含发现方法和 PATH 状态
    - 编写属性测试（Property 4: Availability State, Property 9: Parallel Execution, Property 11: PATH Status Detection）
    - _Requirements: 6.1, 6.2, 6.3, 13.1, 13.6, 14.1, 14.2, 14.3, 14.4_
  
  - [x] 7.2 增强解析容错能力
    - 为所有解析器添加 JSON 失败时的文本回退
    - 处理畸形输入和空输出
    - 编写属性测试（Property 6: Parsing Resilience, Property 10: Unavailable Manager Handling）
    - _Requirements: 1.3, 2.2, 3.2, 4.2, 5.2, 9.1, 9.2, 9.3_
  
  - [x] 7.3 实现用户配置支持
    - 读取 `~/.config/dev-janitor/package-managers.json`
    - 实现自定义路径优先级
    - 编写属性测试（Property 8: Custom Path Priority）
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 8. 集成到现有系统
  - [x] 8.1 更新 packageManager.ts
    - 导出新功能，保持向后兼容
    - _Requirements: All_
  
  - [x] 8.2 更新 IPC 处理器
    - 在 `src/main/ipcHandlers.ts` 中添加新的 IPC 通道
    - 添加获取包管理器状态的 API（包含 PATH 配置信息）
    - _Requirements: All, 14.5, 14.6_
  
  - [x] 8.3 创建导出索引
    - 创建 `src/main/packageDiscovery/index.ts`
    - _Requirements: All_
  
  - [x] 8.4 更新前端显示 PATH 配置警告
    - 在包管理器列表中显示状态图标
    - 对于 'path_missing' 状态显示警告和修复建议
    - 提供一键复制 PATH 配置命令的功能
    - _Requirements: 14.5, 14.6_

- [x] 9. 最终验证
  - 运行完整测试套件
  - 验证所有属性测试通过
  - 确认与现有功能的兼容性

## Notes

- 使用 `fast-check` 库进行属性测试
- 保持与现有 `commandExecutor.ts` 的一致性
- 每个处理器实现时同步编写测试
- Checkpoint 用于阶段性验证，遇到问题及时沟通
