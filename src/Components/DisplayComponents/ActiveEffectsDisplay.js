import React from "react";
import './ActiveEffectsDisplay.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { playAudio } from "../../SharedFunctions/Utils";
import { getAllActionFeatures, getAllSpellcastingFeatures, getAllSpells } from "../../SharedFunctions/TabletopMathFunctions";
import { getCollection } from "../../Collections";

export function ActiveEffectsDisplay({playerConfigs, activeEffects, setCenterScreenMenu, generateButtonText, onButtonClick }) {

    const activeEffectRows = [];
    if (activeEffects && activeEffects.length) {
        for (let i = 0; i < activeEffects.length; i++) {
            const activeEffect = activeEffects[i];
            activeEffectRows.push(<>
                <div className="singleActiveEffect pixel-corners">
                    <div className="singleActiveEffectTextWrapper" onClick={() => openViewMenuForActiveEffect(playerConfigs, activeEffect, i, setCenterScreenMenu)}>
                        <div className="singleActiveEffectText"><b>{(activeEffect.fromRemoteCharacter ? activeEffect.fromRemoteCharacter.split(' ')[0] : (activeEffect.concentration ? "Concentration" : ""))}</b>{(activeEffect.concentration ? " - " : "")}{activeEffect.name}</div>
                    </div>
                    <RetroButton text={generateButtonText(i)} onClickHandler={() => {
                        onButtonClick(i);
                    }} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </>);
        }
    }

    return <>
        <div className="activeEffectsDisplayWrapper">
            <div>Active Effects:</div>
            {activeEffectRows}
        </div>
    </>
}

function openViewMenuForActiveEffect(playerConfigs, activeEffect, activeEffectIndex, setCenterScreenMenu) {
    // TODO: We can probably make common code between this and getActionObjectForActiveEffect, it's just this needs extra info for setCenterScreenMenu.
    let playerConfigsToSet = undefined;
    if (activeEffect.fromRemoteCharacter) {
        const remoteCharactersString = localStorage.getItem("REMOTE_CHARACTERS");
        const remoteCharacters = remoteCharactersString ? JSON.parse(remoteCharactersString) : {};
        playerConfigsToSet = remoteCharacters[activeEffect.fromRemoteCharacter];
    } else {
        playerConfigsToSet = playerConfigs;
    }
    
    if (playerConfigsToSet) {
        switch (activeEffect.type) {
            case "spell":
                const spellCastingFeatures = getAllSpellcastingFeatures(playerConfigsToSet);
                const playerSpells = getAllSpells(spellCastingFeatures);
                const playerSpell = playerSpells.find(spell => spell.name === activeEffect.name);

                playAudio("menuaudio");
                setCenterScreenMenu({ show: true, menuType: "ViewMenu", data: { menuTitle: activeEffect.name, viewType: "spell", activeEffectIndex: activeEffectIndex, spell: playerSpell, playerConfigs: playerConfigsToSet, data: { castAtLevel: activeEffect.castAtLevel, userInput: activeEffect.userInput, feature: playerSpell.feature } } });
                break;
            case "featureaction":
                const actionFeatures = getAllActionFeatures(playerConfigsToSet);
                const actionFeature = actionFeatures.find(feature => feature.feature.actions.some(action => action.name === activeEffect.name));
                const featureAction = actionFeature.feature.actions.find(action => action.name === activeEffect.name);

                playAudio("menuaudio");
                setCenterScreenMenu({ show: true, menuType: "ViewMenu", data: { menuTitle: activeEffect.name, viewType: "featureaction", activeEffectIndex: activeEffectIndex, featureAction: featureAction, feature: actionFeature.feature, origin: activeEffect.origin, playerConfigs: playerConfigsToSet, data: { userInput: activeEffect.userInput } } });
                break;
            case "action":
                const actions = getCollection("actions")
                const action = actions.find(act => act.name === activeEffect.name);

                playAudio("menuaudio");
                setCenterScreenMenu({ show: true, menuType: "ViewMenu", data: { menuTitle: activeEffect.name, viewType: "action", activeEffectIndex: activeEffectIndex, action: action, playerConfigs: playerConfigsToSet, data: { userInput: activeEffect.userInput } } });
                break;
        }
    }
}