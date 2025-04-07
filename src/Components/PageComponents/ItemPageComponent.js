import React from "react";
import './ItemPageComponent.css';
import { calculateAddendumAspect, calculateAspectCollection, calculateRange, calculateWeaponAttackBonus, calculateWeaponDamage, convertDiceRollWithTypeToValue, performDiceRollCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { getValueFromObjectAndPath, parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl, playAudio } from "../../SharedFunctions/Utils";
import { RetroButton } from "../SimpleComponents/RetroButton";
import { getCollection } from "../../Collections";

export function ItemPageComponent({item, playerConfigs, pathToProperty, copyLinkToItem, setCenterScreenMenu, addToMenuStack = undefined}) {
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

                            const properties = getCollection("properties");
                            const dndProperty = properties.find(property => property.name === firstString);
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
                        const properties = getCollection("masteries");
                        const dndMastery = properties.find(mastery => mastery.name === item.mastery);
                        if (dndMastery) {
                            if (addToMenuStack) {
                                addToMenuStack();
                            }
                            setCenterScreenMenu({ show: true, menuType: "MasteryMenu", data: { menuTitle: item.mastery, mastery: dndMastery } });
                        }
                    }} showTriangle={false} disabled={false}></RetroButton> </span>
                </>);
            }

            rangeString = calculateRange(playerConfigs, item.range);
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

    let quantity = undefined;
    let childItems = [];

    if (playerConfigs) {
        const itemDescriptionAddendumString = calculateAddendumAspect(playerConfigs, "itemDescriptionAddendum", { item });
        if (itemDescriptionAddendumString) {
            itemDescriptionAddendum = parseStringForBoldMarkup(itemDescriptionAddendumString);
        }

        switch (item.type) {
            case "Weapon":
                // Weapons that are "Ranged" and "Thrown" are thrown only. That is the only group that we do not do the non-thrown calculation for.
                if (!(item.weaponRange == "Ranged" && item.properties.includes("Thrown"))) {
                    const attack = calculateWeaponAttackBonus(playerConfigs, item, false);
                    weaponAttack = attack.amount;
                    if (attack.addendum) {
                        weaponAttackAddendum = parseStringForBoldMarkup(attack.addendum);
                    }

                    weaponDamage = calculateWeaponDamage(playerConfigs, item, false, false, false);

                    if (item.properties.includes("Light")) {
                        lightWeaponDamage = calculateWeaponDamage(playerConfigs, item, false, true, false);
                    }

                    if (item.mastery === "Cleave") {
                        const weaponMasteries = calculateAspectCollection(playerConfigs, "weaponmasteries");
                        const hasWeaponMastery = item.tags.some(tag => weaponMasteries.includes(tag));
                        if (hasWeaponMastery) {
                            cleaveWeaponDamage = calculateWeaponDamage(playerConfigs, item, false, false, true);
                        }
                    }
                    showItemSummary = true;
                }

                // If the Weapon is thrown, we do a different calculation for it because the numbers could come out differently based on Fighting Style and other aspects.
                if (item.properties.includes("Thrown")) {
                    const attack = calculateWeaponAttackBonus(playerConfigs, item, true);
                    weaponAttackThrown = attack.amount;
                    if (attack.addendum) {
                        weaponAttackThrownAddendum = parseStringForBoldMarkup(attack.addendum);
                    }

                    weaponDamageThrown = calculateWeaponDamage(playerConfigs, item, true, false, false);

                    if (item.properties.includes("Light")) {
                        lightWeaponDamageThrown = calculateWeaponDamage(playerConfigs, item, true, true, false);
                    }
                    showItemSummary = true;
                }
                break;
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
                    if (itemConfig.amount) {
                        quantity = itemConfig.amount;
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
                                        const dndItems = getCollection("items");
                                        const dndItem = dndItems.find(x => x.name === childItem.name);

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
            <div className="itemPageDescription" style={{display: (quantity ? "block" : "none")}}>
                <div><b>Quantity:</b> x{quantity}</div>
            </div>
            <div className="itemPageDescription" style={{display: (childItems.length > 0 ? "block" : "none")}}>
                <div><b>Items:</b></div>
                {childItems}
            </div>
        </div>
    </>
}

function copyToClipboard(item, playerConfigs, pathToProperty) {
    navigator.clipboard.writeText(item.name + "\n" + getHomePageUrl() + "?view=item&name=" + encodeURI(item.name) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : "") + (pathToProperty ? "&pathToProperty=" + encodeURIComponent(pathToProperty) : ""));
}