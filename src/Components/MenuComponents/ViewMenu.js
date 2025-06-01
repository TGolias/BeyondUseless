import React from "react";
import './ViewMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { SpellPageComponent } from "../PageComponents/SpellPageComponent";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";
import { ActionPageComponent } from "../PageComponents/ActionPageComponent";
import { playAudio } from "../../SharedFunctions/Utils";
import { ItemPageComponent } from "../PageComponents/ItemPageComponent";

export function ViewMenu({playerConfigs, inputChangeHandler, setCenterScreenMenu, menuConfig, menuStateChangeHandler, addToMenuStack}) {

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
        case "item":
            pageComponentRow.push(<>
                <ItemPageComponent item={menuConfig.item} copyLinkToItem={menuConfig.copyLinkToView} data={menuConfig.data} playerConfigs={menuConfig.playerConfigs} pathToProperty={menuConfig.pathToProperty} setCenterScreenMenu={setCenterScreenMenu}></ItemPageComponent>
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
                            resourcesRow.push(createResourceRow(resource, currentActiveEffect, menuConfig, menuStateChangeHandler));
                        }
                    }
                    if (menuConfig.spell.type.includes("creatures") && currentActiveEffect.allies) {
                        for (let allyIndex = 0; allyIndex < currentActiveEffect.allies.length; allyIndex++) {
                            resourcesRow.push(createAllyRow(allyIndex, currentActiveEffect, menuConfig.spell, menuConfig, menuStateChangeHandler, setCenterScreenMenu, addToMenuStack));
                        }
                    }
                    break;
                case "featureaction":
                    if (menuConfig.featureAction.resources) {
                        for (let resource of menuConfig.featureAction.resources) {
                            resourcesRow.push(createResourceRow(resource, currentActiveEffect, menuConfig, menuStateChangeHandler));
                        }
                    }
                    if (menuConfig.featureAction.type && menuConfig.featureAction.type.includes("creatures") && currentActiveEffect.allies) {
                        for (let allyIndex = 0; allyIndex < currentActiveEffect.allies.length; allyIndex++) {
                            resourcesRow.push(createAllyRow(allyIndex, currentActiveEffect, menuConfig.featureAction, menuConfig, menuStateChangeHandler, setCenterScreenMenu, addToMenuStack));
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
                if (menuConfig.newRemainingResources || menuConfig.newAllies) {
                    const newActiveEffect = {...playerConfigs.currentStatus.activeEffects[menuConfig.activeEffectIndex]};
                    if (menuConfig.newRemainingResources) {
                        newActiveEffect.remainingResources = menuConfig.newRemainingResources;
                    }
                    if (menuConfig.newAllies) {
                        newActiveEffect.allies = menuConfig.newAllies;
                    }
                    inputChangeHandler(playerConfigs, "currentStatus.activeEffects[" + menuConfig.activeEffectIndex + "]", newActiveEffect);
                }
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function createResourceRow(resource, currentActiveEffect, menuConfig, menuStateChangeHandler) {
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

    return (<>
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

function createAllyRow(allyIndex, currentActiveEffect, effectObject, menuConfig, menuStateChangeHandler, setCenterScreenMenu, addToMenuStack) {
    const ally = menuConfig.newAllies ? menuConfig.newAllies[allyIndex] : currentActiveEffect.allies[allyIndex];
    return (<>
        <div className="viewMenuSingleAlly" onClick={() => {
            playAudio("selectionaudio");
            addToMenuStack({ menuType: "ViewMenu", menuConfig });
            setCenterScreenMenu({ show: true, menuType: "ViewCharacterMenu", data: { playerConfigs: ally, parentPlayerConfigs: menuConfig.playerConfigs, onOkClicked: (newPlayerConfigs) => {
                const newNewAllies = menuConfig.newAllies ? [...menuConfig.newAllies] : [...currentActiveEffect.allies];
                newNewAllies[allyIndex] = newPlayerConfigs;
                menuStateChangeHandler(menuConfig, "newAllies", newNewAllies);
            } } });
        }}>Ally - {ally.name}</div>
    </>);
}