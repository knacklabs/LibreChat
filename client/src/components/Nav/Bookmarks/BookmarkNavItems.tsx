import { type FC, useState, useMemo } from 'react';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { Input } from '@librechat/client';
import type { TConversationTag } from 'librechat-data-provider';
import { BookmarkContext, useBookmarkContext } from '~/Providers/BookmarkContext';
import { BookmarkItems, BookmarkItem, DeleteBookmarkButton, EditBookmarkButton } from '~/components/Bookmarks';
import { useLocalize } from '~/hooks';

const BookmarkNavItems: FC<{
  tags: string[];
  setTags: (tags: string[]) => void;
  onEditBookmark?: (bookmark: TConversationTag) => void;
  onDeleteBookmark?: (bookmarkTag: string) => void;
}> = ({ tags = [], setTags, onEditBookmark, onDeleteBookmark }) => {
  const { bookmarks } = useBookmarkContext();
  const localize = useLocalize();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = useMemo(() => {
    if (!searchQuery.trim()) {
      return bookmarks;
    }
    return bookmarks.filter((bookmark) =>
      bookmark.tag.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [bookmarks, searchQuery]);

  const getUpdatedSelected = (tag: string) => {
    if (tags.some((selectedTag) => selectedTag === tag)) {
      return tags.filter((selectedTag) => selectedTag !== tag);
    } else {
      return [...tags, tag];
    }
  };

  const handleSubmit = (tag?: string) => {
    if (tag === undefined) {
      return;
    }
    const updatedSelected = getUpdatedSelected(tag);
    setTags(updatedSelected);
    return;
  };

  const clear = () => {
    setTags([]);
    return;
  };

  const renderActions = (bookmark: TConversationTag) => {
    if (!onEditBookmark && !onDeleteBookmark) {
      // Fallback to original buttons if callbacks not provided
      return (
        <>
          <EditBookmarkButton bookmark={bookmark} tabIndex={0} />
          <DeleteBookmarkButton bookmark={bookmark.tag} tabIndex={0} />
        </>
      );
    }

    // Render simple icon buttons that just call callbacks
    return (
      <>
        {onEditBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditBookmark(bookmark);
            }}
            className="h-8 w-8 p-0 flex items-center justify-center hover:bg-surface-hover rounded"
            aria-label="Edit bookmark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        {onDeleteBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteBookmark(bookmark.tag);
            }}
            className="h-8 w-8 p-0 flex items-center justify-center hover:bg-surface-hover rounded"
            aria-label="Delete bookmark"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </>
    );
  };

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col">
        <BookmarkItem
          tag={localize('com_ui_clear_all')}
          data-testid="bookmark-item-clear"
          handleSubmit={clear}
          selected={false}
          icon={<CrossCircledIcon className="size-4" />}
        />
        <BookmarkItem
          tag={localize('com_ui_no_bookmarks')}
          data-testid="bookmark-item-no-bookmarks"
          handleSubmit={() => Promise.resolve()}
          selected={false}
          icon={'🤔'}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Search/Filter Input with Clear All button */}
      <div className="flex items-center gap-2 px-2 pb-2 border-b border-border-light">
        <Input
          placeholder={localize('com_ui_bookmarks_filter')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 text-sm flex-1"
          aria-label={localize('com_ui_bookmarks_filter')}
        />
        {tags.length > 0 && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors whitespace-nowrap"
            aria-label={localize('com_ui_clear_all')}
            data-testid="bookmark-clear-all"
          >
            <CrossCircledIcon className="size-3.5" />
            {localize('com_ui_clear_all')}
          </button>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="py-1">
        <BookmarkContext.Provider value={{ bookmarks: filteredBookmarks }}>
          <BookmarkItems
            tags={tags}
            handleSubmit={handleSubmit}
            header={null}
            renderActions={renderActions}
          />
        </BookmarkContext.Provider>
      </div>

      {/* No results message */}
      {searchQuery && filteredBookmarks.length === 0 && (
        <div className="px-2 py-3 text-center text-sm text-text-secondary">
          {localize('com_ui_no_results_found')}
        </div>
      )}
    </div>
  );
};

export default BookmarkNavItems;
