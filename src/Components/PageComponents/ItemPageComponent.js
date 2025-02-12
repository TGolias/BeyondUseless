import React from "react";
import './ItemPageComponent.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { performDiceRollCalculation } from "../../SharedFunctions/TabletopMathFunctions";

export function ItemPageComponent({item, data}) {
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

    let description = []
    const descriptionWithoutMarkup = item.description.split(/<b>|<\/b>/);
    for (let i = 0; i < descriptionWithoutMarkup.length; i++) {
        const phrase = descriptionWithoutMarkup[i];
        if (i % 2 == 1) {
            // Bold it!
            description.push(<><b>{phrase}</b></>);
        } else {
            // Don't bold it.
            description.push(<>{phrase}</>);
        }
    }

    let showItemSummary = false;

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
            <br style={{display: (showItemSummary ? "block" : "none")}}></br>
            <div className="spellPageDescription" style={{display: (showItemSummary ? "block" : "none")}}>
                <div><b>Item Summary</b></div>
            </div>
            <br></br>
            <div className="itemCopyButtonWrapper">
                <RetroButton text={"Copy Link to Item"} onClickHandler={() => copyToClipboard(item, data)} showTriangle={false} disabled={false}></RetroButton>
            </div>
            <br></br>
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