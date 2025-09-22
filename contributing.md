# Contributing to PhishingShield

Welcome! We're excited you're interested in contributing to PhishingShield. This document provides guidelines for contributing to make the process smooth for everyone.

Title: [HELP WANTED] Security Review of Phishing Detection Algorithms
Labels: help-wanted, security, good-first-issue

Looking for security researchers to review our detection methods:
- Typosquatting detection using Levenshtein distance
- Unicode homographic attack prevention
- Enterprise service pattern recognition

Background needed: Cybersecurity, threat analysis
Estimated time: 2-4 hours

## 🎯 Ways to Contribute

### For Security Researchers
- **Validate detection algorithms** - Review our phishing detection methods
- **Identify new attack patterns** - Help us stay ahead of evolving threats
- **Security audits** - Review code for potential vulnerabilities
- **False positive analysis** - Help improve accuracy

### For Developers
- **Performance optimization** - Make detection faster and more efficient
- **Browser compatibility** - Ensure compatibility across different browsers
- **Code quality improvements** - Refactoring, testing, documentation
- **New features** - Enterprise features, API integrations

### For Designers
- **UI/UX improvements** - Make the interface more intuitive
- **Accessibility** - Ensure the extension works for all users
- **Visual design** - Icons, layouts, user flows
- **Mobile responsiveness** - Optimize for different screen sizes

### For Everyone
- **Bug reports** - Help us identify and fix issues
- **Documentation** - Improve guides, add translations
- **Community management** - Help new contributors get started
- **Testing** - Manual testing across different scenarios

## 🚀 Getting Started

### Prerequisites
- **Browser:** Chrome 88+, Firefox 109+, or Edge 88+
- **Git:** For version control
- **Text Editor:** VS Code, Sublime, or your preferred editor
- **Basic Knowledge:** JavaScript, HTML, CSS, Chrome Extension APIs

### Development Setup
1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/yourusername/phishing-shield-extension.git
   cd phishing-shield-extension
   ```
3. **Load the extension:**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder
4. **Make changes and test**
5. **Submit a pull request**

## 📝 Development Guidelines

### Code Style
- **JavaScript:** Use modern ES6+ features
- **Indentation:** 2 spaces
- **Comments:** JSDoc style for functions, inline comments for complex logic
- **Variables:** Descriptive names, camelCase
- **Functions:** Pure functions where possible, clear single responsibility

### File Structure
```
phishing-shield-extension/
├── manifest.json      # Extension configuration
├── content.js         # Main detection engine (1800+ lines)
├── background.js      # Service worker (400+ lines)
├── popup.html/js/css  # User interface
├── options.html/js/css # Advanced settings
└── icons/             # Extension icons
```

### Key Components
- **Detection Engine (content.js):** Core phishing detection algorithms
- **Service Worker (background.js):** Statistics, settings, messaging
- **User Interface (popup.*):** Real-time status and controls
- **Settings (options.*):** Advanced configuration options

## 🐛 Reporting Bugs

### Before Submitting
1. **Check existing issues** to avoid duplicates
2. **Test with latest version** to ensure bug still exists
3. **Disable other extensions** to rule out conflicts
4. **Check browser console** for error messages (F12)

### Bug Report Template
```markdown
**Bug Description**
A clear description of what the bug is.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- Extension Version: [e.g. 1.2.1]
- Browser: [e.g. Chrome 118]
- OS: [e.g. Windows 11]

**Screenshots/Console Logs**
If applicable, add screenshots or console logs.
```

## 🌟 Feature Requests

### Feature Request Template
```markdown
**Feature Description**
A clear description of what you want to happen.

**Problem Statement**
What problem does this solve? What's the current limitation?

**Proposed Solution**
Describe the solution you'd like to see.

**Alternatives Considered**
Alternative solutions or features you've considered.

**Additional Context**
Screenshots, mockups, or examples that help explain the feature.
```

## 🔒 Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead:
1. Email `security@phishingshield.com`
2. Include detailed description and steps to reproduce
3. Allow 48 hours for initial response
4. Work with maintainers on responsible disclosure

## 📋 Pull Request Process

### Before Submitting
1. **Test thoroughly** across different browsers
2. **Check code quality** - no console errors, follows style guide
3. **Update documentation** if needed
4. **Add tests** for new functionality (if applicable)

### Pull Request Template
```markdown
**Description**
Brief description of changes.

