// works for both side panel and parameters panel

import { useState, useRef, useCallback, useEffect, useMemo, memo } from 'react';
import throttle from 'lodash/throttle';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { getConfigDefaults } from 'librechat-data-provider';
import {
  ResizableHandleAlt,
  ResizablePanel,
  ResizablePanelGroup,
  useMediaQuery,
} from '@librechat/client';
import type { ImperativePanelHandle } from 'react-resizable-panels';
import { useGetStartupConfig } from '~/data-provider';
import { normalizeLayout } from '~/utils';
import SidePanel from './SidePanel';
import ParametersPanelContent from '~/components/Chat/ParametersPanelContent';
import store from '~/store';

interface SidePanelProps {
  defaultLayout?: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize?: number;
  fullPanelCollapse?: boolean;
  artifacts?: React.ReactNode;
  children: React.ReactNode;
}

const defaultMinSize = 20;
const defaultInterface = getConfigDefaults().interface;

const SidePanelGroup = memo(
  ({
    defaultLayout = [97, 3],
    defaultCollapsed = false,
    fullPanelCollapse = false,
    navCollapsedSize = 3,
    artifacts,
    children,
  }: SidePanelProps) => {
    const { data: startupConfig } = useGetStartupConfig();
    const interfaceConfig = useMemo(
      () => startupConfig?.interface ?? defaultInterface,
      [startupConfig],
    );

    const panelRef = useRef<ImperativePanelHandle>(null);
    const [minSize, setMinSize] = useState(defaultMinSize);
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
    const [fullCollapse, setFullCollapse] = useState(fullPanelCollapse);
    const [collapsedSize, setCollapsedSize] = useState(navCollapsedSize);

    const isSmallScreen = useMediaQuery('(max-width: 767px)');
    const hideSidePanel = useRecoilValue(store.hideSidePanel);
    const showParameters = useRecoilValue(store.showParametersDrawer);
    const setShowParameters = useSetRecoilState(store.showParametersDrawer);

    const calculateLayout = useCallback(() => {
      if (artifacts == null) {
        if (showParameters) {
          // Parameters only: [main, parameters]
          const paramsSize = defaultLayout.length === 2 ? defaultLayout[1] : defaultLayout[2];
          return [100 - paramsSize, paramsSize];
        } else {
          // Side panel only: [main, nav]
          const navSize = defaultLayout.length === 2 ? defaultLayout[1] : defaultLayout[2];
          return [100 - navSize, navSize];
        }
      } else {
        // Artifacts are open
        if (showParameters) {
          // Artifacts + Parameters: [main, artifacts, parameters]
          const remainingSpace = 100;
          const newMainSize = Math.floor(remainingSpace / 3);
          const artifactsSize = Math.floor(remainingSpace / 3);
          const paramsSize = remainingSpace - newMainSize - artifactsSize;
          return [newMainSize, artifactsSize, paramsSize];
        } else {
          // Artifacts only: [main, artifacts, nav=0]
          const navSize = 0;
          const remainingSpace = 100 - navSize;
          const newMainSize = Math.floor(remainingSpace / 2);
          const artifactsSize = remainingSpace - newMainSize;
          return [newMainSize, artifactsSize, navSize];
        }
      }
    }, [artifacts, defaultLayout, showParameters]);

    const currentLayout = useMemo(() => normalizeLayout(calculateLayout()), [calculateLayout]);

    const throttledSaveLayout = useMemo(
      () =>
        throttle((sizes: number[]) => {
          const normalizedSizes = normalizeLayout(sizes);
          localStorage.setItem('react-resizable-panels:layout', JSON.stringify(normalizedSizes));
        }, 350),
      [],
    );

    useEffect(() => {
      if (isSmallScreen) {
        setIsCollapsed(true);
        setCollapsedSize(0);
        setMinSize(defaultMinSize);
        setFullCollapse(true);
        localStorage.setItem('fullPanelCollapse', 'true');
        panelRef.current?.collapse();
        return;
      } else {
        setIsCollapsed(defaultCollapsed);
        setCollapsedSize(navCollapsedSize);
        setMinSize(defaultMinSize);
      }
    }, [isSmallScreen, defaultCollapsed, navCollapsedSize, fullPanelCollapse]);

    // Close parameters panel when artifacts FIRST open (like side panel does)
    // But allow reopening parameters while artifacts are open (they'll coexist)
    const prevArtifactsRef = useRef(artifacts);
    useEffect(() => {
      // Only close if artifacts just opened (changed from null to non-null) AND parameters is open
      if (artifacts != null && prevArtifactsRef.current == null && showParameters) {
        setShowParameters(false);
      }
      prevArtifactsRef.current = artifacts;
    }, [artifacts, showParameters, setShowParameters]);

    const minSizeMain = useMemo(() => (artifacts != null ? 15 : 30), [artifacts]);

    /** Memoized close button handler to prevent re-creating it */
    const handleClosePanel = useCallback(() => {
      setIsCollapsed(() => {
        localStorage.setItem('fullPanelCollapse', 'true');
        setFullCollapse(true);
        setCollapsedSize(0);
        setMinSize(0);
        return false;
      });
      panelRef.current?.collapse();
    }, []);

    return (
      <>
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes) => throttledSaveLayout(sizes)}
          className="transition-width relative h-full w-full flex-1 overflow-auto bg-presentation"
        >
          <ResizablePanel
            defaultSize={currentLayout[0]}
            minSize={minSizeMain}
            order={1}
            id="messages-view"
          >
            {children}
          </ResizablePanel>
          {artifacts != null && (
            <>
              <ResizableHandleAlt withHandle className="ml-3 bg-border-medium text-text-primary" />
              <ResizablePanel
                defaultSize={currentLayout[1]}
                minSize={minSizeMain}
                order={2}
                id="artifacts-panel"
              >
                {artifacts}
              </ResizablePanel>
            </>
          )}
          {showParameters && (
            <>
              <ResizableHandleAlt withHandle className="ml-3 bg-border-medium text-text-primary" />
              <ResizablePanel
                defaultSize={artifacts != null ? currentLayout[2] : currentLayout[1]}
                minSize={minSizeMain}
                order={artifacts != null ? 3 : 2}
                id="parameters-panel"
              >
                <ParametersPanelContent />
              </ResizablePanel>
            </>
          )}
          {!hideSidePanel && !showParameters && interfaceConfig.sidePanel === true && (
            <SidePanel
              panelRef={panelRef}
              minSize={minSize}
              setMinSize={setMinSize}
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              collapsedSize={collapsedSize}
              setCollapsedSize={setCollapsedSize}
              fullCollapse={fullCollapse}
              setFullCollapse={setFullCollapse}
              defaultSize={currentLayout[currentLayout.length - 1]}
              hasArtifacts={artifacts != null}
              interfaceConfig={interfaceConfig}
            />
          )}
        </ResizablePanelGroup>
        <button
          aria-label="Close right side panel"
          className={`nav-mask ${!isCollapsed ? 'active' : ''}`}
          onClick={handleClosePanel}
        />
      </>
    );
  },
);

SidePanelGroup.displayName = 'SidePanelGroup';

export default SidePanelGroup;
