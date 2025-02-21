import React from "react";
import './FeatureActionPageComponent.css';
import { getCapitalizedAbilityScoreName, parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { convertArrayToDictionary, getHomePageUrl } from "../../SharedFunctions/Utils";
import { calculateOtherFeatureActionAspect, calculateSpellAttack, calculateSpellSaveDC, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { getCollection } from "../../Collections";

export function FeatureActionPageComponent({featureAction, feature, origin, data, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(featureAction.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(featureAction, feature, origin, data);
        };
    }

    let showActionSummary = false;
    let attackRoll = undefined;
    let attackRollAddendum = undefined
    let savingThrowType = undefined;
    let savingThrowDc = undefined;
    let savingThrowDcAddendum = undefined;
    let damage = undefined;
    let healing = undefined;
    let restore = undefined
    let buffAmount = undefined;
    let buffDescription = undefined;
    let debuffAmount = undefined;
    let debuffDescription = undefined;
    if (data) {
        // This works for now... We probably will need something better to get the associated spellcasting ability eventually.
        featureAction.feature = origin.value.features.find(feature => feature.spellcasting);

        if (featureAction.challengeType === "attackRoll") {
            showActionSummary = true;
            const attack = calculateSpellAttack(data.playerConfigs, featureAction, undefined)
            attackRoll = attack.amount;
            if (attack.addendum) {
                attackRollAddendum = parseStringForBoldMarkup(attack.addendum);
            }
        }

        if (featureAction.challengeType === "savingThrow") {
            showActionSummary = true;
            savingThrowType = featureAction.savingThrowType;

            const savingThrowCalc = calculateSpellSaveDC(data.playerConfigs, featureAction, undefined);
            savingThrowDc = savingThrowCalc.dc;
            if (savingThrowCalc.addendum) {
                savingThrowDcAddendum = parseStringForBoldMarkup(savingThrowCalc.addendum);
            }
        }

        if (featureAction.type.includes("damage")) {
            showActionSummary = true;
            damage = calculateOtherFeatureActionAspect(data.playerConfigs, featureAction, "damage", "spellDamageBonus", { userInput: data.userInput });
            damage += " " + featureAction.damage.damageType;
        }

        if (featureAction.type.includes("buff")) {
            showActionSummary = true;
            if (featureAction.buff.calcuation) {
                buffAmount = calculateOtherFeatureActionAspect(data.playerConfigs, featureAction, "buff", "buffBonus", { userInput: data.userInput });
            }
            buffDescription = featureAction.buff.description;
        }

        if (featureAction.type.includes("debuff")) {
            showActionSummary = true;
            if (featureAction.debuff.calcuation) {
                debuffAmount = calculateOtherFeatureActionAspect(data.playerConfigs, featureAction, "debuff", "debuffBonus", { userInput: data.userInput });
            }
            debuffDescription = featureAction.debuff.description;
            if (featureAction.debuff.conditions) {
                if (!debuffDescription) {
                    debuffDescription = "";
                }
                const allConditions = getCollection("conditions");
                const allConditionsMap = convertArrayToDictionary(allConditions, "name");
                for (let condition of featureAction.debuff.conditions) {
                    const dndCondition = allConditionsMap[condition];
                    if (debuffDescription.length > 0) {
                        debuffDescription.length += "\n\n";
                    }
                    debuffDescription += "<b>" + dndCondition.name + ".</b> " + dndCondition.description;
                }
            }
        }

        if (featureAction.type.includes("healing")) {
            showActionSummary = true;
            healing = calculateOtherFeatureActionAspect(data.playerConfigs, featureAction, "healing", "healingBonus", { userInput: data.userInput });
            if (healing.length === 0) {
                healing = "0";
            }
        }

        if (featureAction.type.includes("restore")) {
            showActionSummary = true;
            restore = calculateOtherFeatureActionAspect(data.playerConfigs, featureAction, "restore", "restoreBonus", { userInput: data.userInput });
            if (restore.length === 0) {
                restore = "(none)";
            }
        }
    }

    return <>
        <div className="featureActionPageContainer">
            <div className="featureActionPageDescription">{description}</div>
            <br style={{display: (showActionSummary ? "block" : "none")}}></br>
            <div className="featureActionPageDescription" style={{display: (showActionSummary ? "block" : "none")}}>
                <div><b>Action Summary</b></div>
            </div>
            <div className="featureActionPageDescription" style={{display: (attackRoll ? "block" : "none")}}>
                <div><b>Attack Roll:</b> +{attackRoll}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (attackRollAddendum ? "block" : "none")}}>
                <div>{attackRollAddendum}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (savingThrowType ? "block" : "none")}}>
                <div><b>DC{savingThrowDc}</b> {getCapitalizedAbilityScoreName(savingThrowType)}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (savingThrowDcAddendum ? "block" : "none")}}>
                <div>{savingThrowDcAddendum}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (damage ? "block" : "none")}}>
                <div><b>Damage:</b> {damage}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (healing ? "block" : "none")}}>
                <div><b>Healing:</b> {healing}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (restore ? "block" : "none")}}>
                <div><b>Conditions Removed:</b> {restore}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (buffDescription ? "block" : "none")}}>
                <div><b>Buff:</b> {(buffAmount ? buffAmount + " " : "")}{buffDescription}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (debuffDescription ? "block" : "none")}}>
                <div><b>Debuff:</b> {debuffAmount ? debuffAmount + " " : ""}{parseStringForBoldMarkup(debuffDescription)}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (feature ? "block" : "none")}}>
                <div><b>Learned from:</b> {origin.value.name} - {feature.name}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(featureAction, feature, origin, data) {
    const stringifiedJson = JSON.stringify(data);
    navigator.clipboard.writeText(featureAction.name + "\n" + getHomePageUrl() + "?view=featureaction&name=" + encodeURI(featureAction.name) + "&featurename=" + encodeURI(feature.name) + "&origintype=" + encodeURI(origin.type) + "&originname=" + encodeURI(origin.value.name) + "&data=" + encodeURIComponent(stringifiedJson));
}