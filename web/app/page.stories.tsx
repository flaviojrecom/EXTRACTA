import type { Meta, StoryObj } from '@storybook/react';
import Home from './page';

const meta = {
  title: 'Pages/Home',
  component: Home,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'EXTRACTA Home Page - AI-Powered Knowledge Extraction. ' +
          'Main landing page for document processing and knowledge management.',
      },
    },
  },
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default home page.
 * Shows the initial state ready for file upload.
 */
export const Default: Story = {
  render: () => <Home />,
};

/**
 * Note: The Home component is large (718 LOC) and includes:
 * - File upload zone
 * - Preset selector
 * - Processing pipeline
 * - Results display
 * - Error handling
 *
 * RECOMMENDATION: Before extensively testing, refactor Home into smaller components:
 * - UploadZone.tsx
 * - PresetSelector.tsx
 * - ProcessButton.tsx
 * - PipelineProgress.tsx
 * - ResultsDisplay.tsx
 *
 * This will improve:
 * - Story testability
 * - Component reusability
 * - Maintainability
 * - Coverage measurement
 */
