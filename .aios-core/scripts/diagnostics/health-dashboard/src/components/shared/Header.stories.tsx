import type { Meta, StoryObj } from '@storybook/react';
import Header from './Header';

const meta = {
  title: 'Shared/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A header component for displaying page or section titles with optional subtitles. ' +
          'Provides consistent styling and hierarchy for page headers and section dividers.',
      },
    },
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title text to display',
      table: { type: { summary: 'string' } },
    },
    subtitle: {
      control: 'text',
      description: 'Optional subtitle text displayed below the title',
      table: { type: { summary: 'string', default: 'undefined' } },
    },
  },
  args: {
    title: 'Page Title',
    subtitle: 'This is a subtitle',
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default header with title and subtitle.
 * Standard usage for page headers.
 */
export const Default: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Overview of system health and metrics',
  },
};

/**
 * Header with title only.
 * Minimal header for simple section dividers.
 */
export const TitleOnly: Story = {
  args: {
    title: 'Components',
    subtitle: undefined,
  },
};

/**
 * Header with long title.
 * Tests header behavior with extended title text.
 */
export const LongTitle: Story = {
  args: {
    title: 'System Performance Analysis and Monitoring Dashboard',
    subtitle: 'Real-time metrics and health indicators',
  },
};

/**
 * Header with long subtitle.
 * Tests header behavior with extended subtitle text.
 */
export const LongSubtitle: Story = {
  args: {
    title: 'Agents',
    subtitle:
      'View and manage all autonomous AI agents running in the system. ' +
      'Monitor their performance, health status, and recent activity.',
  },
};

/**
 * Gallery showing different header styles.
 * Demonstrates header usage in different contexts.
 */
export const Gallery: Story = {
  render: () => (
    <div className="bg-zinc-950 space-y-8">
      <Header title="Main Dashboard" subtitle="System overview" />
      <Header title="Analytics" />
      <Header
        title="Advanced Settings"
        subtitle="Configure system parameters and preferences"
      />
    </div>
  ),
};
