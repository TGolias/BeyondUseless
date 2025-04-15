import React from "react";
import './ResourcesMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { CircleButton } from "../SimpleComponents/CircleButton";

export function ResourcesMenu({playerConfigs, inputChangeHandler, menuConfig, setCenterScreenMenu, menuStateChangeHandler}) {

    const resourceRows = []
    if (menuConfig.remainingFreeSpellUses) {
        for (const resourceName of Object.keys(menuConfig.remainingFreeSpellUses)) {
            const remainingFreeSpellUses = menuConfig.remainingFreeSpellUses[resourceName];
            resourceRows.push(<>
                <div>{resourceName}</div>
                <div className="resourcesMenuButtons">
                    <CircleButton text={"-"} onClickHandler={() => {
                        menuStateChangeHandler(menuConfig, "remainingFreeSpellUses." + resourceName, remainingFreeSpellUses - 1);
                    }} disabled={remainingFreeSpellUses <= 0}></CircleButton>
                    <div>{remainingFreeSpellUses}</div>
                    <CircleButton text={"+"} onClickHandler={() => {
                        menuStateChangeHandler(menuConfig, "remainingFreeSpellUses." + resourceName, remainingFreeSpellUses + 1);
                    }} disabled={false}></CircleButton>
                </div>
            </>);
        }
    }

    if (menuConfig.remainingResources) {
        for (const resourceName of Object.keys(menuConfig.remainingResources)) {
            const remainingResources = menuConfig.remainingResources[resourceName];
            resourceRows.push(<>
                <div>{resourceName}</div>
                <div className="resourcesMenuButtons">
                    <CircleButton text={"-"} onClickHandler={() => {
                        menuStateChangeHandler(menuConfig, "remainingResources." + resourceName, remainingResources - 1);
                    }} disabled={remainingResources <= 0}></CircleButton>
                    <div>{remainingResources}</div>
                    <CircleButton text={"+"} onClickHandler={() => {
                        menuStateChangeHandler(menuConfig, "remainingResources." + resourceName, remainingResources + 1);
                    }} disabled={false}></CircleButton>
                </div>
            </>);
        }
    }

    if (menuConfig.remainingSpellSlots) {
        for (const slotName of Object.keys(menuConfig.remainingSpellSlots)) {
            const remainingSpellSlots = menuConfig.remainingSpellSlots[slotName];
            resourceRows.push(<>
                <div>{slotName}</div>
                <div className="resourcesMenuButtons">
                    <CircleButton text={"-"} onClickHandler={() => {
                        menuStateChangeHandler(menuConfig, "remainingSpellSlots." + slotName, remainingSpellSlots - 1);
                    }} disabled={remainingSpellSlots <= 0}></CircleButton>
                    <div>{remainingSpellSlots}</div>
                    <CircleButton text={"+"} onClickHandler={() => {
                        menuStateChangeHandler(menuConfig, "remainingSpellSlots." + slotName, remainingSpellSlots + 1);
                    }} disabled={false}></CircleButton>
                </div>
            </>);
        }
    }

    return (<>
        <div className="resourcesMenuWrapperDiv">
            <div className="resourcesMenuText">
                {resourceRows}
            </div>
            <div className="centerMenuSeperator"></div>
            <div className="resourcesMenuHorizontal">
                <RetroButton text={"OK"} onClickHandler={() => {
                    if (menuConfig.remainingFreeSpellUses || menuConfig.remainingResources || menuConfig.remainingSpellSlots) {
                        const newCurrentStatus = {...playerConfigs.currentStatus};
                        if (menuConfig.remainingFreeSpellUses) {
                            newCurrentStatus.remainingFreeSpellUses = menuConfig.remainingFreeSpellUses;
                        }

                        if (menuConfig.remainingResources) {
                            newCurrentStatus.remainingResources = menuConfig.remainingResources;
                        }

                        if (menuConfig.remainingSpellSlots) {
                            newCurrentStatus.remainingSpellSlots = menuConfig.remainingSpellSlots;
                        }
                        inputChangeHandler(playerConfigs, "currentStatus", newCurrentStatus);
                    }
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false}></RetroButton>
                <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </div>
    </>);
}