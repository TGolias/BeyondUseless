import React from "react";
import './ItemPageComponent.css';
import { performDiceRollCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";

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

    // Get aspects from data
    let itemDescriptionAddendum = undefined;
    let weaponAttack = undefined;
    let weaponAttackAddendum = undefined
    let weaponDamage = undefined;
    let weaponAttackThrown = undefined;
    let weaponAttackThrownAddendum = undefined;
    let weaponDamageThrown = undefined;
    if (data) {
        if (data.itemDescriptionAddendum) {
            itemDescriptionAddendum = parseStringForBoldMarkup(data.itemDescriptionAddendum);
        }
        if (data.weaponAttack) {
            weaponAttack = data.weaponAttack;
        }
        if (data.weaponAttackAddendum) {
            weaponAttackAddendum = parseStringForBoldMarkup(data.weaponAttackAddendum);
        }
        if (data.weaponDamage) {
            weaponDamage = data.weaponDamage;
        }
        if (data.weaponAttackThrown) {
            weaponAttackThrown = data.weaponAttackThrown;
        }
        if (data.weaponAttackThrownAddendum) {
            weaponAttackThrownAddendum = parseStringForBoldMarkup(data.weaponAttackThrownAddendum);
        }
        if (data.weaponDamageThrown) {
            weaponDamageThrown = data.weaponDamageThrown;
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
    const encodedData = btoa(stringifiedJson);
    const indexOfQuery = window.location.href.indexOf('?');
    const windowLocationWithoutQueryParams = indexOfQuery === -1 ? window.location.href : window.location.href.substring(0, indexOfQuery);
    navigator.clipboard.writeText(item.name + "\n" + encodeURI(windowLocationWithoutQueryParams+ "?view=item&name=" + item.name + "&data=" + encodedData));
}