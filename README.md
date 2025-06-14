
# Anxiety Reduction App

A React-based web application that helps users manage anxiety through EFT (Emotional Freedom Technique) tapping sessions and personalized guidance.

## 🌟 Overview

This application provides a comprehensive anxiety management solution featuring:
- PHQ-9 health assessment questionnaire
- Interactive EFT tapping assistant with guided sessions
- Personalized advice based on user progress
- Session history tracking
- Clean, responsive UI built with modern React and Tailwind CSS

## 🏗️ Architecture

The application follows a component-based architecture with clear separation of concerns:

```
src/
├── components/           # Reusable UI components
│   ├── anxiety-bot/     # EFT tapping assistant components
│   └── ui/              # Shadcn/ui components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
└── pages/               # Main application pages
```

## 📁 File Structure & Descriptions

### Root Configuration Files
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `vite.config.ts` - Vite build tool configuration
- `components.json` - Shadcn/ui component configuration

### Main Application Files

#### `src/App.tsx`
Main application router and layout. Handles routing between different pages using React Router.

#### `src/main.tsx`
Application entry point. Sets up React root and renders the main App component.

#### `src/index.css`
Global CSS styles and Tailwind imports.

### Pages (`src/pages/`)

#### `src/pages/Index.tsx`
Landing page that serves as the main entry point. Handles user authentication flow and displays welcome content.

#### `src/pages/NotFound.tsx`
404 error page for handling invalid routes.

### Core Components (`src/components/`)

#### `src/components/AuthForm.tsx`
Authentication component handling both login and signup flows. Features:
- Toggle between login/signup modes
- Form validation
- Responsive design with gradient styling
- TODO: Supabase integration for actual authentication

#### `src/components/Dashboard.tsx`
Main dashboard component that orchestrates the user experience. Manages:
- Navigation between different app states (welcome, questionnaire, bot, at-risk)
- User profile state
- Crisis intervention for at-risk users
- Session routing and back navigation

#### `src/components/Questionnaire.tsx`
PHQ-9 depression screening questionnaire implementation. Features:
- Step-by-step question flow
- Progress tracking
- Score calculation
- Risk assessment for self-harm indicators
- Professional help recommendations

#### `src/components/AnxietyBot.tsx`
Main anxiety reduction chat interface. Orchestrates the entire EFT tapping process:
- Session management and state transitions
- Message handling and chat flow
- Tapping sequence coordination
- Progress tracking across multiple rounds
- Session history persistence in localStorage

#### `src/components/TappingSequence.tsx`
Standalone tapping sequence component (alternative implementation). Provides:
- Setup statement generation
- Guided tapping with timers
- Progress tracking through rounds
- Breathing exercises
- Intensity rating system

### Anxiety Bot Components (`src/components/anxiety-bot/`)

#### `src/components/anxiety-bot/types.ts`
TypeScript type definitions for the anxiety bot system:
- `ChatState` - Defines all possible conversation states
- `ChatSession` - Session data structure
- `Message` - Individual message structure

#### `src/components/anxiety-bot/ChatInterface.tsx`
Main chat interface component handling:
- Message rendering and display
- User input collection (text, sliders, selections)
- Setup statement selection
- Tapping point guidance
- Dynamic input types based on conversation state

#### `src/components/anxiety-bot/AdviceDisplay.tsx`
Renders personalized advice based on user progress:
- Progress-based advice generation
- Different advice tiers based on improvement percentage
- Encouraging messages and actionable recommendations
- Session completion handling

#### `src/components/anxiety-bot/SessionProgress.tsx`
Displays current session information and progress tracking:
- Session details (problem, feeling, location, intensity)
- Round progression
- Visual progress indicators

#### `src/components/anxiety-bot/ChatHistory.tsx`
Manages and displays previous chat sessions:
- Session list with timestamps
- Session loading functionality
- Clean, organized history display

