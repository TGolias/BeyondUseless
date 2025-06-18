import { getNameDictionaryForCollection } from "../Collections";
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
                creatures = calculateOtherSpellAspect(playerConfigsClone, menuConfig.spell, menuConfig.useSpellSlotLevel, "creatures", undefined, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
            }
            return creatures;
        },
        createActiveEffect: (menuConfig, targetNamesMap) => {
            const activeEffect = {
                type: "spell",
                targetNamesMap: targetNamesMap,
                name: menuConfig.spell.name,
                concentration: menuConfig.spell.concentration,
                castAtLevel: menuConfig.useSpellSlotLevel,
                userInput: menuConfig.userInput
            }

            if (menuConfig.additionalEffects) {
                activeEffect.additionalEffects = menuConfig.additionalEffects;
            }

            if (menuConfig.spell.duration === "Indefinitely") {
                activeEffect.indefinite = true;
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
            if (menuConfig.featureAction.type && menuConfig.featureAction.type.includes("creatures")) {
                creatures = calculateOtherFeatureActionAspect(playerConfigsClone, menuConfig.featureAction, "creatures", undefined, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
            }
            return creatures;
        },
        createActiveEffect: (menuConfig, targetNamesMap) => {
            const activeEffect = {
                type: "featureaction",
                targetNamesMap: targetNamesMap,
                name: menuConfig.featureAction.name,
                origin: menuConfig.origin,
                userInput: menuConfig.userInput
            }

            if (menuConfig.additionalEffects) {
                activeEffect.additionalEffects = menuConfig.additionalEffects;
            }

            if (menuConfig.featureAction.duration === "Indefinitely") {
                activeEffect.indefinite = true;
            }

            return activeEffect;
        }
    },
    ActionMenu: {
        getActionObject: (menuConfig) => {
            return menuConfig.action;
        },
        getCreatures: (playerConfigsClone, menuConfig) => {
            let creatures = undefined;
            if (menuConfig.action.type.includes("creatures")) {
                creatures = calculateOtherFeatureActionAspect(playerConfigsClone, menuConfig.action, "creatures", undefined, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
            }
            return creatures;
        },
        createActiveEffect: (menuConfig, targetNamesMap) => {
            const activeEffect = {
                type: "action",
                targetNamesMap: targetNamesMap,
                name: menuConfig.action.name,
                concentration: menuConfig.action.concentration,
                userInput: menuConfig.userInput
            }

            if (menuConfig.additionalEffects) {
                activeEffect.additionalEffects = menuConfig.additionalEffects;
            }

            if (menuConfig.action.duration === "Indefinitely") {
                activeEffect.indefinite = true;
            }

            return activeEffect;
        }
    },
    ItemMenu: {
        getActionObject: (menuConfig) => {
            if (menuConfig.item.consumeEffect) {
                return menuConfig.item.consumeEffect;
            } else { // if (menuConfig.item.spell) {
                return menuConfig.item.spell
            }
        },
        getCreatures: (playerConfigsClone, menuConfig) => {
            let creatures = undefined;
            if (menuConfig.item.consumeEffect) {
                if (menuConfig.item.consumeEffect.type.includes("creatures")) {
                    creatures = calculateOtherFeatureActionAspect(playerConfigsClone, menuConfig.item.consumeEffect, "creatures", undefined, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
                }
            } else { // if (menuConfig.item.spell) {
                if (menuConfig.item.spell.type.includes("creatures")) {
                    creatures = calculateOtherSpellAspect(playerConfigsClone, menuConfig.item.spell, menuConfig.item.spell.level, "creatures", undefined, menuConfig.additionalEffects ?? [], { userInput: menuConfig.userInput });
                }
            }
            return creatures;
        },
        createActiveEffect: (menuConfig, targetNamesMap) => {
            if (menuConfig.item.consumeEffect) {
                return {
                    type: "item",
                    targetNamesMap: targetNamesMap,
                    name: menuConfig.item.name,
                    userInput: menuConfig.userInput
                }
            } else { // if (menuConfig.item.spell) {
                const activeEffect = {
                    type: "spell",
                    targetNamesMap: targetNamesMap,
                    name: menuConfig.item.spell.name,
                    concentration: menuConfig.item.spell.concentration,
                    castAtLevel: menuConfig.item.spell.level,
                    userInput: menuConfig.userInput
                }

                if (menuConfig.additionalEffects) {
                    activeEffect.additionalEffects = menuConfig.additionalEffects;
                }

                if (menuConfig.spell.duration === "Indefinitely") {
                    activeEffect.indefinite = true;
                }
    
                if (menuConfig.spell.resources) {
                    activeEffect.remainingResources = {};
                    for (let resource of menuConfig.spell.resources) {
                        activeEffect.remainingResources[resource.name] = resource.uses;
                    }
                }
                
                return activeEffect;
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
            const targetNamesMap = {};
            targetNamesMap[playerConfigsClone.name] = true;
            await castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, targetNamesMap);
            callback();
        } else if (actionObject.aspects) {
            setCenterScreenMenu({ show: true, menuType: "TargetMenu", data: {
                onClose: async (targetNames) => {
                    const targetNamesMap = convertArrayOfStringsToHashMap(targetNames);
                    await castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, targetNamesMap);

                    const allActiveConnections = GetAllActiveConnections();

                    for (let key of Object.keys(allActiveConnections)) {
                        const singleActiveConnection = allActiveConnections[key];
                        if (targetNamesMap[singleActiveConnection.remotePlayerConfigs.name]) {
                            // We need to let this other remote linked character know that we fucked with their shit. (added to their shit)
                            const newActiveEffect = effectType.createActiveEffect(menuConfig, targetNamesMap);
                            newActiveEffect.fromRemoteCharacter = playerConfigsClone.name;
                            const message = newActiveEffectMessage(sessionId, newActiveEffect);
                            singleActiveConnection.channel.send(JSON.stringify(message));
                        }
                    }
                    callback();
                },
            } });
        } else {
            await castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, {});
            callback();
        }
    } else {
        callback();
    }
}

