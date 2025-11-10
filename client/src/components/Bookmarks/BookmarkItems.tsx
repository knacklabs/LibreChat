import type { FC } from 'react';
import type { TConversationTag } from 'librechat-data-provider';
import { useBookmarkContext } from '~/Providers/BookmarkContext';
import BookmarkItem from './BookmarkItem';
interface BookmarkItemsProps {
  tags: string[];
  handleSubmit: (tag?: string) => void;
  header: React.ReactNode;
  renderActions?: (bookmark: TConversationTag) => React.ReactNode;
}

const BookmarkItems: FC<BookmarkItemsProps> = ({ tags, handleSubmit, header, renderActions }) => {
  const { bookmarks } = useBookmarkContext();

  return (
    <>
      {header}
      {bookmarks.length > 0 && <div className="my-1.5 h-px" role="none" />}
      {bookmarks.map((bookmark, i) => (
        <BookmarkItem
          key={`${bookmark._id ?? bookmark.tag}-${i}`}
          tag={bookmark.tag}
          selected={tags.includes(bookmark.tag)}
          handleSubmit={handleSubmit}
          actions={renderActions?.(bookmark)}
        />
      ))}
    </>
  );
};

export default BookmarkItems;
