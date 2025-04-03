# Software Requirements Specification

## Website Color Tagger Browser Extension

### 1. Introduction

#### 1.1 Purpose
The Website Color Tagger is a browser extension designed to help users visually identify and distinguish between different instances or environments of websites by adding customizable colored tags to web pages.

#### 1.2 Scope
This extension provides a visual tagging system for websites, allowing users to easily recognize which version or environment of a website they are currently viewing (e.g., development, staging, production).

#### 1.3 Definitions and Acronyms
- **Tag**: The visual colored element displayed on a website
- **Domain**: A website's hostname (e.g., example.com)
- **Environment**: Different instances of the same application (development, staging, production)

### 2. Overall Description

#### 2.1 Product Perspective
The Website Color Tagger is a standalone browser extension that integrates with web browsers to enhance the browsing experience by providing visual identification of websites.

#### 2.2 Product Functions
- Display customizable colored tags on websites
- Enable/disable tags globally and per domain
- Customize tag colors and labels for each domain
- Persist settings across browsing sessions
- Provide a user-friendly configuration interface
- By default the extension should not show any tags for any website. only after enabling it for any website should make it enabled and show the tag, that too when the enabling is true and not false.

#### 2.3 User Classes and Characteristics
- Web developers who work across multiple environments
- QA testers who need to quickly identify test environments
- DevOps engineers managing multiple production instances
- Users who want visual distinction between similar websites

#### 2.4 Operating Environment
- Chrome web browser (version 88+)
- Firefox web browser (version 78+)
- Other browsers supporting Manifest V3 extensions

### 3. Specific Requirements

#### 3.1 External Interfaces

##### 3.1.1 User Interface
- **Configuration Interface**:
  - Global enable/disable toggle
  - Domain-specific enable/disable toggle
  - Color picker for tag customization
  - Text input for custom tag labels
  - List of enabled domains with delete options
  - Dark/light theme toggle
  - Reset options (per domain and global)

##### 3.1.2 Website Display
- A colored tag appearing at the top-left corner of websites
- Tag shows custom text or auto-generated domain abbreviation
- Tag has hover interaction effects for better visibility

#### 3.2 Functional Requirements

##### 3.2.1 Tag Display
- FR-1: Show colored tags on enabled domains when extension is globally enabled
- FR-2: Position tag at top-left corner of viewport
- FR-3: Generate default tag colors based on domain name hash
- FR-4: Generate default label from first two letters of domain name
- FR-5: Support custom text labels and colors
- FR-6: Add hover effects to tag for improved user interaction

##### 3.2.2 Settings Management
- FR-7: Store and retrieve settings using browser Storage API
- FR-8: Support per-domain configuration (enable/disable, color, label)
- FR-9: Support global extension toggle
- FR-10: Support dark/light theme preference
- FR-11: Provide reset functionality for domain and global settings

##### 3.2.3 Communication
- FR-12: Establish messaging between various components
- FR-13: Notify the tag display of settings changes in real-time
- FR-14: Update UI to reflect current settings state

#### 3.3 Non-Functional Requirements

##### 3.3.1 Performance
- NFR-1: Minimal impact on page load time (< 100ms)
- NFR-2: Smooth tag rendering without flickering
- NFR-3: Responsive configuration interface (< 200ms response time)
- NFR-4: Efficient storage utilization (< 100KB for all settings)

##### 3.3.2 Security
- NFR-5: Request minimal permissions (storage, tabs, activeTab)
- NFR-6: No data collection or external API calls
- NFR-7: No personal data storage

##### 3.3.3 Usability
- NFR-8: Intuitive interface requiring no documentation
- NFR-9: Consistent visual styling across the extension
- NFR-10: Clear visual feedback for user actions

### 4. Technical Specification

#### 4.1 Component Architecture
- **Background Service**: Manages state and settings storage
- **Tag Display**: Injects and manages tags on web pages
- **Configuration UI**: Provides user configuration options

#### 4.2 Data Storage
- Browser Storage API for settings persistence
- Settings schema:
  ```json
  {
    "settings": {
      "globalEnabled": boolean,
      "darkMode": boolean,
      "domains": {
        "[domain]": {
          "enabled": boolean,
          "color": string,
          "label": string
        }
      }
    }
  }
  ```

#### 4.3 Browser Compatibility
- Chrome (using Manifest V3)
- Firefox (using browser-specific settings)

### 5. Implementation Constraints

- Must comply with Chrome/Firefox extension policies
- Must use Manifest V3 structure
- Must maintain backward compatibility with existing users' settings
- Must not interfere with normal website functionality

### 6. Future Enhancements

- Support for additional tag positions (top-right, bottom-left, etc.)
- Tag templates for common environments (dev, staging, prod)
- Export/import settings functionality