**Type of Change**
- [ ] Bug fix
- [ ] New feature  
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Other (specify)

**Testing**
- [ ] Tested in Chrome
- [ ] Tested in Firefox  
- [ ] Tested in Edge
- [ ] Added/updated tests

**Screenshots**
If applicable, add screenshots of changes.
```

### Review Process
1. **Automatic checks** - Code style, basic functionality
2. **Maintainer review** - Code quality, security, performance
3. **Community feedback** - Other contributors may provide input
4. **Final approval** - Maintainer approves and merges

## 🏷️ Good First Issues

Looking for a way to get started? Check issues labeled:
- `good first issue` - Perfect for newcomers
- `help wanted` - We'd love community help on these
- `bug` - Fix existing problems
- `enhancement` - Add new features
- `documentation` - Improve guides and docs

### Easy Tasks (Good First Issues)
- Add new brand domains to detection database
- Improve error messages and user feedback
- Add support for more languages in detection patterns
- Enhance popup UI responsiveness
- Write additional test cases

### Medium Tasks
- Implement new enterprise service patterns
- Add performance monitoring and metrics
- Improve accessibility features
- Create installation guides for other browsers
- Add bulk whitelist import/export features

### Advanced Tasks
- Machine learning integration for pattern detection
- Advanced heuristics for zero-day phishing detection
- Performance optimization for large-scale deployment
- Integration with threat intelligence feeds
- Advanced enterprise security features

## 🎨 Design Guidelines

### Visual Identity
- **Colors:** Primary blue (#3b82f6), Success green (#10b981), Warning orange (#f59e0b), Danger red (#dc3545)
- **Typography:** System fonts for compatibility
- **Icons:** Clean, minimal, universally understood
- **Spacing:** Consistent 8px grid system

### User Experience Principles
- **Privacy First:** No data collection, transparent about what we do
- **Performance:** Fast, lightweight, doesn't slow down browsing
- **Accuracy:** High detection rate with minimal false positives
- **Usability:** Easy to understand and configure for all skill levels

## 🌍 Community Guidelines

### Code of Conduct
We're committed to providing a welcoming environment for all contributors:

- **Be respectful** - Treat others with kindness and respect
- **Be collaborative** - Work together toward common goals
- **Be inclusive** - Welcome people of all backgrounds and identities
- **Be constructive** - Focus on what's best for the community
- **Be patient** - Remember that everyone is learning

### Communication Channels
- **GitHub Issues** - Bug reports, feature requests, technical discussion
- **GitHub Discussions** - General questions, ideas, community chat
- **Email** - Direct contact for sensitive issues (security@phishingshield.com)

## 📚 Resources

### Technical Documentation
- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [OWASP Phishing Guide](https://owasp.org/www-community/attacks/Phishing)

### Project-Specific Docs
- **Architecture Overview** - How the extension components work together
- **Detection Algorithm Details** - Technical details of phishing detection
- **Performance Guidelines** - Best practices for optimization
- **Testing Procedures** - How to properly test changes

## 🏆 Recognition

### Contributors
All contributors are recognized in:
- README.md contributor section
- Release notes for their contributions
- GitHub contributor graph
- Special thanks for significant contributions

### Contribution Types
We recognize many types of contributions:
- 💻 Code
- 🐛 Bug reports
- 📖 Documentation
- 🎨 Design
- 🔍 Testing
- 💬 Community support
- 🌍 Translation
- 🔒 Security research

## ❓ Questions?

Don't hesitate to ask! You can:
1. **Open a GitHub Discussion** for general questions
2. **Comment on relevant issues** for specific questions
3. **Email** support@phishingshield.com for direct help
4. **Check existing documentation** for common answers

Good First Issues:
🟢 Add support for new brand detection (difficulty: easy)
🟢 Improve popup.css responsive design (difficulty: easy)  
🟡 Implement additional TLD risk patterns (difficulty: medium)
🟡 Add more enterprise service patterns (difficulty: medium)
🔴 Machine learning integration for pattern detection (difficulty: hard)
🔴 Performance optimization for large-scale deployment (difficulty: hard)

## 🙏 Thank You

Thank you for contributing to PhishingShield! Every contribution, no matter how small, helps make the internet safer for everyone.

---

*Last updated: September 2025*