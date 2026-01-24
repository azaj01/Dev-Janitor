# Requirements Document

## Introduction

本功能扩展 Dev Janitor 的包管理器发现能力，增加对 Homebrew（Mac 平台）和更多 Python 生态系统工具（Conda、Pipx、Poetry、Pyenv）的支持。目标是让用户能够全面搜索和管理系统中安装的各类开发包。

## Glossary

- **Package_Manager_Module**: 负责检测、列出和管理各种包管理器安装的软件包的核心模块
- **Homebrew**: Mac 平台上最流行的包管理器，支持 formula（命令行工具）和 cask（GUI 应用）
- **Conda**: 跨平台的包和环境管理器，常用于科学计算和数据科学
- **Pipx**: 专门用于安装和运行 Python CLI 应用的工具，每个应用在独立的虚拟环境中
- **Poetry**: 现代 Python 依赖管理和打包工具
- **Pyenv**: Python 版本管理工具，允许安装和切换多个 Python 版本
- **PackageInfo**: 表示单个软件包信息的数据结构，包含名称、版本、位置和管理器类型

## Requirements

### Requirement 1: Homebrew 包发现

**User Story:** As a Mac user, I want to discover packages installed via Homebrew, so that I can manage all my development tools in one place.

#### Acceptance Criteria

1. WHEN the Package_Manager_Module scans for Homebrew packages, THE Package_Manager_Module SHALL execute `brew list --versions` to retrieve installed formula packages
2. WHEN the Package_Manager_Module scans for Homebrew cask applications, THE Package_Manager_Module SHALL execute `brew list --cask --versions` to retrieve installed cask applications
3. WHEN Homebrew is not installed on the system, THE Package_Manager_Module SHALL skip Homebrew scanning without error
4. WHEN parsing Homebrew output, THE Package_Manager_Module SHALL extract package name and version for each installed package
5. WHEN a Homebrew package is detected, THE Package_Manager_Module SHALL set the manager field to 'brew' and location field to 'formula' or 'cask' accordingly

### Requirement 2: Conda 包发现

**User Story:** As a data scientist, I want to discover packages installed via Conda, so that I can manage my scientific computing environment.

#### Acceptance Criteria

1. WHEN the Package_Manager_Module scans for Conda packages, THE Package_Manager_Module SHALL execute `conda list --json` to retrieve installed packages
2. WHEN Conda is not installed on the system, THE Package_Manager_Module SHALL skip Conda scanning without error
3. WHEN parsing Conda JSON output, THE Package_Manager_Module SHALL extract name, version, and channel for each package
4. WHEN a Conda package is detected, THE Package_Manager_Module SHALL set the manager field to 'conda'

### Requirement 3: Pipx 包发现

**User Story:** As a Python developer, I want to discover CLI tools installed via Pipx, so that I can manage my isolated Python applications.

#### Acceptance Criteria

1. WHEN the Package_Manager_Module scans for Pipx packages, THE Package_Manager_Module SHALL execute `pipx list --json` to retrieve installed packages
2. WHEN Pipx is not installed on the system, THE Package_Manager_Module SHALL skip Pipx scanning without error
3. WHEN parsing Pipx JSON output, THE Package_Manager_Module SHALL extract package name and version from the venvs structure
4. WHEN a Pipx package is detected, THE Package_Manager_Module SHALL set the manager field to 'pipx'

### Requirement 4: Poetry 全局包发现

**User Story:** As a Python developer using Poetry, I want to discover globally installed Poetry packages, so that I can manage my Poetry-based tools.

#### Acceptance Criteria

1. WHEN the Package_Manager_Module scans for Poetry packages, THE Package_Manager_Module SHALL check for global packages in the Poetry data directory
2. WHEN Poetry is not installed on the system, THE Package_Manager_Module SHALL skip Poetry scanning without error
3. WHEN a Poetry package is detected, THE Package_Manager_Module SHALL set the manager field to 'poetry'

### Requirement 5: Pyenv Python 版本发现

**User Story:** As a Python developer, I want to discover Python versions installed via Pyenv, so that I can manage my Python installations.

#### Acceptance Criteria

1. WHEN the Package_Manager_Module scans for Pyenv versions, THE Package_Manager_Module SHALL execute `pyenv versions --bare` to retrieve installed Python versions
2. WHEN Pyenv is not installed on the system, THE Package_Manager_Module SHALL skip Pyenv scanning without error
3. WHEN parsing Pyenv output, THE Package_Manager_Module SHALL extract each Python version as a separate entry
4. WHEN a Pyenv version is detected, THE Package_Manager_Module SHALL set the manager field to 'pyenv' and name field to 'python'

### Requirement 6: 包管理器可用性检测

**User Story:** As a user, I want the system to automatically detect which package managers are available, so that only relevant packages are scanned.

#### Acceptance Criteria

1. WHEN checking package manager availability, THE Package_Manager_Module SHALL execute version commands for each supported manager
2. WHEN a package manager command succeeds, THE Package_Manager_Module SHALL mark that manager as available
3. WHEN a package manager command fails, THE Package_Manager_Module SHALL mark that manager as unavailable and skip its scanning

### Requirement 7: 包卸载功能扩展

**User Story:** As a user, I want to uninstall packages from newly supported package managers, so that I can clean up unwanted software.

#### Acceptance Criteria

