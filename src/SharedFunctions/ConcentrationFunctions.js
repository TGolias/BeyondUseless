import { getCollection } from "../Collections";
import { calculateCurrentHp } from "./HPFunctions";
import { calculateAddendumAspect, calculateAspectCollection } from "./TabletopMathFunctions";
import { addLeadingPlusIfNumericAndPositive, convertArrayToDictionary } from "./Utils";

export function isPlayerCurrentlyConcentrating(playerConfigs) {
    const playerActiveEffects = playerConfigs.currentStatus.activeEffects;
    if (playerActiveEffects && playerActiveEffects.length > 0) {
        // Check if the character has an active affect on them with concentration that is not from a different character.
        const currentEffectWithConcentration = playerActiveEffects.find(effect => !effect.fromRemoteCharacter && effect.concentration);
        return currentEffectWithConcentration;
    }
    return false;
}

const addendumsToShowForConstitutionSavingThrows = ["constitutionSavingThrowAddendum", "allSavingThrowAddendum"];

export function showConcentrationMenuIfConcentrating(oldPlayerConfigs, newPlayerConfigs, setCenterScreenMenu, callback) {
    const currentEffectWithConcentration = isPlayerCurrentlyConcentrating(newPlayerConfigs);
    if (currentEffectWithConcentration) {
        const oldHp = calculateCurrentHp(oldPlayerConfigs);
        const newHp = calculateCurrentHp(newPlayerConfigs);

        const hasConditionThatRemovesConcentration = playerHasConditionThatRemovesConcentration(newPlayerConfigs);
        if (hasConditionThatRemovesConcentration || newHp < oldHp) {
            if (hasConditionThatRemovesConcentration || newHp === 0) {
                // You drop to zero, you lose concentration.
                newPlayerConfigs.currentStatus.activeEffects = newPlayerConfigs.currentStatus.activeEffects ? [...newPlayerConfigs.currentStatus.activeEffects] : [];
                removeConcentrationFromPlayerConfigs(newPlayerConfigs);
                callback();
            } else {
                const damageTaken = oldHp - newHp;
            
                const damageTakenString = "Took <b>" + damageTaken + "</b> damage.";
                const currentEffect = "Currently concentrating on <b>" + currentEffectWithConcentration.name + "</b>.";
                const concentrationText = "If you take damage, you must succeed on a Constitution saving throw to maintain Concentration. The DC equals 10 or half the damage taken (round down), whichever number is higher, up to a maximum DC of 30.";
                
                const halfDamageTaken = Math.floor(damageTaken / 2);
                let dc;
                if (halfDamageTaken < 10) {
                    dc = 10;
                } else if (halfDamageTaken > 30) {
                    dc = 30;
                } else {
                    dc = halfDamageTaken;
                }

                const dcString = "Must pass DC " + dc + " Constitution saving throw.";

                const constitutionSavingThrowBonus = calculateAspectCollection(newPlayerConfigs, "constitutionSavingThrow");

                let savingThrowBonusString = addLeadingPlusIfNumericAndPositive(constitutionSavingThrowBonus) + " to Constitution saving throws."

                for (let addendumToShow of addendumsToShowForConstitutionSavingThrows) {
                    const addendumString = calculateAddendumAspect(newPlayerConfigs, addendumToShow);
                    if (addendumString) {
                        savingThrowBonusString += "\n\n" + addendumString;
                    }
                }

                const finalQuery = "Was the Constitution saving throw passed?";
                setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: {
                    menuTitle: "Maintain Concentration", 
                    menuText: damageTakenString + "\n\n" + currentEffect + "\n\n" + concentrationText + "\n\n" + dcString + "\n\n" + savingThrowBonusString + "\n\n" + finalQuery, 
                    buttons: [
                    {
                        text: "Yes",
                        onClick: () => {
                            callback();
                        }
                    },
                    {
                        text: "No",
                        onClick: () => {
                            newPlayerConfigs.currentStatus.activeEffects = newPlayerConfigs.currentStatus.activeEffects ? [...newPlayerConfigs.currentStatus.activeEffects] : [];
                            removeConcentrationFromPlayerConfigs(newPlayerConfigs);
                            callback();
                        }
                    }
                ] } });
            }
        } else {
            // Our HP is the same or higher... No need for a concentration roll.
            callback();
        }
    } else {
        // We aren't concentrating on anything... No need for a concentration roll.
        callback();
    }
}

export function removeConcentrationFromPlayerConfigs(playerConfigsClone) {
    // Remove the concentration effect.
    for (let index = 0; index < playerConfigsClone.currentStatus.activeEffects.length; index++) {
        const activeEffect = playerConfigsClone.currentStatus.activeEffects[index];
        if (!activeEffect.fromRemoteCharacter && activeEffect.concentration) {
            // There is an effect with concentration and it isn't from another character. Remove it!
            playerConfigsClone.currentStatus.activeEffects.splice(index, 1);

            // We just removed an index from an array we are in the middle of looping through. Check this index again, there will be a new value there (unless we've reached the end).
            index--; 
        }
    }
}

export function playerHasConditionThatRemovesConcentration(playerConfigs) {
    if (playerConfigs.currentStatus.conditions) {
        const dndConditions = getCollection("conditions");
        const dndConditionsMap = convertArrayToDictionary(dndConditions, "name");
        for (let condition of playerConfigs.currentStatus.conditions) {
            const dndCondition = dndConditionsMap[condition.name];
            if (dndCondition && (dndCondition.name === "Incapacitated" || (dndCondition.additionalConditions && dndCondition.additionalConditions.includes("Incapacitated")))) {
                return true;
            }
        }
    }
    return false;
}