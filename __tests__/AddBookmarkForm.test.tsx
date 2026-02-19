/**
 * Component tests for AddBookmarkForm
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddBookmarkForm from '@/components/AddBookmarkForm';

const noop = async () => {};

describe('AddBookmarkForm', () => {
  it('renders URL and title inputs', () => {
    render(<AddBookmarkForm onAdd={noop} isAdding={false} error={null} onClearError={noop} />);
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
  });

  it('has a disabled submit button when fields are empty', () => {
    render(<AddBookmarkForm onAdd={noop} isAdding={false} error={null} onClearError={noop} />);
    const btn = screen.getByRole('button', { name: /save bookmark/i });
    expect(btn).toBeDisabled();
  });

  it('enables submit button when both fields are filled', async () => {
    const user = userEvent.setup();
    render(<AddBookmarkForm onAdd={noop} isAdding={false} error={null} onClearError={noop} />);

    await user.type(screen.getByLabelText(/url/i), 'https://example.com');
    await user.type(screen.getByLabelText(/title/i), 'Example');

    expect(screen.getByRole('button', { name: /save bookmark/i })).not.toBeDisabled();
  });

  it('calls onAdd with url and title on submit', async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AddBookmarkForm onAdd={onAdd} isAdding={false} error={null} onClearError={noop} />);

    await user.type(screen.getByLabelText(/url/i), 'https://example.com');
    await user.type(screen.getByLabelText(/title/i), 'Example Site');
    await user.click(screen.getByRole('button', { name: /save bookmark/i }));

    expect(onAdd).toHaveBeenCalledWith('https://example.com', 'Example Site');
  });

  it('shows error message when error prop is set', () => {
    render(
      <AddBookmarkForm
        onAdd={noop}
        isAdding={false}
        error="Invalid URL"
        onClearError={noop}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid URL');
  });

  it('shows loading state when isAdding is true', () => {
    render(<AddBookmarkForm onAdd={noop} isAdding={true} error={null} onClearError={noop} />);
    expect(screen.getByRole('button')).toHaveTextContent(/saving/i);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('inputs are disabled when isAdding is true', () => {
    render(<AddBookmarkForm onAdd={noop} isAdding={true} error={null} onClearError={noop} />);
    expect(screen.getByLabelText(/url/i)).toBeDisabled();
    expect(screen.getByLabelText(/title/i)).toBeDisabled();
  });

  it('clears error when user types in url field', async () => {
    const onClearError = jest.fn();
    const user = userEvent.setup();

    render(
      <AddBookmarkForm
        onAdd={noop}
        isAdding={false}
        error="Some error"
        onClearError={onClearError}
      />
    );

    await user.type(screen.getByLabelText(/url/i), 'a');
    expect(onClearError).toHaveBeenCalled();
  });

  it('clears form after successful submission', async () => {
    const onAdd = jest.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<AddBookmarkForm onAdd={onAdd} isAdding={false} error={null} onClearError={noop} />);

    const urlInput = screen.getByLabelText(/url/i);
    const titleInput = screen.getByLabelText(/title/i);

    await user.type(urlInput, 'https://example.com');
    await user.type(titleInput, 'Test Site');
    await user.click(screen.getByRole('button', { name: /save bookmark/i }));

    await waitFor(() => {
      expect(urlInput).toHaveValue('');
      expect(titleInput).toHaveValue('');
    });
  });
});
