import { type FC } from 'react';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import type { TConversationTag } from 'librechat-data-provider';
import { useBookmarkContext } from '~/Providers/BookmarkContext';
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
      <BookmarkItems
        tags={tags}
        handleSubmit={handleSubmit}
        renderActions={renderActions}
        header={
          <BookmarkItem
            tag={localize('com_ui_clear_all')}
            data-testid="bookmark-item-clear"
            handleSubmit={clear}
            selected={false}
            icon={<CrossCircledIcon className="size-4" />}
          />
        }
      />
    </div>
  );
};

export default BookmarkNavItems;
