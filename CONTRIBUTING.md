# Contributing to Evento

First off, thank you for considering contributing to Evento! It's people like you that make Evento such a great tool for event management.

## Table of Contents

- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what you expected to see
- **Include screenshots** if relevant
- **Include your environment details** (OS, Node version, browser, etc.)

**Bug Report Template:**

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
What you expected to happen.

**Screenshots & Videos**
If applicable, add screenshots.

**Environment:**

- OS: [e.g., macOS 13.0]
- Node: [e.g., 18.17.0]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]
```

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful**
- **List any alternative solutions** you've considered

### Your First Code Contribution

Unsure where to begin? You can start by looking through `good-first-issue` and `help-wanted` issues:

- **Good first issues** - issues that should only require a few lines of code
- **Help wanted issues** - issues that may be more involved

### Pull Requests

We actively welcome your pull requests! Here's how to contribute:

1. Fork the repo and create your branch from `dev`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code lints
6. Issue that pull request!

**Important:** All contributions should be based on the `dev` branch, not `main`. The `main` branch is reserved for stable releases.

## Development Setup

### Prerequisites

- Node.js 18.x or later
- PNPM package manager
- Git

### Setup Steps

1. **Fork and clone the repository**

    ```bash
    git clone https://github.com/sevenlabsxyz/evento-client.git
    cd evento-client
    ```

2. **Switch to the dev branch**

    ```bash
    git checkout dev
    ```

3. **Install dependencies**

    ```bash
    pnpm install
    ```

4. **Set up environment variables**

    ```bash
    cp .env.example .env.local
    ```

    Fill in your API keys and credentials in `.env.local`

5. **Start the development server**
    ```bash
    pnpm dev
    ```

## Pull Request Process

### Before Submitting

1. **Update documentation** - If you change functionality, update relevant docs
2. **Add tests** - Ensure your changes are covered by tests
3. **Run the test suite** - Make sure all tests pass
4. **Check your code style** - Run the linter and fix any issues
5. **Update the changelog** - Add a note about your changes (if applicable)

### Submission Checklist

- [ ] My code follows the project's code style
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Use template literals for string interpolation
- Prefer `const` over `let`, avoid `var`

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that don't affect code meaning (formatting, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Examples

```
feat(events): add recurring event support

Implement weekly, monthly, and yearly recurring events with
customizable end dates.

Closes #123

---

fix(auth): resolve token refresh issue

The refresh token was not being properly stored in localStorage,
causing users to be logged out unexpectedly.

---

docs(readme): update installation instructions

Add missing step for database migration setup.
```

### Rules

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No period (.) at the end
- Keep the subject line under 50 characters
- Separate subject from body with a blank line
- Wrap the body at 72 characters
- Use the body to explain what and why vs. how

## Testing Guidelines

### Test Coverage

- Aim for at least 80% code coverage
- Write tests for all new features
- Update tests when modifying existing code
- Test edge cases and error conditions

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test path/to/test.test.ts
```

## Documentation

### Code Comments

- Write self-documenting code when possible
- Add comments for complex logic
- Document public APIs and interfaces
- Keep comments up to date with code changes

### README Updates

If your changes affect:

- Installation process
- Configuration
- Usage examples
- Available features

Please update the relevant documentation files.

## Getting Help

- **Questions**: Open a [GitHub Discussion](https://github.com/sevenlabsxyz/evento-client/discussions)
- **Chat**: Join our community chat (if available)
- **Email**: Contact maintainers at dev@evento.so

## Recognition

Contributors will be recognized in:

- The project README
- Release notes for significant contributions
- Our contributors page (if available)

## License

By contributing to Evento, you agree that your contributions will be licensed under the GNU License.

---

Thank you for contributing to Evento! 🎉
