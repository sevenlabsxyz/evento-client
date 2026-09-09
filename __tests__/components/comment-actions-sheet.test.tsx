import { render, screen } from '@testing-library/react';

import { CommentActionsSheet } from '@/components/event-detail/comment-actions-sheet';

jest.mock('@/components/ui/detached-menu-sheet', () => ({
  __esModule: true,
  default: ({ options }: { options: Array<{ id: string; label: string }> }) => (
    <div>
      {options.map((option) => (
        <span key={option.id}>{option.label}</span>
      ))}
    </div>
  ),
}));

describe('CommentActionsSheet', () => {
  it('shows delete without edit for host moderation', () => {
    render(
      <CommentActionsSheet
        isOpen
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        canEdit={false}
        canDelete
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('shows both actions to the author', () => {
    render(
      <CommentActionsSheet
        isOpen
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        canEdit
        canDelete
      />
    );

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});
