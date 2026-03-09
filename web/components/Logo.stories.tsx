import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from '@storybook/test';
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

/**
 * Visual regression test: Default state.
 * Ensures logo renders correctly and maintains visual stability.
 */
export const VisualRegression: Story = {
  render: () => <Logo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const logo = canvas.getByRole('img', { hidden: true });

    // Verify logo is rendered
    expect(logo).toBeInTheDocument();

    // Visual snapshot for regression testing
    await new Promise(resolve => setTimeout(resolve, 300));
  },
};

/**
 * A11y: Image alt text and semantic structure.
 * Verifies logo has proper accessibility attributes.
 */
export const A11yImageAccessibility: Story = {
  render: () => <Logo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check for accessible image
    const images = canvas.queryAllByRole('img', { hidden: true });

    // Verify images have proper attributes
    images.forEach((img) => {
      // Image should have alt text or be decorative
      const hasAlt = img.hasAttribute('alt');
      const isDecorative = img.hasAttribute('aria-hidden');

      expect(hasAlt || isDecorative).toBe(true);
    });
  },
};
