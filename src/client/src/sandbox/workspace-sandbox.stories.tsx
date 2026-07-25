import type { Meta, StoryObj } from '@storybook/react';
import { TestWorkspace } from './test-wokspace';

const meta: Meta<typeof TestWorkspace> = {
  title: 'Playground/Workspace Sandbox',
  component: TestWorkspace,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof TestWorkspace>;

export const Default: Story = {};