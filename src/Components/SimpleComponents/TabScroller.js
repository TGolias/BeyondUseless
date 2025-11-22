import React, { useReducer, useState } from "react";
import './TabScroller.css'
import { StartMenu } from "../MainLayoutComponents/StartMenu";
import { playAudio } from "../../SharedFunctions/Utils";

export function TabScroller({tabScrollerId, tabs}) {

    const [, forceUpdate] = useReducer(x => !x, false);
    const [showChangePageMenu, setShowChangePageMenu] = useState(false);

    const shownTabs = tabs.filter(tab => tab.showTab());

    const localStorageIndexConstant = "TAB_SCROLLER_" + tabScrollerId + "_INDEX";

    let currentlySelectedTab = localStorage.getItem(localStorageIndexConstant);
    let currentTab = shownTabs.find(tab => tab.name === currentlySelectedTab);
    if (!currentTab) {
        currentTab = shownTabs[0];
        currentlySelectedTab = currentTab.name;
        localStorage.setItem(localStorageIndexConstant, currentlySelectedTab);
    }

    const tabIndex = shownTabs.indexOf(currentTab);
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
    tabHeaders.push(<div onClick={() => {
        if (!showChangePageMenu) {
            playAudio("menuaudio");
            setShowChangePageMenu(true);
        }
    }} className="tabScrollerCurrent">{currentTab.name}</div>);
    if (tabIndex < shownTabs.length - 1) {
        // There's a next tab.
        tabHeaders.push(<div className="tabScrollerTabNext">{shownTabs[tabIndex + 1].name}</div>);
    }
    if (tabIndex < shownTabs.length - 2) {
        // There's a next tab to the next tab.
        tabHeaders.push(<div className="tabScrollerTabNext tabScrollerTabOffScreen">{shownTabs[tabIndex + 2].name}</div>);
    }

    const changeMenuItems = [];

    for (let tab of shownTabs) {
        changeMenuItems.push({
            text: tab.name,
            currentlySelected: tab.name === currentlySelectedTab,
            clickHandler: () => {
                localStorage.setItem(localStorageIndexConstant, tab.name);
                setShowChangePageMenu(false);
            }
        });
    }

    changeMenuItems.push({
        text: "Exit",
        clickHandler: () => {
            setShowChangePageMenu(false);
        }
    });

    return <>
        <div className="tabScrollerOuterDiv">
            <div className="tabScrollerContentContainer">{tabContent}</div>
            <div className="tabScrollerFootBar">
                <div className="tabScrollerArrow" onClick={() => {
                    if (tabIndex > 0) {
                        // There's a previous tab.
                        localStorage.setItem(localStorageIndexConstant, shownTabs[tabIndex - 1].name);
                        forceUpdate();
                    }
                }}><b>{tabIndex > 0 ? "<" : ""}</b>{tabIndex > 0 ? "---" : ""}</div>
                <div className="tabScrollerArrow tabScrollerArrowRight" onClick={() => {
                    if (tabIndex < shownTabs.length - 1) {
                        // There's a next tab.
                        localStorage.setItem(localStorageIndexConstant, shownTabs[tabIndex + 1].name)
                        forceUpdate();
                    }
                }}>{tabIndex < shownTabs.length - 1 ? "---" : ""}<b>{tabIndex < shownTabs.length - 1 ? ">" : ""}</b></div>
                <div className="tabScrollerTabFooters">
                    {tabHeaders}
                </div>
                <div className={"changePageMenu" + (showChangePageMenu ? "" : " hide")}>
                    <StartMenu menuItems={changeMenuItems}></StartMenu>
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