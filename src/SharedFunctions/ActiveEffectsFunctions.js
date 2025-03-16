import { getCollection } from "../Collections";
import { createNewAlliedCreatureFromStatBlock, createStatBlockMap } from "./AlliedCreatureFunctions";
import { removeConcentrationFromPlayerConfigs } from "./ConcentrationFunctions";
import { GetAllActiveConnections } from "./LinkedPlayerFunctions";
import { newActiveEffectMessage } from "./LinkedPlayerMessageFunctions";
import { calculateOtherFeatureActionAspect, calculateOtherSpellAspect, getAllActionFeatures, getAllSpellcastingFeatures, getAllSpells } from "./TabletopMathFunctions";
import { convertArrayOfStringsToHashMap } from "./Utils";

const effectTypes = {
    SpellMenu: {
        getActionObject: (menuConfig) => {
            return menuConfig.spell;
        },
        getCreatures: (playerConfigsClone, menuConfig) => {
            let creatures = undefined;
            if (menuConfig.spell.type.includes("creatures")) {
                creatures = calculateOtherSpellAspect(playerConfigsClone, menuConfig.spell, "creatures", undefined, { userInput: menuConfig.userInput });
            }
            return creatures;
        },
        createActiveEffect: (menuConfig, useOnSelf) => {
            const activeEffect = {
                type: "spell",
                onSelf: useOnSelf,
                name: menuConfig.spell.name,
                concentration: menuConfig.spell.concentration,
                castAtLevel: menuConfig.useSpellSlotLevel,
                userInput: menuConfig.userInput
            }

            if (menuConfig.spell.resources) {
                activeEffect.remainingResources = {};
                for (let resource of menuConfig.spell.resources) {
                    activeEffect.remainingResources[resource.name] = resource.uses;
                }
            }
            
            return activeEffect;
        }
    },
    FeatureActionMenu: {
        getActionObject: (menuConfig) => {
            return menuConfig.featureAction;
        },
        getCreatures: (playerConfigsClone, menuConfig) => {
            let creatures = undefined;
            if (menuConfig.featureAction.type.includes("creatures")) {
                creatures = calculateOtherFeatureActionAspect(playerConfigsClone, menuConfig.featureAction, "creatures", undefined, { userInput: menuConfig.userInput });
            }
            return creatures;
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
        getCreatures: (playerConfigsClone, menuConfig) => {
            let creatures = undefined;
            if (menuConfig.action.type.includes("creatures")) {
                creatures = calculateOtherFeatureActionAspect(playerConfigsClone, menuConfig.action, "creatures", undefined, { userInput: menuConfig.userInput });
            }
            return creatures;
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

export async function tryAddOwnActiveEffectOnSelf(sessionId, playerConfigsClone, menuConfig, setCenterScreenMenu, callback) {
    const effectType = effectTypes[menuConfig.type];
    const actionObject = effectType.getActionObject(menuConfig);

    const creatures = effectType.getCreatures(playerConfigsClone, menuConfig);

    // We want to track the spell if it is not Instantaneous or has a creatures.
    if (actionObject.duration !== "Instantaneous" || creatures) {
        if (actionObject.range === "Self") {
            await castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, true);
            callback();
        } else if (actionObject.aspects) {
            setCenterScreenMenu({ show: true, menuType: "TargetMenu", data: {
                onClose: async (targetNames) => {
                    const targetNamesMap = convertArrayOfStringsToHashMap(targetNames);
                    if (targetNamesMap[playerConfigsClone.name]) {
                        await castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, true);
                    } else {
                        await castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, false);
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
            await castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, false);
            callback();
        }
    } else {
        callback();
    }
}

async function castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, useOnSelf) {
    playerConfigsClone.currentStatus.activeEffects = playerConfigsClone.currentStatus.activeEffects ? [...playerConfigsClone.currentStatus.activeEffects] : [];
    const newActiveEffect = effectType.createActiveEffect(menuConfig, useOnSelf);

    // See if we have any creatures.
    if (creatures) {
        const statBlockMap = createStatBlockMap();
        const allies = [];

        if (Array.isArray(creatures)) {
            for (let creature of creatures) {
                allies.push(await createAlliedCreature(playerConfigsClone, statBlockMap, creature, newActiveEffect, setCenterScreenMenu));
            }
        } else {
            allies.push(await createAlliedCreature(playerConfigsClone, statBlockMap, creatures, newActiveEffect, setCenterScreenMenu));
        }

        newActiveEffect.allies = allies;
    }

    // See if we already have an active effect with concentration and end it.
    if (newActiveEffect.concentration) {
        removeConcentrationFromPlayerConfigs(playerConfigsClone);
    }
    playerConfigsClone.currentStatus.activeEffects.push(newActiveEffect);
}

async function createAlliedCreature(playerConfigsClone, statBlockMap, creature, activeEffect, setCenterScreenMenu) {
    const statBlockForCreature = statBlockMap[creature];
    const name = await promptName(statBlockForCreature, setCenterScreenMenu);
    const ally = createNewAlliedCreatureFromStatBlock(playerConfigsClone, statBlockForCreature, name, activeEffect);
    return ally;
}

function promptName(statBlockForCreature, setCenterScreenMenu) {
    return new Promise(resolve => {
        setCenterScreenMenu({ show: true, menuType: "TextInputMenu", data: { menuTitle: "Enter Ally Name", menuText: "Enter Name for <b>" + statBlockForCreature.name + "</b>:", 
            onOkClicked: (result) => {
                // TODO: We need to reject this promise or somehow break out when the user clicks out of the menu using the "X", otherwise the promise sticks around forever I believe.
                resolve(result);
            }
        }});
    });
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