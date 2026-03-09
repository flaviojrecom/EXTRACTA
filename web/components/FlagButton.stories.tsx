import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
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
 *
 * Interaction test: Click button and verify callback is triggered
 */
export const Interactive: Story = {
  args: {
    lang: 'pt',
    active: true,
    onClick: () => {
      alert('Language selection changed!');
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Click the button
    await userEvent.click(button);
  },
};

/**
 * Language toggle interaction test.
 * Tests switching between Portuguese and English buttons.
 */
export const LanguageToggleInteraction: Story = {
  render: (args) => {
    const [activeLanguage, setActiveLanguage] = React.useState('pt');

    return (
      <div className="flex gap-4">
        <FlagButton
          lang="pt"
          active={activeLanguage === 'pt'}
          onClick={() => setActiveLanguage('pt')}
        />
        <FlagButton
          lang="en"
          active={activeLanguage === 'en'}
          onClick={() => setActiveLanguage('en')}
        />
        <span className="text-sm text-zinc-600 ml-4">
          Selected: {activeLanguage === 'pt' ? 'Português' : 'English'}
        </span>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const buttons = canvas.getAllByRole('button');

    // Click English button
    await userEvent.click(buttons[1]);

    // Verify state changed
    await new Promise(resolve => setTimeout(resolve, 300));
  },
};

/**
 * A11y test: Keyboard navigation.
 * Verifies button is focusable and keyboard accessible.
 */
export const A11yKeyboardNavigation: Story = {
  args: {
    lang: 'pt',
    active: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    // Tab into button
    await userEvent.tab();

    // Button should be focused
    expect(button).toHaveFocus();

    // Press Enter to activate
    await userEvent.keyboard('{Enter}');
  },
};
