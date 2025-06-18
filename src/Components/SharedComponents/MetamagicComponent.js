import React from "react";
import './MetamagicComponent.css'
import { calculateDuration, calculateRange, findResourceFromAllResources, performBooleanCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { getNameDictionaryForCollection } from "../../Collections";

const rightTriangleUnicode = '\u25B6';

export function MetamagicComponent({playerConfigs, metamagicOptions, menuConfig, menuStateChangeHandler, addToMenuStack, setCenterScreenMenu}) {

    let metamagicRows = [];

    if (metamagicOptions.length > 0) {
        console.log(metamagicOptions);
        const sorceryPoints = findResourceFromAllResources(playerConfigs, "sorceryPoints");
    
        if (sorceryPoints && sorceryPoints.maxUses > 0) {
            metamagicRows.push(<>
                <div>Sorcery Points: {sorceryPoints.remainingUses} / {sorceryPoints.maxUses}</div>
            </>);

            const metamagicMap = getNameDictionaryForCollection("metamagic");

            // TODO: Later on this can be increased, we'll figure this out later, for now hardcode to 1.
            const metamagicLimit = 1;

            let anyMetamagic = false;
            let metamagicUsesSoFar = 0;
            let metamagicPointsThatWillBeRemaining = sorceryPoints.remainingUses;
            if (menuConfig.additionalEffects && menuConfig.additionalEffects.length > 0) {
                for (let i = 0; i < menuConfig.additionalEffects.length; i++) {
                    const additionalEffect = menuConfig.additionalEffects[i];
                    if (additionalEffect.type === "metamagic") {
                        anyMetamagic = true;

                        const dndMetamagic = metamagicMap[additionalEffect.name];
                        metamagicUsesSoFar += dndMetamagic.metamagicPerSpellCost;
                        metamagicPointsThatWillBeRemaining -= dndMetamagic.cost;

                        metamagicRows.push(<>
                            <div>{rightTriangleUnicode}{dndMetamagic.name}: -{dndMetamagic.cost}</div>
                        </>);
                    }
                }
            }

            if (anyMetamagic) {
                metamagicRows.push(<>
                    <div>Will be remaining: {metamagicPointsThatWillBeRemaining}</div>
                </>) 
            }

            if (metamagicPointsThatWillBeRemaining > 0) {
                const range = calculateRange(playerConfigs, menuConfig.additionalEffects ?? [], menuConfig.spell.range);
                const concentration = menuConfig.spell.concentration;
                const duration = calculateDuration(playerConfigs, menuConfig.spell.duration, menuConfig.additionalEffects ?? [], { spell: menuConfig.spell, slotLevel: menuConfig.useSpellSlotLevel, range, concentration });

                const dndMetamagicOptions = metamagicOptions.map(metamagicOption => metamagicMap[metamagicOption]);
                const filteredMetamagicNames = dndMetamagicOptions.filter(dndMetamagicOption => {
                    if (menuConfig.additionalEffects && menuConfig.additionalEffects.length > 0 && menuConfig.additionalEffects.some(x => x.type === "metamagic" && x.name === dndMetamagicOption.name)) {
                        // This one has already been selected.
                        return false;
                    }

                    if (metamagicUsesSoFar + dndMetamagicOption.metamagicPerSpellCost > metamagicLimit) {
                        // This will go over our limit of the number of metamagics we are allowed to apply to a single spell.
                        return false;
                    }

                    if (dndMetamagicOption.conditions) {
                        const isConditionMet = performBooleanCalculation(playerConfigs, dndMetamagicOption.conditions, { spell: menuConfig.spell, slotLevel: menuConfig.useSpellSlotLevel, range, concentration, duration });
                        if (!isConditionMet) {
                            return false;
                        }
                    }

                    return true;
                }).map(metamagicOption => metamagicOption.name);

                if (filteredMetamagicNames.length > 0) {
                    metamagicRows.push(<>
                        <RetroButton text={"Apply Metamagic?"} onClickHandler={() => {
                            addToMenuStack({ menuType: "SpellMenu", menuConfig });
                            setCenterScreenMenu({ show: true, menuType: "SelectListMenu", data: { menuTitle: "Add Metamagic", menuText: "Select the metamagic to add:", options: filteredMetamagicNames, 
                                onOkClicked: (result) => {
                                    const newAdditonalEffects = menuConfig.additionalEffects ? [...menuConfig.additionalEffects] : [];
                                    newAdditonalEffects.push({ type: "metamagic", name: result });
                                    menuStateChangeHandler(menuConfig, "additionalEffects", newAdditonalEffects);
                                } }
                            });
                        }} showTriangle={false} disabled={false}></RetroButton>
                    </>);
                }
            }
        }
    }

    return (<>
        <div style={{display: (metamagicRows.length ? "flex" : "none")}} className="metamagicComponentWrapper">{metamagicRows}</div>
    </>);
}