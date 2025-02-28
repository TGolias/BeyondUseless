import React from "react";
import './ActiveEffectsDisplay.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { playAudio } from "../../SharedFunctions/Utils";
import { getAllActionFeatures, getAllSpellcastingFeatures, getAllSpells } from "../../SharedFunctions/TabletopMathFunctions";

export function ActiveEffectsDisplay({playerConfigs, activeEffects, inputChangeHandler, setCenterScreenMenu}) {

    const activeEffectRows = [];
    if (activeEffects && activeEffects.length) {
        for (let i = 0; i < activeEffects.length; i++) {
            const activeEffect = activeEffects[i];
            activeEffectRows.push(<>
                <div className="singleActiveEffect pixel-corners">
                    <div className="singleActiveEffectTextWrapper" onClick={() => openViewMenuForActiveEffect(playerConfigs, activeEffect, setCenterScreenMenu)}>
                        <div className="singleActiveEffectText"><b>{(activeEffect.concentration ? "Concentration" : "")}</b>{(activeEffect.concentration ? " - " : "")}{activeEffect.name}</div>
                    </div>
                    <RetroButton text={"X"} onClickHandler={() => {
                        const newActiveEffects = [...activeEffects];
                        newActiveEffects.splice(i, 1);
                        inputChangeHandler(playerConfigs, "currentStatus.activeEffects", newActiveEffects);
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

function openViewMenuForActiveEffect(playerConfigs, activeEffect, setCenterScreenMenu) {
    switch (activeEffect.type) {
        case "spell":
            const spellCastingFeatures = getAllSpellcastingFeatures(playerConfigs);
            const playerSpells = getAllSpells(spellCastingFeatures);
            const playerSpell = playerSpells.find(spell => spell.name === activeEffect.name);

            playAudio("menuaudio");
            setCenterScreenMenu({ show: true, menuType: "ViewMenu", data: { menuTitle: activeEffect.name, viewType: "spell", spell: playerSpell, data: { playerConfigs: playerConfigs, castAtLevel: activeEffect.castAtLevel, userInput: activeEffect.userInput, feature: playerSpell.feature } } });
            break;
        case "featureaction":
            const actionFeatures = getAllActionFeatures(playerConfigs);
            const actionFeature = actionFeatures.find(feature => feature.feature.actions.some(action => action.name === activeEffect.name));
            const featureAction = actionFeature.feature.actions.find(action => action.name === activeEffect.name);

            playAudio("menuaudio");
            setCenterScreenMenu({ show: true, menuType: "ViewMenu", data: { menuTitle: activeEffect.name, viewType: "featureaction", featureAction: featureAction, feature: actionFeature.feature, origin: activeEffect.origin, data: { playerConfigs: playerConfigs, userInput: activeEffect.userInput } } });
    }
}