import React, { useReducer } from "react";
import './TabScroller.css'

export function TabScroller({tabScrollerId, tabs}) {

    const [, forceUpdate] = useReducer(x => !x, false);

    const shownTabs = tabs.filter(tab => tab.showTab());

    const localStorageIndexConstant = "TAB_SCROLLER_" + tabScrollerId + "_INDEX";

    const tabIndexAsString = localStorage.getItem(localStorageIndexConstant);
    let tabIndex = tabIndexAsString ? parseInt(tabIndexAsString) : 0;
    if (tabIndex < 0) {
        tabIndex = 0;
    }
    if (tabIndex >= shownTabs.length) {
        tabIndex = shownTabs.length - 1;
    }

    const currentTab = shownTabs[tabIndex];
    const tabContent = currentTab.generateTab();

    const tabHeaders = [];
    if (tabIndex > 1) {
        // There's a previous tab to the previous tab.
        tabHeaders.push(<div className="tabScrollerTabPrevious tabScrollerTabOffScreen">{shownTabs[tabIndex - 2].name}</div>);
    }
    if (tabIndex > 0) {
        // There's a previous tab.
        tabHeaders.push(<div className="tabScrollerTabPrevious">{shownTabs[tabIndex - 1].name}</div>);
    }
    // There's the current tab.
    tabHeaders.push(<div className="tabScrollerCurrent">{currentTab.name}</div>);
    if (tabIndex < shownTabs.length - 1) {
        // There's a next tab.
        tabHeaders.push(<div className="tabScrollerTabNext">{shownTabs[tabIndex + 1].name}</div>);
    }
    if (tabIndex < shownTabs.length - 2) {
        // There's a next tab to the next tab.
        tabHeaders.push(<div className="tabScrollerTabNext tabScrollerTabOffScreen">{shownTabs[tabIndex + 2].name}</div>);
    }

    return <>
        <div className="tabScrollerOuterDiv">
            <div className="tabScrollerContentContainer">{tabContent}</div>
            <div className="tabScrollerFootBar">
                <div className="tabScrollerArrow" onClick={() => {
                    if (tabIndex > 0) {
                        // There's a previous tab.
                        localStorage.setItem(localStorageIndexConstant, '' + (tabIndex - 1))
                        forceUpdate();
                    }
                }}><b>{tabIndex > 0 ? "<" : ""}</b>{tabIndex > 0 ? "---" : ""}</div>
                <div className="tabScrollerArrow tabScrollerArrowRight" onClick={() => {
                    if (tabIndex < shownTabs.length - 1) {
                        // There's a next tab.
                        localStorage.setItem(localStorageIndexConstant, '' + (tabIndex + 1))
                        forceUpdate();
                    }
                }}>{tabIndex < shownTabs.length - 1 ? "---" : ""}<b>{tabIndex < shownTabs.length - 1 ? ">" : ""}</b></div>
                <div className="tabScrollerTabFooters">
                    {tabHeaders}
                </div>
            </div>
        </div>
    </>
}

function generateTabHeaderPreview(tabName) {
    return <>
        <div className="tabScrollerTabPreview">{tabName}</div>
    </>
}