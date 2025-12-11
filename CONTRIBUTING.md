# Contributing to Evento

First off, thank you for considering contributing to Evento! It's people like you that make Evento such a great tool for event management.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Testing Guidelines](#testing-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

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

**Screenshots**
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

5. **Set up the database**

    ```bash
    supabase link --project-ref your-project-ref
    supabase db push
    ```

6. **Start the development server**
    ```bash
    pnpm dev
    ```

For detailed setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

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

### PR Title Format

Use conventional commit format for PR titles:

```
type(scope): brief description

Examples:
feat(events): add recurring event support
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
```

### Review Process

1. At least one maintainer must review and approve your PR
2. All CI checks must pass
3. Any requested changes must be addressed
4. Once approved, a maintainer will merge your PR

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid using `any` - use proper types or `unknown`
- Use interfaces for object shapes
- Use type aliases for unions and primitives

```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ Bad
const user: any = { ... };
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

```typescript
// ✅ Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({
  onClick,
  children,
  variant = 'primary',
}: ButtonProps) {
  return (
    <button onClick={onClick} className={variant}>
      {children}
    </button>
  );
}
```

### File Organization

- One component per file
- Group related files in directories
- Use index files for clean imports
- Keep test files next to source files

```
components/
├── event-card/
│   ├── event-card.tsx
│   ├── event-card.test.tsx
│   ├── event-card-header.tsx
│   └── index.ts
```

### Naming Conventions

- **Components**: PascalCase (`EventCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useEventData.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays
- Use template literals for string interpolation
- Prefer `const` over `let`, avoid `var`

```typescript
// ✅ Good
const greeting = `Hello, ${name}!`;
const items = ['item1', 'item2', 'item3'];

// ❌ Bad
var greeting = 'Hello, ' + name + '!';
const items = ['item1', 'item2', 'item3'];
```

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

### Test Structure

```typescript
describe('ComponentName', () => {
    describe('feature or method', () => {
        it('should do something specific', () => {
            // Arrange
            const input = 'test';

            // Act
            const result = doSomething(input);

            // Assert
            expect(result).toBe('expected');
        });
    });
});
```

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

### What to Test

- **Components**: Rendering, user interactions, edge cases
- **Hooks**: Return values, state changes, side effects
- **Utilities**: Input/output, edge cases, error handling
- **API calls**: Success cases, error cases, loading states

## Documentation

### Code Comments

- Write self-documenting code when possible
- Add comments for complex logic
- Document public APIs and interfaces
- Keep comments up to date with code changes

```typescript
/**
 * Formats a date string according to the user's locale
 * @param date - ISO 8601 date string
 * @param locale - BCP 47 language tag (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: string, locale = 'en-US'): string {
    return new Date(date).toLocaleDateString(locale);
}
```

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

By contributing to Evento, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Evento! 🎉
