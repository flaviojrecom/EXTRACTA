import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './Logo';

const meta = {
  title: 'Components/Logo',
  component: Logo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'EXTRACTA logo component featuring the branded icon and logotype. ' +
          'Displays the application name with tagline and gradient background styling.',
      },
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default logo display.
 * Shows the full EXTRACTA branding with icon and text.
 */
export const Default: Story = {
  render: () => <Logo />,
};

/**
 * Logo in light background context.
 * Tests visibility and contrast against light surfaces.
 */
export const LightBackground: Story = {
  render: () => <Logo />,
  decorators: [
    (Story) => (
      <div className="bg-white p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

/**
 * Logo in dark background context.
 * Tests visibility against dark surfaces.
 */
export const DarkBackground: Story = {
  render: () => <Logo />,
  decorators: [
    (Story) => (
      <div className="bg-zinc-950 p-8 rounded-lg">
        <Story />
      </div>
    ),
  ],
};

/**
 * Logo in compact layout.
 * Tests spacing and size constraints.
 */
export const CompactLayout: Story = {
  render: () => (
    <div className="w-64">
      <Logo />
    </div>
  ),
};

/**
 * Logo in expanded layout.
 * Tests scaling and proportions in larger context.
 */
export const ExpandedLayout: Story = {
  render: () => (
    <div className="w-full max-w-2xl">
      <Logo />
    </div>
  ),
};
