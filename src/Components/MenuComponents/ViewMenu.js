import React from "react";
import './ViewMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";
import { ActionPageComponent } from "../PageComponents/ActionPageComponent";
import { playAudio } from "../../SharedFunctions/Utils";

export function ViewMenu({playerConfigs, inputChangeHandler, setCenterScreenMenu, menuConfig, menuStateChangeHandler}) {

    const pageComponentRow = [];
    switch (menuConfig.viewType) {
        case "spell":
            pageComponentRow.push(<>
                <SpellPageComponent spell={menuConfig.spell} data={menuConfig.data} playerConfigs={menuConfig.playerConfigs} copyLinkToSpell={menuConfig.copyLinkToView}></SpellPageComponent>
            </>);
            break;
        case "featureaction":
            pageComponentRow.push(<>
                <FeatureActionPageComponent featureAction={menuConfig.featureAction} feature={menuConfig.feature} origin={menuConfig.origin} data={menuConfig.data} playerConfigs={menuConfig.playerConfigs} copyLinkToItem={menuConfig.copyLinkToView}></FeatureActionPageComponent>
            </>);
            break;
        case "action":
            pageComponentRow.push(<>
                <ActionPageComponent action={menuConfig.action} copyLinkToItem={menuConfig.copyLinkToView} data={menuConfig.data} playerConfigs={menuConfig.playerConfigs}></ActionPageComponent>
            </>);
            break;
    }

    const resourcesRow = [];
    if (playerConfigs === menuConfig.playerConfigs && menuConfig.activeEffectIndex === 0 || menuConfig.activeEffectIndex) {
        const currentActiveEffect = playerConfigs.currentStatus.activeEffects[menuConfig.activeEffectIndex];
        // We don't want to be able to manage the resources for another player's active effect.
        if (!currentActiveEffect.fromRemoteCharacter) {
            switch (menuConfig.viewType) {
                case "spell":
                    if (menuConfig.spell.resources) {
                        for (let resource of menuConfig.spell.resources) {
                            const totalUses = resource.uses;
                            const remainingUses = menuConfig.newRemainingResources ? menuConfig.newRemainingResources[resource.name] : currentActiveEffect.remainingResources[resource.name];
                            const usedUses = totalUses - remainingUses;
    
                            let usesString = ""
                            for (let i = 0; i < totalUses; i++) {
                                if (i > 0) {
                                    usesString += " ";
                                }
                                if (i < usedUses) {
                                    usesString += "X"
                                } else {
                                    usesString += "O"
                                }
                            }
                            resourcesRow.push(<>
                                <div className="viewMenuSingleResource" onClick={() => {
                                    if (remainingUses > 0) {
                                        playAudio("selectionaudio");
                                        const newRemainingResources = menuConfig.newRemainingResources ? {...menuConfig.newRemainingResources} : {};
                                        newRemainingResources[resource.name] = remainingUses - 1;
                                        menuStateChangeHandler(menuConfig, "newRemainingResources", newRemainingResources);
                                    }
                                }}>
                                    <div>{resource.displayName}</div>
                                    <div className="viewMenuResourceUses">{usesString}</div>
                                </div>
                            </>);
                        }
                    }
                    break;
            }
        }
    }

    return (<>
        <div className="viewMenuWrapperDiv" style={{display: (pageComponentRow.length ? "flex" : "none")}}>
            {pageComponentRow}
        </div>
        <div className="centerMenuSeperator" style={{display: (resourcesRow.length ? "flex" : "none")}}></div>
        <div className="viewMenuResources" style={{display: (resourcesRow.length ? "flex" : "none")}}>
            {resourcesRow}
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="viewMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {
                if (menuConfig.newRemainingResources) {
                    inputChangeHandler(playerConfigs, "currentStatus.activeEffects[" + menuConfig.activeEffectIndex + "].remainingResources", menuConfig.newRemainingResources);
                }
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}