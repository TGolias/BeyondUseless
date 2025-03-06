import { getCollection } from "../Collections";
import { getAllActionFeatures, getAllSpellcastingFeatures, getAllSpells } from "./TabletopMathFunctions";

const effectTypes = {
    SpellMenu: {
        getActionObject: (menuConfig) => {
            return menuConfig.spell;
        },
        menuTitle: "Casting on Self",
        menuText: "Are you casting this on yourself?",
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
        menuTitle: "Using on Self",
        menuText: "Are you targeting yourself?",
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
        menuTitle: "Using on Self",
        menuText: "Are you targeting yourself?",
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

export function tryAddOwnActiveEffectOnSelf(playerConfigsClone, menuConfig, setCenterScreenMenu, callback) {
    const effectType = effectTypes[menuConfig.type];
    const actionObject = effectType.getActionObject(menuConfig);
    if (actionObject.duration !== "Instantaneous") {
        if (actionObject.range === "Self") {
            castSpellWithAddingToEffects(playerConfigsClone, effectType, menuConfig, true);
            callback();
        } else if (actionObject.aspects) {
            setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
                menuTitle: effectType.menuTitle, 
                menuText: effectType.menuText, 
                buttons: [
                    {
                        text: "Yes",
                        onClick: () => {
                            castSpellWithAddingToEffects(playerConfigsClone, effectType, menuConfig, true);
                            callback();
                        }
                    },
                    {
                        text: "No",
                        onClick: () => {
                            castSpellWithAddingToEffects(playerConfigsClone, effectType, menuConfig, false);
                            callback();
                        }
                    }
                ] 
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