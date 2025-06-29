import React from "react";
import './UnarmedStrikePageComponent.css';
import { calculateAddendumAspect, calculateRange, calculateSavingThrowTypes, calculateUnarmedAttackBonus, calculateUnarmedAttackDC, calculateUnarmedDamage } from "../../SharedFunctions/TabletopMathFunctions";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";
import { getNameDictionaryForCollection } from "../../Collections";

export function UnarmedStrikePageComponent({unarmedStrike, playerConfigs, copyLinkToItem}) {
    let actionTime = "";
    if (Array.isArray(unarmedStrike.actionTime)) {
        for (let singleActionTime of unarmedStrike.actionTime) {
            if (actionTime.length > 0) {
                actionTime += " or "
            }
            actionTime += singleActionTime;
        }
    } else {
        actionTime = unarmedStrike.castingTime;
    }
    const range = calculateRange(playerConfigs, [], unarmedStrike.range);
    let description = parseStringForBoldMarkup(unarmedStrike.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(unarmedStrike, playerConfigs);
        };
    }

    // Get aspects from playerConfigs
    let itemDescriptionAddendum = undefined;
    let unarmedAttackBonus = undefined;
    let unarmedAttackAddendum = undefined;
    let savingThrowType = undefined;
    let savingThrowDc = undefined;
    let savingThrowDcAddendum = undefined;
    let unarmedDamage = undefined;
    let debuffDescription = undefined;

    if (playerConfigs) {
        const itemDescriptionAddendumString = calculateAddendumAspect(playerConfigs, "unarmedAttackDescriptionAddendum", [], { unarmedStrike });
        if (itemDescriptionAddendumString) {
            itemDescriptionAddendum = parseStringForBoldMarkup(itemDescriptionAddendumString);
        }

        if (unarmedStrike.challengeType === "savingThrow") {
            savingThrowType = calculateSavingThrowTypes(unarmedStrike.savingThrowType);

            const savingThrowCalc = calculateUnarmedAttackDC(playerConfigs);
            savingThrowDc = savingThrowCalc.dc;
            if (savingThrowCalc.addendum) {
                savingThrowDcAddendum = parseStringForBoldMarkup(savingThrowCalc.addendum);
            }
        } else {
            const attack = calculateUnarmedAttackBonus(playerConfigs);
            unarmedAttackBonus = attack.amount;
            if (attack.addendum) {
                unarmedAttackAddendum = parseStringForBoldMarkup(attack.addendum);
            }
        }

        if (unarmedStrike.type.includes("damage")) {
            unarmedDamage = calculateUnarmedDamage(playerConfigs);
            unarmedDamage += " Bludgeoning";
        }

        if (unarmedStrike.type.includes("debuff")) {
            debuffDescription = unarmedStrike.debuff.description;
            if (unarmedStrike.debuff.conditions) {
                if (!debuffDescription) {
                    debuffDescription = "";
                }
                const allConditionsMap = getNameDictionaryForCollection("conditions");
                for (let condition of unarmedStrike.debuff.conditions) {
                    const dndCondition = allConditionsMap[condition];
                    if (debuffDescription.length > 0) {
                        debuffDescription += "\n\n";
                    }
                    debuffDescription += "<b>" + dndCondition.name + ".</b> " + dndCondition.description;
                }
            }
        }
    }

    return <>
        <div className="unarmedAttackPageContainer">
            <div><b>Action Time:</b> {actionTime}</div>
            <div><b>Range:</b> {range}</div>
            <div className="unarmedAttackPageDescription">{description}</div>
            <div style={{display: (itemDescriptionAddendum ? "block" : "none")}} className="unarmedAttackPageDescription">{itemDescriptionAddendum}</div>
            <br style={{display: (playerConfigs ? "block" : "none")}}></br>
            <div className="unarmedAttackPageDescription" style={{display: (playerConfigs ? "block" : "none")}}>
                <div><b>Item Summary</b></div>
            </div>
            <div className="unarmedAttackPageDescription" style={{display: (unarmedAttackBonus ? "block" : "none")}}>
                <div><b>Attack Roll:</b> +{unarmedAttackBonus}</div>
            </div>
            <div className="unarmedAttackPageDescription" style={{display: (unarmedAttackAddendum ? "block" : "none")}}>
                <div>{unarmedAttackAddendum}</div>
            </div>
            <div className="unarmedAttackPageDescription" style={{display: (savingThrowType ? "block" : "none")}}>
                <div><b>DC{savingThrowDc}</b> {savingThrowType}</div>
            </div>
            <div className="unarmedAttackPageDescription" style={{display: (savingThrowDcAddendum ? "block" : "none")}}>
                <div>{savingThrowDcAddendum}</div>
            </div>
            <div className="unarmedAttackPageDescription" style={{display: (unarmedDamage ? "block" : "none")}}>
                <div><b>Damage:</b> {unarmedDamage}</div>
            </div>
            <div className="unarmedAttackPageDescription" style={{display: (debuffDescription ? "block" : "none")}}>
                <div><b>Debuff:</b> {parseStringForBoldMarkup(debuffDescription)}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(unarmedStrike, playerConfigs) {
    navigator.clipboard.writeText(unarmedStrike.name + "\n" + getHomePageUrl() + "?view=unarmedstrike&name=" + encodeURI(unarmedStrike.name) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : ""));
}