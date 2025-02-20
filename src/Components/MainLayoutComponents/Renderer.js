import { calculateAspectCollection, calculateBaseStat, calculateInitiativeBonus, calculatePassivePerception, calculateProficiencyBonus, calculateSize, calculateSpeed, getAllActionFeatures, getAllSpellcastingFeatures, getSpellcastingLevel } from "../../SharedFunctions/TabletopMathFunctions";
import './Renderer.css';
import React from "react";
import { StatDisplay } from "../DisplayComponents/StatDisplay";
import { ArmorClassDisplay } from "../DisplayComponents/ArmorClassDisplay";
import { HPandLVLDisplay } from "../DisplayComponents/HPandLVLDisplay";
import { HeroicInspirationDisplay } from "../DisplayComponents/HeroicInspirationDisplay";
import { DeathSavingThrowsDisplay } from "../DisplayComponents/DeathSavingThrowsDisplay";
import { BasicStatDisplay } from "../DisplayComponents/BasicStatDisplay";
import { WeaponsAndDamageCantrips } from "../DisplayComponents/WeaponsAndDamageCantrips";
import { SpellcastingDisplay } from "../DisplayComponents/SpellcastingDisplay";
import { SpellSlotsDisplay } from "../DisplayComponents/SpellSlotsDisplay";
import { OtherActionsDisplay } from "../DisplayComponents/OtherActionsDisplay";
import { FeatureActionsDisplay } from "../DisplayComponents/FeatureActionsDisplay";
import { ConditionsDisplay } from "../DisplayComponents/ConditionsDisplay";
import { AddOrUpdateCondition, RemoveConditionByName } from "../../SharedFunctions/ConditionFunctions";
import { SetPlayerDead } from "../../SharedFunctions/DeathFunctions";

export function Renderer({playerConfigs, inputChangeHandler, setCenterScreenMenu, showDeathScreen}) {
    const languagesString = calculateAspectCollection(playerConfigs, "languages").join(", ");
    
    const proficiencyBonus = calculateProficiencyBonus(playerConfigs);
    const initiativeBonus = calculateInitiativeBonus(playerConfigs);
    const speed = calculateSpeed(playerConfigs);
    const size = calculateSize(playerConfigs);
    const passivePerception = calculatePassivePerception(playerConfigs);

    const conditions = playerConfigs.currentStatus.conditions ?? [];

    const showDeathSavingThrows = playerConfigs.currentStatus.remainingHp === 0;

    const actionFeatures = getAllActionFeatures(playerConfigs);

    const spellcastingLevel = getSpellcastingLevel(playerConfigs);
    const spellcastingFeatures = getAllSpellcastingFeatures(playerConfigs);

    return (
        <>
            <div className="outerDiv">
                <div className="playerName">{playerConfigs.name}</div>
                <div className="healthBarAndDefense">
                    <HPandLVLDisplay playerConfigs={playerConfigs} inputChangeHandler={inputChangeHandler} setCenterScreenMenu={setCenterScreenMenu} playLowHpAudio={true}></HPandLVLDisplay>
                    <ArmorClassDisplay playerConfigs={playerConfigs}></ArmorClassDisplay>
                </div>
                <div style={{display: (conditions.length > 0 ? "block" : "none")}}>
                    <ConditionsDisplay setCenterScreenMenu={setCenterScreenMenu} conditions={conditions} onAddOrUpdate={(newCondition) => onAddCondition(playerConfigs, inputChangeHandler, newCondition, showDeathScreen)} onRemove={(conditionNameToRemove) => onRemoveCondition(playerConfigs, inputChangeHandler, conditionNameToRemove)}></ConditionsDisplay>
                </div>
                <div style={{display: (showDeathSavingThrows ? "block" : "none")}}>
                    <DeathSavingThrowsDisplay playerConfigs={playerConfigs} inputChangeHandler={inputChangeHandler} showDeathScreen={showDeathScreen}></DeathSavingThrowsDisplay>
                </div>
                <div className="encounterStats">
                    <BasicStatDisplay statValue={(initiativeBonus >= 0) ? "+" + initiativeBonus : initiativeBonus}>Initiative</BasicStatDisplay>
                    <BasicStatDisplay statValue={speed}>Speed</BasicStatDisplay>
                    <BasicStatDisplay statValue={size}>Size</BasicStatDisplay>
                    <BasicStatDisplay statValue={passivePerception}>Passive<br></br>Perception</BasicStatDisplay>
                </div>
                <div className="baseStats">
                    <BasicStatDisplay statValue={"+" + proficiencyBonus}>Proficency<br></br>Bonus</BasicStatDisplay>
                    <StatDisplay name="strength" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "strength")}/>
                    <StatDisplay name="dexterity" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "dexterity")}/>
                    <StatDisplay name="constitution" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "constitution")}/>
                    <HeroicInspirationDisplay playerConfigs={playerConfigs} inputChangeHandler={inputChangeHandler}/>
                    <StatDisplay name="intelligence" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "intelligence")}/>
                    <StatDisplay name="wisdom" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "wisdom")}/>
                    <StatDisplay name="charisma" playerConfigs={playerConfigs} value={calculateBaseStat(playerConfigs, "charisma")}/>
                </div>
                <div>
                    <WeaponsAndDamageCantrips playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu}></WeaponsAndDamageCantrips>
                </div>
                <div style={{display: (actionFeatures.length > 0 ? "block" : "none")}}>
                    <FeatureActionsDisplay playerConfigs={playerConfigs} actionFeatures={actionFeatures} setCenterScreenMenu={setCenterScreenMenu}></FeatureActionsDisplay>
                </div>
                <div style={{display: (spellcastingLevel > 0 ? "block" : "none")}}>
                    <SpellSlotsDisplay playerConfigs={playerConfigs} casterLevel={spellcastingLevel}></SpellSlotsDisplay>
                </div>
                <div style={{display: (spellcastingFeatures.length > 0 ? "block" : "none")}}>
                    <SpellcastingDisplay playerConfigs={playerConfigs} spellcastingFeatures={spellcastingFeatures} setCenterScreenMenu={setCenterScreenMenu}></SpellcastingDisplay>
                </div>
                <div>
                    <OtherActionsDisplay setCenterScreenMenu={setCenterScreenMenu}></OtherActionsDisplay>
                </div>
                <div className="textEntry" style={{display: (languagesString ? "block" : "none")}}>
                    <div>Languages: {languagesString}</div>
                </div>
                <br/>
            </div>
        </>
    );
}

function onAddCondition(playerConfigs, inputChangeHandler, newCondition, showDeathScreen) {
    const newConditions = AddOrUpdateCondition(playerConfigs.currentStatus.conditions, newCondition);
    if (newCondition.name === "Exhaustion" && newCondition.level === 6) {
        // First check if we hit exhaustion 6... That's insta-death.
        const newPlayerConfigs = {...playerConfigs};
        newPlayerConfigs.currentStatus = {...(playerConfigs.currentStatus ?? {})};
        newPlayerConfigs.currentStatus.conditions = newConditions;

        SetPlayerDead(newPlayerConfigs);
        inputChangeHandler(playerConfigs, "currentStatus", newPlayerConfigs.currentStatus);
        showDeathScreen();
    } else {
        inputChangeHandler(playerConfigs, "currentStatus.conditions", newConditions);
    }
}

function onRemoveCondition(playerConfigs, inputChangeHandler, conditionNameToRemove) {
    const newConditions = RemoveConditionByName(playerConfigs.currentStatus.conditions, conditionNameToRemove);
    if (newConditions) {
        inputChangeHandler(playerConfigs, "currentStatus.conditions", newConditions);
    }
}