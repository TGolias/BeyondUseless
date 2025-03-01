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
    }
}

export function tryAddActiveEffect(playerConfigsClone, menuConfig, setCenterScreenMenu, callback) {
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