1. WHEN uninstalling a Homebrew formula package, THE Package_Manager_Module SHALL execute `brew uninstall <package>`
2. WHEN uninstalling a Homebrew cask application, THE Package_Manager_Module SHALL execute `brew uninstall --cask <package>`
3. WHEN uninstalling a Conda package, THE Package_Manager_Module SHALL execute `conda remove -y <package>`
4. WHEN uninstalling a Pipx package, THE Package_Manager_Module SHALL execute `pipx uninstall <package>`
5. WHEN uninstalling a Pyenv version, THE Package_Manager_Module SHALL execute `pyenv uninstall -f <version>`

### Requirement 8: 类型系统扩展

**User Story:** As a developer, I want the type system to support new package managers, so that the codebase remains type-safe.

#### Acceptance Criteria

1. THE PackageInfo interface SHALL include 'brew', 'conda', 'pipx', 'poetry', and 'pyenv' as valid manager types
2. THE PackageInfo interface SHALL support 'formula', 'cask', 'conda-env', 'pipx-venv', and 'pyenv-version' as valid location types

### Requirement 9: 输出解析健壮性

**User Story:** As a user, I want the system to handle various output formats gracefully, so that package discovery works reliably.

#### Acceptance Criteria

1. WHEN JSON parsing fails for any package manager output, THE Package_Manager_Module SHALL attempt text-based fallback parsing
2. WHEN text parsing encounters malformed lines, THE Package_Manager_Module SHALL skip those lines and continue processing
3. WHEN a package manager returns empty output, THE Package_Manager_Module SHALL return an empty array without error

### Requirement 10: 智能路径搜索

**User Story:** As a user with custom installations, I want the system to search common installation paths, so that packages installed in non-standard locations can be discovered.

#### Acceptance Criteria

1. WHEN standard command detection fails, THE Package_Manager_Module SHALL search common installation paths for each package manager
2. THE Package_Manager_Module SHALL search the following paths for Homebrew: `/opt/homebrew/bin/brew`, `/usr/local/bin/brew`, `~/.homebrew/bin/brew`
3. THE Package_Manager_Module SHALL search the following paths for Conda: `~/anaconda3/bin/conda`, `~/miniconda3/bin/conda`, `/opt/anaconda3/bin/conda`, `/opt/miniconda3/bin/conda`, `~/.conda/bin/conda`
4. THE Package_Manager_Module SHALL search the following paths for Pipx: `~/.local/bin/pipx`, `/usr/local/bin/pipx`
5. THE Package_Manager_Module SHALL search the following paths for Pyenv: `~/.pyenv/bin/pyenv`, `/opt/pyenv/bin/pyenv`
6. WHEN a package manager is found via path search, THE Package_Manager_Module SHALL use the full path for subsequent commands

### Requirement 11: 用户自定义路径配置

**User Story:** As a power user, I want to configure custom paths for package managers, so that I can discover packages from my unique setup.

#### Acceptance Criteria

1. THE Package_Manager_Module SHALL support reading custom paths from a configuration file
2. WHEN custom paths are configured, THE Package_Manager_Module SHALL prioritize custom paths over default paths
3. THE configuration file SHALL be located at `~/.config/dev-janitor/package-managers.json`
4. WHEN the configuration file does not exist, THE Package_Manager_Module SHALL use default paths only

### Requirement 12: PATH 环境变量扫描

**User Story:** As a user, I want the system to scan PATH directories for package managers, so that any accessible package manager can be discovered.

#### Acceptance Criteria

1. WHEN searching for package managers, THE Package_Manager_Module SHALL scan all directories in the PATH environment variable
2. WHEN a package manager executable is found in PATH, THE Package_Manager_Module SHALL verify it by executing a version command
3. THE Package_Manager_Module SHALL cache discovered paths to avoid repeated PATH scanning


### Requirement 13: 搜索性能优化

**User Story:** As a user, I want package discovery to be fast, so that I don't have to wait long for results.

#### Acceptance Criteria

1. THE Package_Manager_Module SHALL execute package manager availability checks in parallel
2. THE Package_Manager_Module SHALL cache package manager paths for the duration of the application session
3. WHEN scanning PATH directories, THE Package_Manager_Module SHALL use early termination once a package manager is found
4. THE Package_Manager_Module SHALL implement a tiered search strategy: command check first, then PATH scan, then common paths
5. THE total package discovery time SHALL complete within 5 seconds for all available package managers under normal conditions
6. THE Package_Manager_Module SHALL provide progress feedback during long-running scans

### Requirement 14: PATH 配置状态检测和提示

**User Story:** As a user, I want to know when a package manager is installed but not in PATH, so that I can fix my environment configuration.

#### Acceptance Criteria

1. WHEN a package manager is found via common path search (Tier 3) but NOT found via direct command (Tier 1), THE Package_Manager_Module SHALL mark the status as 'path_missing'
2. WHEN a package manager is found via direct command (Tier 1) or PATH scan (Tier 2), THE Package_Manager_Module SHALL mark the status as 'available'
3. WHEN a package manager is not found in any tier, THE Package_Manager_Module SHALL mark the status as 'not_installed'
4. THE Package_Manager_Module SHALL return the discovery method (direct_command, path_scan, common_path, custom_path) for each found package manager
5. WHEN displaying package manager status, THE system SHALL show a warning icon and message for 'path_missing' status
6. THE warning message SHALL include the found path and suggest adding it to PATH environment variable
