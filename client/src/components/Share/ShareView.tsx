import { memo, useState } from 'react';
import { Spinner } from '@librechat/client';
import { useParams, useNavigate } from 'react-router-dom';
import { buildTree } from 'librechat-data-provider';
import { useGetSharedMessages } from 'librechat-data-provider/react-query';
import { useLocalize, useDocumentTitle, useAuthContext } from '~/hooks';
import { useGetStartupConfig, useContinueSharedConversationMutation } from '~/data-provider';
import { ShareContext } from '~/Providers';
import MessagesView from './MessagesView';
import Footer from '../Chat/Footer';

function SharedView() {
  const localize = useLocalize();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { data: config } = useGetStartupConfig();
  const { shareId } = useParams();
  const { data, isLoading } = useGetSharedMessages(shareId ?? '');
  const dataTree = data && buildTree({ messages: data.messages });
  const messagesTree = dataTree?.length === 0 ? null : (dataTree ?? null);

  const [isContinuing, setIsContinuing] = useState(false);
  const continueMutation = useContinueSharedConversationMutation();

  // Check if user is authenticated and continuation is allowed

  const handleContinueConversation = async () => {
    if (!shareId || !isAuthenticated) return;

    setIsContinuing(true);
    try {
      const result = await continueMutation.mutateAsync({ shareId });
      // Navigate to the new conversation
      navigate(`/c/${result.conversationId}`);
    } catch (error) {
      console.error('Error continuing conversation:', error);
      // TODO: Show error notification
    } finally {
      setIsContinuing(false);
    }
  };

  // configure document title
  let docTitle = '';
  if (config?.appTitle != null && data?.title != null) {
    docTitle = `${data.title} | ${config.appTitle}`;
  } else {
    docTitle = data?.title ?? config?.appTitle ?? document.title;
  }

  useDocumentTitle(docTitle);

  let content: JSX.Element;
  if (isLoading) {
    content = (
      <div className="flex h-screen items-center justify-center">
        <Spinner className="" />
      </div>
    );
  } else if (data && messagesTree && messagesTree.length !== 0) {
    content = (
      <>
        <div className="final-completion group mx-auto flex min-w-[40rem] flex-col gap-3 pb-6 pt-4 md:max-w-[47rem] md:px-5 lg:px-1 xl:max-w-[55rem] xl:px-5">
          <h1 className="text-4xl font-bold">{data.title}</h1>
          <div className="border-b border-border-medium pb-6 text-base text-text-secondary">
            {new Date(data.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>

        <MessagesView messagesTree={messagesTree} conversationId={data.conversationId} />
      </>
    );
  } else {
    content = (
      <div className="flex h-screen items-center justify-center">
        {localize('com_ui_shared_link_not_found')}
      </div>
    );
  }

  return (
    <ShareContext.Provider value={{ isSharedConvo: true }}>
      <main
        className="relative flex w-full grow overflow-hidden dark:bg-surface-secondary"
        style={{ paddingBottom: '50px' }}
      >
        <div className="transition-width relative flex h-full w-full flex-1 flex-col items-stretch overflow-hidden pt-0 dark:bg-surface-secondary">
          <div className="flex h-full flex-col text-text-primary" role="presentation">
            {content}
            
            {/* Sticky Continue Chat Button - Fixed position outside content flow */}
            {isAuthenticated && data && messagesTree && messagesTree.length !== 0 && (
              <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center pointer-events-none">
                <div className="pointer-events-auto rounded-lg  shadow-lg ">
                  <button
                    onClick={handleContinueConversation}
                    disabled={isContinuing}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isContinuing ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Continuing...
                      </>
                    ) : (
                      'Continue chat'
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <div className="w-full border-t-0 pl-0 pt-2 md:w-[calc(100%-.5rem)] md:border-t-0 md:border-transparent md:pl-0 md:pt-0 md:dark:border-transparent">
              <Footer className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-gradient-to-t from-surface-secondary to-transparent px-2 pb-2 pt-8 text-xs text-text-secondary md:px-[60px]" />
            </div>
          </div>
        </div>
      </main>
    </ShareContext.Provider>
  );
}

export default memo(SharedView);
