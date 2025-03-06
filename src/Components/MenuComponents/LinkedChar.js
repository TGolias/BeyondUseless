import React, { useReducer } from "react";
import './LinkedChar.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { HPandLVLDisplay } from "../DisplayComponents/HPandLVLDisplay";
import { AddOnRemoteCharacterChangedHandler } from "../../SharedFunctions/LinkedPlayerFunctions";
import { ConditionsDisplay } from "../DisplayComponents/ConditionsDisplay";
import { ActiveEffectsDisplay } from "../DisplayComponents/ActiveEffectsDisplay";
import { canAddOtherCharacterActiveEffectOnSelf } from "../../SharedFunctions/ActiveEffectsFunctions";
import { convertArrayToDictionary } from "../../SharedFunctions/Utils";

export function LinkedChar({playerConfigs, setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler, inputChangeHandler}) {

    const [, forceUpdate] = useReducer(x => !x, false);

    AddOnRemoteCharacterChangedHandler((name) => {
        if (menuConfig.characterName === name && forceUpdate) {
            forceUpdate();
        }
    });

    const remoteCharactersString = localStorage.getItem("REMOTE_CHARACTERS");
    const remoteCharacters = remoteCharactersString ? JSON.parse(remoteCharactersString) : {};
    const characterConfigs = remoteCharacters[menuConfig.characterName];

    // First, see if any of our effects we were going to add were removed.
    const remoteCharActiveEffects = characterConfigs.currentStatus?.activeEffects ?? [];
    const remoteCharActiveEffectsMap = convertArrayToDictionary(remoteCharActiveEffects, "name");
    const activeEffectsIndexesToRemove = [];
    for (let i = 0; i < menuConfig.newActiveEffects.length; i++) {
        const effectToAdd = menuConfig.newActiveEffects[i];
        if (effectToAdd.fromRemoteCharacter === menuConfig.characterName && !remoteCharActiveEffectsMap[effectToAdd.name]) {
            // This effect doesn't exist anymore, have it removed.
            activeEffectsIndexesToRemove.push(i);
        }
    }

    if (activeEffectsIndexesToRemove.length > 0) {
        let newActiveEffectsWithRemovals = menuConfig.newActiveEffects;
        for (let i = 0; i < activeEffectsIndexesToRemove.length; i++) {
            const indexToRemove = activeEffectsIndexesToRemove[i] - i; // Minus i because the array gets smaller by one each time.
            newActiveEffectsWithRemovals = [...newActiveEffectsWithRemovals];
            newActiveEffectsWithRemovals.splice(indexToRemove, 1);
        }
        menuStateChangeHandler(menuConfig, "newActiveEffects", newActiveEffectsWithRemovals);
    }

    let activeEffectsToAddFromRemoteChar = menuConfig.newActiveEffects.filter(effect => effect.fromRemoteCharacter === menuConfig.characterName);
    let activeEffectsToAddFromRemoteCharMap = convertArrayToDictionary(activeEffectsToAddFromRemoteChar, "name");

    const infoRows = []
    infoRows.push(<>
        <HPandLVLDisplay playerConfigs={characterConfigs} playLowHpAudio={false}></HPandLVLDisplay>
    </>);

    const conditions = characterConfigs.currentStatus?.conditions ?? [];
    if (conditions.length > 0) {
        infoRows.push(<>
            <ConditionsDisplay conditions={characterConfigs.currentStatus.conditions ?? []}></ConditionsDisplay>
        </>);
    }

    if (remoteCharActiveEffects.length > 0) {
        infoRows.push(<>
            <ActiveEffectsDisplay playerConfigs={characterConfigs} activeEffects={remoteCharActiveEffects} setCenterScreenMenu={(config) => {
                addToMenuStack({ menuType: "LinkedChar", menuConfig: menuConfig });
                setCenterScreenMenu(config);
            }} generateButtonText={(i) => {
                if (activeEffectsToAddFromRemoteCharMap[remoteCharActiveEffects[i].name]) {
                    return "Added";
                } else if (canAddOtherCharacterActiveEffectOnSelf(characterConfigs, remoteCharActiveEffects[i])) {
                    return "Add";
                }
                return "";
            }} onButtonClick={(i) => {
                if (!activeEffectsToAddFromRemoteCharMap[remoteCharActiveEffects[i].name] && canAddOtherCharacterActiveEffectOnSelf(characterConfigs, remoteCharActiveEffects[i])) {
                    const newEffectForSelf = {...remoteCharActiveEffects[i]}
                    newEffectForSelf.onSelf = true;
                    newEffectForSelf.fromRemoteCharacter = menuConfig.characterName;
                    const effectsToAdd = [...menuConfig.newActiveEffects, newEffectForSelf];
                    menuStateChangeHandler(menuConfig, "newActiveEffects", effectsToAdd);
                }
            }}></ActiveEffectsDisplay>
        </>);
    }

    return (<>
        <div className="linkedCharMenuChars">{infoRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="linkedCharButtonsWrapper">
            <RetroButton text="Confirm" onClickHandler={() => {
                inputChangeHandler(playerConfigs, "currentStatus.activeEffects", menuConfig.newActiveEffects);
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text="Cancel" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>)
}