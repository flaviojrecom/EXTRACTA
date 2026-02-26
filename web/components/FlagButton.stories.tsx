import type { Meta, StoryObj } from '@storybook/react';
import { FlagButton } from './FlagButton';

const meta = {
  title: 'Components/FlagButton',
  component: FlagButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Language toggle button with flag icons. Supports Portuguese (BR) and English. ' +
          'Displays active state with ring and scale animations.',
      },
    },
  },
  argTypes: {
    lang: {
      control: 'radio',
      options: ['pt', 'en'],
      description: 'Language code',
      table: { type: { summary: "'pt' | 'en'" } },
    },
    active: {
      control: 'boolean',
      description: 'Whether the button is currently active/selected',
      table: { type: { summary: 'boolean' } },
    },
    onClick: {
      control: false,
      description: 'Callback when button is clicked',
      table: { type: { summary: '() => void' } },
    },
  },
  args: {
    lang: 'pt',
    active: false,
    onClick: () => {},
  },
} satisfies Meta<typeof FlagButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Portuguese (Brazil) flag button - inactive state.
 * Default appearance when not selected.
 */
export const PortugueseInactive: Story = {
  args: {
    lang: 'pt',
    active: false,
  },
};

/**
 * Portuguese (Brazil) flag button - active state.
 * Displays highlight ring and scale effect.
 */
export const PortugueseActive: Story = {
  args: {
    lang: 'pt',
    active: true,
  },
};

/**
 * English flag button - inactive state.
 * Default appearance when not selected.
 */
export const EnglishInactive: Story = {
  args: {
    lang: 'en',
    active: false,
  },
};

/**
 * English flag button - active state.
 * Displays highlight ring and scale effect.
 */
export const EnglishActive: Story = {
  args: {
    lang: 'en',
    active: true,
  },
};

/**
 * Language toggle buttons gallery.
 * Shows both language options in their active and inactive states.
 */
export const LanguageToggleGallery: Story = {
  render: () => (
    <div className="flex gap-6 p-8 bg-zinc-900 rounded-lg">
      <div className="flex flex-col items-center gap-2">
        <FlagButton lang="pt" active={true} onClick={() => {}} />
        <span className="text-xs text-zinc-400">Portuguese (Active)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <FlagButton lang="en" active={false} onClick={() => {}} />
        <span className="text-xs text-zinc-400">English (Inactive)</span>
      </div>
    </div>
  ),
};

/**
 * Interactive button with click handler.
 * Demonstrates state management with button clicks.
 */
export const Interactive: Story = {
  args: {
    lang: 'pt',
    active: true,
    onClick: () => {
      alert('Language selection changed!');
    },
  },
};
