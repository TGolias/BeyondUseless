import React from "react";
import './ItemPageComponent.css';
import { calculateAddendumAspect, calculateAddendumAspects, calculateAspectCollection, calculateOtherFeatureActionAspect, calculateRange, calculateWeaponAttackBonus, calculateWeaponDamage, convertDiceRollWithTypeToValue, performDiceRollCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { getValueFromObjectAndPath, parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { concatStringArrayToAndStringWithCommas, convertHashMapToArrayOfStrings, getHomePageUrl, playAudio } from "../../SharedFunctions/Utils";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { getNameDictionaryForCollection } from "../../Collections";

const rarityToSuggestedCost = {
    "Common": 100,
    "Uncommon": 400,
    "Rare": 4000,
    "Very Rare": 40000,
    "Legendary": 200000
}

const spellScrollScribeDetails = [
    { spellLevel: 0, daysToScribe: 1, costToScribe: 15 },
    { spellLevel: 1, daysToScribe: 1, costToScribe: 25 },
    { spellLevel: 2, daysToScribe: 3, costToScribe: 100 },
    { spellLevel: 3, daysToScribe: 5, costToScribe: 150 },
    { spellLevel: 4, daysToScribe: 10, costToScribe: 1000 },
    { spellLevel: 5, daysToScribe: 25, costToScribe: 1500 },
    { spellLevel: 6, daysToScribe: 40, costToScribe: 10000 },
    { spellLevel: 7, daysToScribe: 50, costToScribe: 12500 },
    { spellLevel: 8, daysToScribe: 60, costToScribe: 15000 },
    { spellLevel: 9, daysToScribe: 120, costToScribe: 50000 }
]

export function ItemPageComponent({item, playerConfigs, pathToProperty, copyLinkToItem, setCenterScreenMenu, data, addToMenuStack = undefined}) {
    const additionalEffects = data?.additionalEffects ? data.additionalEffects : [];

    let typeString;
    let baseDamage = undefined;
    let twoHandedDamage = undefined;
    let rangeString = "";
    let properties = [];
    let masteries = [];
    switch (item.type) {
        case "Weapon":
            typeString = item.weaponRange + " " + item.type + " (" + item.weaponType + ")";
            const baseDamageDice = performDiceRollCalculation({}, item.damage.calculation, {});
            baseDamage = convertDiceRollWithTypeToValue(baseDamageDice);

            if (item.properties.includes("Versatile")) {
                const twoHandedDamageDice = performDiceRollCalculation({}, item.twoHandedDamage.calculation, {});
                twoHandedDamage = convertDiceRollWithTypeToValue(twoHandedDamageDice);
            }

            if (item.properties) {
                for (let itemProperty of item.properties) {
                    if (properties.length > 0) {
                        properties.push(", ");
                    }
                    properties.push(<>
                        <span className="propertyOfTheItem"><RetroButton text={itemProperty} onClickHandler={() => {
                            const stringSplit = itemProperty.split(" ");
                            const firstString = stringSplit[0];

                            const propertyMap = getNameDictionaryForCollection("properties");
                            const dndProperty = propertyMap[firstString];
                            if (dndProperty) {
                                if (addToMenuStack) {
                                    addToMenuStack();
                                }
                                setCenterScreenMenu({ show: true, menuType: "PropertyMenu", data: { menuTitle: firstString, property: dndProperty } });
                            }
                        }} showTriangle={false} disabled={false}></RetroButton></span>
                    </>);
                }
            }

            if (item.mastery) {
                masteries.push(<>
                    <span className="propertyOfTheItem"><RetroButton text={item.mastery} onClickHandler={() => {
                        const masteryMap = getNameDictionaryForCollection("masteries");
                        const dndMastery = masteryMap[item.mastery];
                        if (dndMastery) {
                            if (addToMenuStack) {
                                addToMenuStack();
                            }
                            setCenterScreenMenu({ show: true, menuType: "MasteryMenu", data: { menuTitle: item.mastery, mastery: dndMastery } });
                        }
                    }} showTriangle={false} disabled={false}></RetroButton> </span>
                </>);
            }

            rangeString = calculateRange(playerConfigs, additionalEffects, item.range);
            if (item.properties.includes("Thrown")) {
                rangeString += " (Thrown)";
            }
            break;
        case "Armor":
            typeString = item.type + " (" + item.armorType + ")";
            break;
        default:
            typeString = item.type;
            break;
    }

    let description = parseStringForBoldMarkup(item.description);

    let costString = undefined;
    if (item.cost) {
        if (item.cost.gold) {
            costString = item.cost.gold + "GP"
        } else if (item.cost.silver) {
            costString = item.cost.silver + "SP"
        } else if (item.cost.copper) {
            costString = item.cost.copper + "CP"
        }
    } else {
        if (item.type === "Spell Scroll") {
            if (item.spellScrollLevel || item.spellScrollLevel === 0) {
                const scrollDetails = spellScrollScribeDetails[item.spellScrollLevel];
                costString = (scrollDetails.costToScribe * 2) + "GP (DMG Suggested)";
            }
        } else {
            if (item.rarity && rarityToSuggestedCost[item.rarity]) {
                let suggestedCost = rarityToSuggestedCost[item.rarity];
                if (item.consumable) {
                    suggestedCost /= 2;
                }
                costString = rarityToSuggestedCost[item.rarity] + "GP (DMG Suggested)"
            }
        }
    }

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(item, playerConfigs, pathToProperty);
        };
    }

    // Get aspects from playerConfigs
    let showItemSummary = false;
    let itemDescriptionAddendum = undefined;
    let weaponAttack = undefined;
    let weaponAttackAddendum = undefined
    let weaponDamage = undefined;
    let lightWeaponDamage = undefined;
    let cleaveWeaponDamage = undefined;
    let weaponAttackThrown = undefined;
    let weaponAttackThrownAddendum = undefined;
    let weaponDamageThrown = undefined;
    let lightWeaponDamageThrown = undefined;

    let healing = undefined;
    let healingAddendum = undefined;
    let restore = undefined;
    let buffAmount = undefined;
    let buffDescription = undefined;

    let targetNames = undefined;

    let attunedTo = undefined;
    let quantity = undefined;
    let notes = undefined;
    let childItems = [];

    if (playerConfigs) {
        const itemDescriptionAddendumString = calculateAddendumAspect(playerConfigs, "itemDescriptionAddendum", additionalEffects, { item });
        if (itemDescriptionAddendumString) {
            itemDescriptionAddendum = parseStringForBoldMarkup(itemDescriptionAddendumString);
        }

        switch (item.type) {
            case "Weapon":
                // Weapons that are "Ranged" and "Thrown" are thrown only. That is the only group that we do not do the non-thrown calculation for.
                if (!(item.weaponRange == "Ranged" && item.properties.includes("Thrown"))) {
                    const attack = calculateWeaponAttackBonus(playerConfigs, item, false, additionalEffects);
                    weaponAttack = attack.amount;
                    if (attack.addendum) {
                        weaponAttackAddendum = parseStringForBoldMarkup(attack.addendum);
                    }

                    weaponDamage = calculateWeaponDamage(playerConfigs, item, false, false, false, additionalEffects);

                    if (item.properties.includes("Light")) {
                        lightWeaponDamage = calculateWeaponDamage(playerConfigs, item, false, true, false, additionalEffects);
                    }

                    if (item.mastery === "Cleave") {
                        const weaponMasteries = calculateAspectCollection(playerConfigs, "weaponmasteries");
                        const hasWeaponMastery = item.tags.some(tag => weaponMasteries.includes(tag));
                        if (hasWeaponMastery) {
                            cleaveWeaponDamage = calculateWeaponDamage(playerConfigs, item, false, false, true, additionalEffects);
                        }
                    }
                    showItemSummary = true;
                }

                // If the Weapon is thrown, we do a different calculation for it because the numbers could come out differently based on Fighting Style and other aspects.
                if (item.properties.includes("Thrown")) {
                    const attack = calculateWeaponAttackBonus(playerConfigs, item, true, additionalEffects);
                    weaponAttackThrown = attack.amount;
                    if (attack.addendum) {
                        weaponAttackThrownAddendum = parseStringForBoldMarkup(attack.addendum);
                    }

                    weaponDamageThrown = calculateWeaponDamage(playerConfigs, item, true, false, false, additionalEffects);

                    if (item.properties.includes("Light")) {
                        lightWeaponDamageThrown = calculateWeaponDamage(playerConfigs, item, true, true, false, additionalEffects);
                    }
                    showItemSummary = true;
                }
                break;
        }

        if (item.consumeEffect && data) {
            const consumeEffect = item.consumeEffect;

            if (consumeEffect.type.includes("buff")) {
                if (consumeEffect.buff.calculation) {
                    buffAmount = calculateOtherFeatureActionAspect(playerConfigs, consumeEffect, "buff", "buffBonus", additionalEffects, { userInput: data.userInput });
                }
                buffDescription = consumeEffect.buff.description;
            }
    
            if (consumeEffect.type.includes("healing")) {
                healing = calculateOtherFeatureActionAspect(playerConfigs, consumeEffect, "healing", "healingBonus", additionalEffects, { userInput: data.userInput });
                if (healing) {
                    healingAddendum = calculateAddendumAspects(playerConfigs, ["healingAddendum"], additionalEffects, { userInput: data.userInput });
                }
            }
    
            if (consumeEffect.type.includes("restore")) {
                restore = calculateOtherFeatureActionAspect(playerConfigs, consumeEffect, "restore", "restoreBonus", additionalEffects, { userInput: data.userInput });
            }

            if (data.targetNamesMap) {
                const targetNameStrings = convertHashMapToArrayOfStrings(data.targetNamesMap);
                targetNames = concatStringArrayToAndStringWithCommas(targetNameStrings);
            }
        }

        let itemsProperty;
        if (pathToProperty === "") {
            itemsProperty = playerConfigs;
        } else {
            itemsProperty = getValueFromObjectAndPath(playerConfigs, pathToProperty);
        }
         
        if (itemsProperty) {
            const itemConfigIndex = itemsProperty.items.findIndex(x => x.name === item.name);
            if (itemConfigIndex > -1) {
                const itemConfig = itemsProperty.items[itemConfigIndex];
                if (itemConfig) {
                    if (itemConfig.attuned) {
                        attunedTo = itemConfig.attuned;
                    }

                    if (itemConfig.amount) {
                        quantity = itemConfig.amount;
                    }

                    if (itemConfig.notes) {
                        notes = itemConfig.notes;
                    }

                    if (itemConfig.items) {
                        for (let childItem of itemConfig.items) {
                            childItems.push(<>
                                <div className="itemPageChildItem" onClick={() => {
                                    playAudio("selectionaudio");
                                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                                    if (addToMenuStack) {
                                        addToMenuStack();
                                    }

                                    if (childItem.custom) {
                                        setCenterScreenMenu({ show: true, menuType: "CustomItemMenu", data: { customItem: childItem, readonly: true } });
                                    } else {
                                        const dndItemMap = getNameDictionaryForCollection("items");
                                        const dndItem = dndItemMap[childItem.name];

                                        let newPathToProperty = "";
                                        if (pathToProperty) {
                                            newPathToProperty = pathToProperty + ".";
                                        }
                                        newPathToProperty += "items[" + itemConfigIndex + "]";
                                        setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem, pathToProperty: newPathToProperty } });
                                    }
                                }}>{childItem.name + (childItem.amount ? " x" + childItem.amount : "")}</div>
                            </>);
                        }
                    }
                }
            }
        }
    }

    return <>
        <div className="itemPageContainer">
            <div>{typeString}</div>
            <div style={{display: (baseDamage ? "block" : "none")}}><b>Base Damage:</b> {baseDamage}</div>
            <div style={{display: (twoHandedDamage ? "block" : "none")}}><b>Two-Handed:</b> {twoHandedDamage}</div>
            <div style={{display: (rangeString ? "block" : "none")}}><b>Range:</b> {rangeString}</div>
            <div style={{display: (properties.length > 0 ? "block" : "none")}}><b>Properties:</b> {properties}</div>
            <div style={{display: (masteries.length > 0 ? "block" : "none")}}><b>Mastery:</b> {masteries}</div>
            <div><b>Item Rarity:</b> {item.rarity}</div>
            <div><b>Weight:</b> {item.weight}</div>
            <div style={{display: (costString ? "block" : "none")}}>
                <div><b>Cost:</b> {costString}</div>
            </div>
            <div className="itemPageDescription">{description}</div>
            <div style={{display: (itemDescriptionAddendum ? "block" : "none")}} className="itemPageDescription">{itemDescriptionAddendum}</div>
            <br style={{display: (showItemSummary ? "block" : "none")}}></br>
            <div className="itemPageDescription" style={{display: (showItemSummary ? "block" : "none")}}>
                <div><b>Item Summary</b></div>
            </div>
            <div className="itemPageDescription" style={{display: (weaponAttack ? "block" : "none")}}>
                <div><b>Attack Roll:</b> +{weaponAttack}</div>
            </div>
            <div className="itemPageDescription" style={{display: (weaponAttackAddendum ? "block" : "none")}}>
                <div>{weaponAttackAddendum}</div>
            </div>
            <div className="itemPageDescription" style={{display: (weaponDamage ? "block" : "none")}}>
                <div><b>Damage:</b> {weaponDamage}</div>
            </div>
            <div className="itemPageDescription" style={{display: (lightWeaponDamage ? "block" : "none")}}>
                <div><b>Light Damage:</b> {lightWeaponDamage}</div>
            </div>
            <div className="itemPageDescription" style={{display: (cleaveWeaponDamage ? "block" : "none")}}>
                <div><b>Cleave Damage:</b> {cleaveWeaponDamage}</div>
            </div>
            <br style={{display: (weaponAttackThrown ? "block" : "none")}}></br>
            <div className="itemPageDescription" style={{display: (weaponAttackThrown ? "block" : "none")}}>
                <div><b>Thrown Attack:</b> +{weaponAttackThrown}</div>
            </div>
            <div className="itemPageDescription" style={{display: (weaponAttackThrownAddendum ? "block" : "none")}}>
                <div>{weaponAttackThrownAddendum}</div>
            </div>
            <div className="itemPageDescription" style={{display: (weaponDamageThrown ? "block" : "none")}}>
                <div><b>Thrown Damage:</b> {weaponDamageThrown}</div>
            </div>
            <div className="itemPageDescription" style={{display: (lightWeaponDamageThrown ? "block" : "none")}}>
                <div><b>Light Thrown Damage:</b> {lightWeaponDamageThrown}</div>
            </div>
            <div className="itemPageDescription" style={{display: (healing ? "block" : "none")}}>
                <div><b>Healing:</b> {healing}</div>
            </div>
            <div className="itemPageDescription" style={{display: (healingAddendum ? "block" : "none")}}>
                <div>{parseStringForBoldMarkup(healingAddendum)}</div>
            </div>
            <div className="itemPageDescription" style={{display: (restore ? "block" : "none")}}>
                <div><b>Conditions Removed:</b> {restore}</div>
            </div>
            <div className="itemPageDescription" style={{display: (buffAmount || buffDescription ? "block" : "none")}}>
                <div><b>Buff:</b> {(buffAmount ? buffAmount + " " : "")}{parseStringForBoldMarkup(buffDescription)}</div>
            </div>
            <div className="itemPageDescription" style={{display: (attunedTo ? "block" : "none")}}>
                <div><b>Attuned To:</b> {attunedTo}</div>
            </div>
            <div className="itemPageDescription" style={{display: (quantity ? "block" : "none")}}>
                <div><b>Quantity:</b> x{quantity}</div>
            </div>
            <div className="itemPageDescription" style={{display: (childItems.length > 0 ? "block" : "none")}}>
                <div><b>Items:</b></div>
                {childItems}
            </div>
            <div className="itemPageDescription" style={{display: (targetNames ? "block" : "none")}}>
                <div><b>Applied To:</b> {targetNames}</div>
            </div>
            <div className="itemPageDescription" style={{display: (notes ? "block" : "none")}}>
                <div><b>Notes:</b><b></b> {notes}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(item, playerConfigs, pathToProperty) {
    navigator.clipboard.writeText(item.name + "\n" + getHomePageUrl() + "?view=item&name=" + encodeURI(item.name) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : "") + (pathToProperty ? "&pathToProperty=" + encodeURIComponent(pathToProperty) : ""));
}