import { getCollection } from "../Collections";
import { GetAllActiveConnections } from "./LinkedPlayerFunctions";
import { newActiveEffectMessage } from "./LinkedPlayerMessageFunctions";
import { getAllActionFeatures, getAllSpellcastingFeatures, getAllSpells } from "./TabletopMathFunctions";
import { convertArrayOfStringsToHashMap } from "./Utils";

const effectTypes = {
    SpellMenu: {
        getActionObject: (menuConfig) => {
            return menuConfig.spell;
        },
        createActiveEffect: (menuConfig, useOnSelf) => {
            return {
                type: "spell",
                onSelf: useOnSelf,
                name: menuConfig.spell.name,
                concentration: menuConfig.spell.concentration,
                castAtLevel: menuConfig.useSpellSlotLevel,
                userInput: menuConfig.userInput
            }
        }
    },
    FeatureActionMenu: {
        getActionObject: (menuConfig) => {
            return menuConfig.featureAction;
        },
        createActiveEffect: (menuConfig, useOnSelf) => {
            return {
                type: "featureaction",
                onSelf: useOnSelf,
                name: menuConfig.featureAction.name,
                origin: menuConfig.origin,
                userInput: menuConfig.userInput
            }
        }
    },
    ActionMenu: {
        getActionObject: (menuConfig) => {
            return menuConfig.action;
        },
        createActiveEffect: (menuConfig, useOnSelf) => {
            return {
                type: "action",
                onSelf: useOnSelf,
                name: menuConfig.action.name,
                concentration: menuConfig.action.concentration,
                userInput: menuConfig.userInput
            }
        }
    }
}

export function tryAddOwnActiveEffectOnSelf(sessionId, playerConfigsClone, menuConfig, setCenterScreenMenu, callback) {
    const effectType = effectTypes[menuConfig.type];
    const actionObject = effectType.getActionObject(menuConfig);
    if (actionObject.duration !== "Instantaneous") {
        if (actionObject.range === "Self") {
            castSpellWithAddingToEffects(playerConfigsClone, effectType, menuConfig, true);
            callback();
        } else if (actionObject.aspects) {
            setCenterScreenMenu({ show: true, menuType: "TargetMenu", data: {
                onClose: (targetNames) => {
                    const targetNamesMap = convertArrayOfStringsToHashMap(targetNames);
                    if (targetNamesMap[playerConfigsClone.name]) {
                        castSpellWithAddingToEffects(playerConfigsClone, effectType, menuConfig, true);
                    } else {
                        castSpellWithAddingToEffects(playerConfigsClone, effectType, menuConfig, false);
                    }
                    
                    const allActiveConnections = GetAllActiveConnections();
                    for (let key of Object.keys(allActiveConnections)) {
                        const singleActiveConnection = allActiveConnections[key];
                        if (targetNamesMap[singleActiveConnection.remotePlayerConfigs.name]) {
                            // We need to let this other remote linked character know that we fucked with their shit. (added to their shit)
                            const newActiveEffect = effectType.createActiveEffect(menuConfig, true);
                            newActiveEffect.fromRemoteCharacter = playerConfigsClone.name;
                            const message = newActiveEffectMessage(sessionId, newActiveEffect);
                            singleActiveConnection.channel.send(JSON.stringify(message));
                        }
                    }
                    callback();
                },
            } });
        } else {
            castSpellWithAddingToEffects(playerConfigsClone, effectType, menuConfig, false);
            callback();
        }
    } else {
        callback();
    }
}

function castSpellWithAddingToEffects(playerConfigsClone, effectType, menuConfig, useOnSelf) {
    playerConfigsClone.currentStatus.activeEffects = playerConfigsClone.currentStatus.activeEffects ? [...playerConfigsClone.currentStatus.activeEffects] : [];
    const newActiveEffect = effectType.createActiveEffect(menuConfig, useOnSelf);
    if (newActiveEffect.concentration) {
        // If this is a concentration effect, we can only concentrate on one spell at a time. Remove anything else we are concentrating on.
        for (let index = 0; index < playerConfigsClone.currentStatus.activeEffects.length; index++) {
            const activeEffect = playerConfigsClone.currentStatus.activeEffects[index];
            if (!activeEffect.fromRemoteCharacter && activeEffect.concentration) {
                // There is an effect with concentration and it isn't from another character. Remove it!
                playerConfigsClone.currentStatus.activeEffects.splice(index, 1);

                // We just removed an index from an array we are in the middle of looping through. Check this index again, there will be a new value there (unless we've reached the end).
                index--; 
            }
        }
    }
    playerConfigsClone.currentStatus.activeEffects.push(newActiveEffect);
}

export function getActionObjectForActiveEffect(playerConfigs, activeEffect) {
    switch (activeEffect.type) {
        case "spell":
            const spellCastingFeatures = getAllSpellcastingFeatures(playerConfigs);
            const playerSpells = getAllSpells(spellCastingFeatures);
            const playerSpell = playerSpells.find(spell => spell.name === activeEffect.name);
            return playerSpell;
        case "featureaction":
            const actionFeatures = getAllActionFeatures(playerConfigs);
            const actionFeature = actionFeatures.find(feature => feature.feature.actions.some(action => action.name === activeEffect.name));
            const featureAction = actionFeature.feature.actions.find(action => action.name === activeEffect.name);
            return featureAction;
        case "action":
            const actions = getCollection("actions")
            const action = actions.find(act => act.name === activeEffect.name);
            return action;
    }
}

export function canAddOtherCharacterActiveEffectOnSelf(playerConfigs, activeEffect) {
    const actionObject = getActionObjectForActiveEffect(playerConfigs, activeEffect);
    return actionObject && actionObject.range !== "Self" && actionObject.aspects;
}