#### `src/components/anxiety-bot/SessionComplete.tsx`
Final session completion screen:
- Session summary
- Options for new sessions
- History access

### UI Components (`src/components/ui/`)

The `ui/` directory contains Shadcn/ui components providing consistent design system:

#### Core Components
- `button.tsx` - Customizable button component with variants
- `card.tsx` - Card container with header, content, and description
- `input.tsx` - Form input fields
- `textarea.tsx` - Multi-line text input
- `slider.tsx` - Range slider for intensity ratings
- `progress.tsx` - Progress bar component

#### Layout & Navigation
- `scroll-area.tsx` - Custom scrollable areas
- `separator.tsx` - Visual dividers
- `badge.tsx` - Status and category badges

#### Form Components
- `label.tsx` - Form field labels
- `radio-group.tsx` - Radio button groups
- `checkbox.tsx` - Checkbox inputs
- `form.tsx` - Form wrapper and validation

#### Feedback Components
- `toast.tsx` - Toast notification system
- `alert.tsx` - Alert messages
- `skeleton.tsx` - Loading state placeholders

#### Interactive Components
- `dialog.tsx` - Modal dialogs
- `dropdown-menu.tsx` - Dropdown menus
- `popover.tsx` - Popover overlays
- `tooltip.tsx` - Hover tooltips

### Utility Files

#### `src/lib/utils.ts`
Utility functions including class name merging for Tailwind CSS.

#### `src/hooks/use-toast.ts`
Custom hook for toast notifications.

#### `src/hooks/use-mobile.tsx`
Hook for detecting mobile devices and responsive behavior.

#### `src/components/ui/use-toast.ts`
Toast hook re-export for consistent importing.

## 🔧 Key Features

### 1. EFT Tapping Assistant
- **Guided Sessions**: Step-by-step tapping instruction
- **Adaptive Content**: Statements adjust based on user input and round number
- **Progress Tracking**: Intensity monitoring throughout sessions
- **Multiple Rounds**: Continues until significant improvement or completion

### 2. Health Assessment
- **PHQ-9 Integration**: Standardized depression screening
- **Risk Detection**: Identifies users who may need professional help
- **Crisis Intervention**: Direct links to mental health resources

### 3. Personalized Experience
- **Custom Advice**: Tailored recommendations based on progress
- **Session History**: Persistent storage of past sessions
- **Adaptive Flow**: Different paths for different risk levels

### 4. Professional Design
- **Responsive Layout**: Works on all device sizes
- **Accessibility**: Proper contrast, labels, and navigation
- **Modern UI**: Clean design with gradient accents and smooth animations

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## 🔮 Future Enhancements

- **Supabase Integration**: User authentication and data persistence
- **Advanced Analytics**: Progress tracking over time
- **Social Features**: Sharing progress with support networks
- **Therapist Integration**: Professional oversight and guidance
- **Mobile App**: Native mobile application

## 🎨 Design System

The application uses a consistent design system with:
- **Primary Color**: `#94c11f` (green accent)
- **Gradients**: Blue to green transitions
- **Typography**: Clean, readable fonts with proper hierarchy
- **Spacing**: Consistent padding and margins using Tailwind classes
- **Components**: Shadcn/ui for consistent, accessible components

## 🧠 EFT Tapping Process

The application implements a complete EFT tapping workflow:

1. **Problem Identification**: User describes their anxiety trigger
2. **Emotional Mapping**: Identifies specific feelings and body locations
3. **Intensity Rating**: 0-10 scale assessment
4. **Setup Statements**: Three personalized affirmations
5. **Tapping Sequence**: Eight specific acupressure points
6. **Progress Check**: Re-assessment of intensity
7. **Iterative Rounds**: Continues until satisfactory improvement
8. **Personalized Advice**: Custom guidance based on results

This systematic approach ensures users receive comprehensive support for anxiety management through evidence-based EFT techniques.
