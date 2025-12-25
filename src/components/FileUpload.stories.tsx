import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { FileUpload } from './FileUpload';

/**
 * FileUpload component allows users to upload CSV files via drag-and-drop
 * or by clicking to browse. It validates that the file is a CSV before
 * processing and provides visual feedback during drag operations.
 */
const meta = {
  title: 'Components/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Shows loading state and disables interaction',
    },
  },
  args: {
    onFileLoaded: fn(),
    onError: fn(),
  },
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state - ready to accept file uploads
 */
export const Default: Story = {
  args: {
    isLoading: false,
  },
};

/**
 * Loading state - shown while processing an uploaded file
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
