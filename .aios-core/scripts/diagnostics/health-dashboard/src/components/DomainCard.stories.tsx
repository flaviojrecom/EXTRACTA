import type { Meta, StoryObj } from '@storybook/react';
import DomainCard from './DomainCard';

const meta = {
  title: 'DomainCard',
  component: DomainCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Card component for displaying domain or service information. ' +
          'Shows status, health metrics, and provides click handling for interactions.',
      },
    },
  },
  argTypes: {
    domain: {
      control: false,
      description: 'Domain/service object with name, status, and metrics',
      table: { type: { summary: 'object' } },
    },
    onClick: {
      control: false,
      description: 'Callback when card is clicked',
      table: { type: { summary: 'function' } },
    },
  },
} satisfies Meta<typeof DomainCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const healthyData = {
  score: 95,
  status: 'healthy',
  checks: [
    { status: 'passed', severity: 'low' },
    { status: 'passed', severity: 'low' },
    { status: 'passed', severity: 'low' },
  ],
};

const atRiskData = {
  score: 72,
  status: 'at-risk',
  checks: [
    { status: 'passed', severity: 'low' },
    { status: 'passed', severity: 'low' },
    { status: 'failed', severity: 'medium' },
  ],
};

const criticalData = {
  score: 45,
  status: 'critical',
  checks: [
    { status: 'passed', severity: 'low' },
    { status: 'failed', severity: 'critical' },
    { status: 'failed', severity: 'high' },
  ],
};

/**
 * Healthy domain card.
 * Shows domain in good operational state.
 */
export const Healthy: Story = {
  args: {
    domain: 'project',
    data: healthyData,
  },
};

/**
 * At-risk domain card.
 * Shows domain needing attention.
 */
export const AtRisk: Story = {
  args: {
    domain: 'local',
    data: atRiskData,
  },
};

/**
 * Critical domain card.
 * Shows domain with failures or issues.
 */
export const Critical: Story = {
  args: {
    domain: 'deployment',
    data: criticalData,
  },
};

/**
 * Interactive domain card.
 * Demonstrates click handling.
 */
export const Interactive: Story = {
  args: {
    domain: 'repository',
    data: healthyData,
  },
};

/**
 * Gallery of domain cards.
 * Shows multiple domains with different statuses.
 */
export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8">
      <DomainCard domain="project" data={healthyData} />
      <DomainCard domain="local" data={atRiskData} />
      <DomainCard domain="deployment" data={criticalData} />
    </div>
  ),
};
