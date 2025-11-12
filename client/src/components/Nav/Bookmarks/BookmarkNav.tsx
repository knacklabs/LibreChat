import { useMemo, useState } from 'react';
import type { FC } from 'react';
import type { TConversationTag } from 'librechat-data-provider';
import { TooltipAnchor } from '@librechat/client';
import { Menu, MenuButton, MenuItems } from '@headlessui/react';
import { BookmarkFilledIcon, BookmarkIcon } from '@radix-ui/react-icons';
import { BookmarkContext } from '~/Providers/BookmarkContext';
import { useGetConversationTags } from '~/data-provider';
import { EditBookmarkDialog, DeleteBookmarkDialog } from './BookmarkDialogs';
import BookmarkNavItems from './BookmarkNavItems';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

type BookmarkNavProps = {
  tags: string[];
  setTags: (tags: string[]) => void;
  isSmallScreen: boolean;
};

const BookmarkNav: FC<BookmarkNavProps> = ({ tags, setTags, isSmallScreen }: BookmarkNavProps) => {
  const localize = useLocalize();
  const { data } = useGetConversationTags();
  const [editingBookmark, setEditingBookmark] = useState<TConversationTag | null>(null);
  const [deletingBookmark, setDeletingBookmark] = useState<string | null>(null);
  const label = useMemo(
    () => (tags.length > 0 ? tags.join(', ') : localize('com_ui_bookmarks')),
    [tags, localize],
  );

  return (
    <>
    <Menu as="div" className="group relative">
      {({ open }) => (
        <>
          <TooltipAnchor
            description={label}
            render={
              <MenuButton
                id="bookmark-menu-button"
                aria-label={localize('com_ui_bookmarks')}
                className={cn(
                  'flex items-center justify-center',
                  'size-10 border-none text-text-primary hover:bg-accent hover:text-accent-foreground',
                  'rounded-full border-none p-2 hover:bg-surface-hover md:rounded-xl',
                  open ? 'bg-surface-hover' : '',
                )}
                data-testid="bookmark-menu"
              >
                {tags.length > 0 ? (
                  <BookmarkFilledIcon className="icon-lg text-text-primary" aria-hidden="true" />
                ) : (
                  <BookmarkIcon className="icon-lg text-text-primary" aria-hidden="true" />
                )}
              </MenuButton>
            }
          />
          <MenuItems
            anchor="bottom"
            className="absolute left-0 top-full z-[100] mt-1 w-60 translate-y-0 overflow-hidden rounded-lg bg-surface-secondary p-1.5 shadow-lg outline-none"
          >
            {data && (
              <BookmarkContext.Provider value={{ bookmarks: data.filter((tag) => tag.count > 0) }}>
                <BookmarkNavItems
                  // List of selected tags(string)
                  tags={tags}
                  // When a user selects a tag, this `setTags` function is called to refetch the list of conversations for the selected tag
                  setTags={setTags}
                  onEditBookmark={setEditingBookmark}
                  onDeleteBookmark={setDeletingBookmark}
                />
              </BookmarkContext.Provider>
            )}
          </MenuItems>
        </>
      )}
    </Menu>
    {/* Render dialogs outside Menu - they auto-open and call onClose when done */}
    {editingBookmark && (
      <EditBookmarkDialog
        bookmark={editingBookmark}
        onClose={() => setEditingBookmark(null)}
      />
    )}
    {deletingBookmark && (
      <DeleteBookmarkDialog
        bookmark={deletingBookmark}
        onClose={() => setDeletingBookmark(null)}
      />
    )}
    </>
  );
};

export default BookmarkNav;
