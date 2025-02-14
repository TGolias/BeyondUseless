import React from "react";
import './ItemPageComponent.css';
import { calculateAddendumAspect, calculateWeaponAttackBonus, calculateWeaponDamage, performDiceRollCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { encodeToBase64URL, getHomePageUrl } from "../../SharedFunctions/Utils";

export function ItemPageComponent({item, data, copyLinkToItem}) {
    let typeString;
    let baseDamage = undefined;
    let twoHandedDamage = undefined;
    let rangeString = "";
    let propertiesString = "";
    let masteriesString = "";
    switch (item.type) {
        case "Weapon":
            typeString = item.weaponRange + " " + item.type + " (" + item.weaponType + ")";
            baseDamage = performDiceRollCalculation({}, item.damage.calcuation, {});
            baseDamage += " " + item.damage.damageType;

            if (item.properties.includes("Versatile")) {
                twoHandedDamage = performDiceRollCalculation({}, item.twoHandedDamage.calcuation, {});
                twoHandedDamage += " " + item.twoHandedDamage.damageType;
            }

            if (item.properties) {
                for (let property of item.properties) {
                    if (propertiesString.length > 0) {
                        propertiesString += ", ";
                    }
                    propertiesString += property; 
                }
            }

            if (item.mastery) {
                masteriesString = item.mastery;
            }

            if (item.weaponRange === "Ranged") {
                rangeString = item.range;
            } else if (item.properties.includes("Thrown")) {
                rangeString = item.range + " " + ("(Thrown)");
            }
            break;
        case "Armor":
            typeString = item.type + " (" + item.armorType + ")";
        default:
            typeString = item.type;
            break;
    }

    let description = parseStringForBoldMarkup(item.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(item, data);
        };
    }

    // Get aspects from playerConfigs
    let itemDescriptionAddendum = undefined;
    let weaponAttack = undefined;
    let weaponAttackAddendum = undefined
    let weaponDamage = undefined;
    let weaponAttackThrown = undefined;
    let weaponAttackThrownAddendum = undefined;
    let weaponDamageThrown = undefined;

    if (data) {
        const itemDescriptionAddendumString = calculateAddendumAspect(data.playerConfigs, "itemDescriptionAddendum", { item });
        if (itemDescriptionAddendumString) {
            itemDescriptionAddendum = parseStringForBoldMarkup(itemDescriptionAddendumString);
        }

        switch (item.type) {
            case "Weapon":
                // Weapons that are "Ranged" and "Thrown" are thrown only. That is the only group that we do not do the non-thrown calculation for.
                if (!(item.weaponRange == "Ranged" && item.properties.includes("Thrown"))) {
                    const attack = calculateWeaponAttackBonus(data.playerConfigs, item, false);
                    weaponAttack = attack.amount;
                    if (attack.addendum) {
                        weaponAttackAddendum = parseStringForBoldMarkup(attack.addendum);
                    }

                    weaponDamage = calculateWeaponDamage(data.playerConfigs, item, false);
                    weaponDamage += " " + item.damage.damageType;
                }

                // If the Weapon is thrown, we do a different calculation for it because the numbers could come out differently based on Fighting Style and other aspects.
                if (item.properties.includes("Thrown")) {
                    const attack = calculateWeaponAttackBonus(data.playerConfigs, item, true);
                    weaponAttackThrown = attack.amount;
                    if (attack.addendum) {
                        weaponAttackThrownAddendum = parseStringForBoldMarkup(attack.addendum);
                    }

                    weaponDamageThrown = calculateWeaponDamage(data.playerConfigs, item, true);
                    weaponDamageThrown += " " + item.damage.damageType;
                }
                break;
        }
    }

    return <>
        <div className="itemPageContainer">
            <div>{typeString}</div>
            <div style={{display: (baseDamage ? "block" : "none")}}><b>Base Damage:</b> {baseDamage}</div>
            <div style={{display: (twoHandedDamage ? "block" : "none")}}><b>Two-Handed:</b> {twoHandedDamage}</div>
            <div style={{display: (rangeString ? "block" : "none")}}><b>Range:</b> {rangeString}</div>
            <div style={{display: (propertiesString ? "block" : "none")}}><b>Properties:</b> {propertiesString}</div>
            <div style={{display: (masteriesString ? "block" : "none")}}><b>Mastery:</b> {masteriesString}</div>
            <div><b>Item Rarity:</b> {item.rarity}</div>
            <div><b>Weight:</b> {item.weight}</div>
            <div className="itemPageDescription">{description}</div>
            <div style={{display: (itemDescriptionAddendum ? "block" : "none")}} className="itemPageDescription">{itemDescriptionAddendum}</div>
            <br style={{display: (data ? "block" : "none")}}></br>
            <div className="itemPageDescription" style={{display: (data ? "block" : "none")}}>
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
            <div className="itemPageDescription" style={{display: (weaponAttackThrown ? "block" : "none")}}>
                <div><b>Thrown Attack:</b> +{weaponAttackThrown}</div>
            </div>
            <div className="itemPageDescription" style={{display: (weaponAttackThrownAddendum ? "block" : "none")}}>
                <div>{weaponAttackThrownAddendum}</div>
            </div>
            <div className="itemPageDescription" style={{display: (weaponDamageThrown ? "block" : "none")}}>
                <div><b>Thrown Damage:</b> {weaponDamageThrown}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(item, data) {
    const stringifiedJson = JSON.stringify(data);
    const encodedData = encodeToBase64URL(stringifiedJson);
    navigator.clipboard.writeText(item.name + "\n" + getHomePageUrl() + "?view=item&name=" + encodeURI(item.name) + "&data=" + encodeURI(encodedData));
}