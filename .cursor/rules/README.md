# Festibee Dashboard - Cursor Rules

This directory contains Cursor rules to help with development of the Festibee festival management admin dashboard.

## Important Guidelines

### 🌐 Language Policy
- **Korean Response Requirement**: All responses to users must be in Korean (한국어)
- **English Rules Management**: All rules and code must be maintained in English
- **Code Consistency**: Variable names, function names, and technical terms remain in English

### 📝 Rules Management
- Always write and maintain rules in English for consistency
- Use clear, technical English for better international collaboration
- Code examples and patterns should use English conventions
- File references and technical documentation in English

## Available Rules

### 🏗️ Project Structure (`project-structure.mdc`)
- **Always Applied** - Provides overview of the project structure
- Explains the Next.js app directory layout
- Describes navigation structure and key directories
- File naming conventions

### 📝 TypeScript Patterns (`typescript-patterns.mdc`)  
- **Applied to**: `*.ts`, `*.tsx` files
- Type definition patterns from `types/` directory
- Component props interface conventions
- Import organization standards
- State management with proper generics

### 🌐 API Conventions (`api-conventions.mdc`)
- **Description-based** - Use when working with API integration
- API layer structure and patterns from `lib/api.ts`
- Error handling conventions
- Password protection patterns
- Component-API integration best practices

### ⚛️ Component Patterns (`component-patterns.mdc`)
- **Applied to**: `app/**/*.tsx`, `components/**/*.tsx`
- React component structure and organization
- Form component patterns
- UI component usage from `components/ui/`
- Modal and event handling patterns

### 🎨 Styling Conventions (`styling-conventions.mdc`)
- **Applied to**: `*.tsx`, `*.css` files
- Tailwind CSS usage patterns
- Design system colors and CSS variables
- Layout patterns from the main layout
- Component styling standards

### 🌐 Korean Response (`korean-response.mdc`)
- **Always Applied** - Requires all responses to be in Korean
- Ensures consistent Korean communication with users
- Maintains English for code and technical documentation
- Provides guidelines for language usage

## How to Use

These rules will automatically be applied based on:
- **File patterns** (globs) - Rules apply to specific file types
- **Always applied** - Rules that apply to every request
- **Description-based** - Rules that can be manually referenced when needed

The rules reference actual files in your codebase using the `[filename](mdc:filename)` syntax, making them dynamic and always up-to-date with your project structure.

## Project Context

This is a Next.js 13+ admin dashboard for festival management with:
- TypeScript for type safety
- Tailwind CSS for styling  
- Radix UI components for accessibility
- API integration with backend services
- Password-protected admin operations

The rules are designed to maintain consistency across the codebase and help new developers understand the established patterns and conventions.