async function castSpellWithAddingToEffects(playerConfigsClone, setCenterScreenMenu, effectType, creatures, menuConfig, targetNamesMap) {
    playerConfigsClone.currentStatus.activeEffects = playerConfigsClone.currentStatus.activeEffects ? [...playerConfigsClone.currentStatus.activeEffects] : [];
    const newActiveEffect = effectType.createActiveEffect(menuConfig, targetNamesMap);
    
    // See if we have any creatures.
    if (creatures) {
        const actionObject = effectType.getActionObject(menuConfig);

        // Sometimes creatures use aspects from the player character, set it to the values of when the player character cast them... The rules don't specify but that seems to be what makes the most sense to me.
        const creatureCalculationParams = createCreatureCalculationParams(newActiveEffect, actionObject);

        const statBlockMap = createStatBlockMap();
        const allies = [];

        if (Array.isArray(creatures)) {
            for (let creature of creatures) {
                allies.push(await createAlliedCreature(playerConfigsClone, statBlockMap, creature, creatureCalculationParams, setCenterScreenMenu));
            }
        } else {
            allies.push(await createAlliedCreature(playerConfigsClone, statBlockMap, creatures, creatureCalculationParams, setCenterScreenMenu));
        }

        newActiveEffect.allies = allies;
    }

    // See if we already have an active effect with concentration and end it.
    if (newActiveEffect.concentration) {
        removeConcentrationFromPlayerConfigs(playerConfigsClone);
    }
    playerConfigsClone.currentStatus.activeEffects.push(newActiveEffect);
}

function createCreatureCalculationParams(activeEffect, actionObject) {
    return {
        activeEffect,
        actionObject
    }
}

async function createAlliedCreature(playerConfigsClone, statBlockMap, creature, creatureCalculationParams, setCenterScreenMenu) {
    const statBlockForCreature = statBlockMap[creature];
    const name = await promptName(statBlockForCreature, setCenterScreenMenu);
    const ally = createNewAlliedCreatureFromStatBlock(playerConfigsClone, statBlockForCreature, name, creatureCalculationParams);
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
            const playerSpells = getAllSpells(playerConfigs, spellCastingFeatures);
            const playerSpell = playerSpells.find(spell => spell.name === activeEffect.name);
            return playerSpell;
        case "featureaction":
            const actionFeatures = getAllActionFeatures(playerConfigs);
            const actionFeature = actionFeatures.find(feature => feature.feature.actions.some(action => action.name === activeEffect.name));
            const featureAction = actionFeature.feature.actions.find(action => action.name === activeEffect.name);
            return featureAction;
        case "action":
            const actionMap = getNameDictionaryForCollection("actions")
            const action = actionMap[activeEffect.name];
            return action;
        case "item":
            const itemMap = getNameDictionaryForCollection("items");
            const item = itemMap[activeEffect.name];
            return item;
    }
}

export function canAddOtherCharacterActiveEffectOnSelf(playerConfigs, activeEffect) {
    const actionObject = getActionObjectForActiveEffect(playerConfigs, activeEffect);
    return actionObject && actionObject.range !== "Self" && actionObject.aspects;
}