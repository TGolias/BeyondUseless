import { calculateAspectCollection, calculateBaseStat, calculateInitiativeBonus, calculatePassivePerception, calculateProficiencyBonus, calculateSize, calculateSpeed, getAllActionFeatures, getAllConsumableActionItems, getAllFeatures, getAllSpellcastingFeatures, getItemFromItemTemplate, getPactSlotLevel, getSpellcastingLevel } from "../../SharedFunctions/TabletopMathFunctions";
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
import { addLeadingPlusIfNumericAndPositive, concatStringArrayToAndStringWithCommas, playAudio } from "../../SharedFunctions/Utils";
import { ActiveEffectsDisplay } from "../DisplayComponents/ActiveEffectsDisplay";
import { getNameDictionaryForCollection } from "../../Collections";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { InventoryDisplay } from "../DisplayComponents/InventoryDisplay";
import { addItemsToNewItems } from "../../SharedFunctions/ItemFunctions";
import { ItemActionsDisplay } from "../DisplayComponents/ItemActionsDisplay";
import { TabScroller } from "../SimpleComponents/TabScroller";

export function Renderer({playerConfigs, inputChangeHandler, setCenterScreenMenu, showDeathScreen}) {
    const activeEffects = playerConfigs.currentStatus.activeEffects ?? [];
    const actionFeatures = getAllActionFeatures(playerConfigs);
    const consumeActionItems = getAllConsumableActionItems(playerConfigs);

    const spellcastingFeatures = getAllSpellcastingFeatures(playerConfigs);

    const tabs = [
        {
            name: "Stats",
            showTab: () => true,
            generateTab: () => {
                const proficiencyBonus = calculateProficiencyBonus(playerConfigs);
                const initiativeBonus = calculateInitiativeBonus(playerConfigs);
                const speed = calculateSpeed(playerConfigs);
                const size = calculateSize(playerConfigs);
                const passivePerception = calculatePassivePerception(playerConfigs);

                const conditions = playerConfigs.currentStatus.conditions ?? [];

                const showDeathSavingThrows = playerConfigs.currentStatus.remainingHp === 0;

                return <>
                    <div className="outerDiv">
                        <div className="playerName">{playerConfigs.title ? playerConfigs.title : playerConfigs.name}</div>
                        <div className="healthBarAndDefense">
                            <HPandLVLDisplay playerConfigs={playerConfigs} inputChangeHandler={inputChangeHandler} setCenterScreenMenu={setCenterScreenMenu} playLowHpAudio={true}></HPandLVLDisplay>
                            <ArmorClassDisplay playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu}></ArmorClassDisplay>
                        </div>
                        <div style={{display: (conditions.length > 0 ? "block" : "none")}}>
                            <ConditionsDisplay setCenterScreenMenu={setCenterScreenMenu} conditions={conditions} onAddOrUpdate={(newCondition) => onAddCondition(playerConfigs, inputChangeHandler, newCondition, showDeathScreen)} onRemove={(conditionNameToRemove) => onRemoveCondition(playerConfigs, inputChangeHandler, conditionNameToRemove)}></ConditionsDisplay>
                        </div>
                        <div style={{display: (showDeathSavingThrows ? "block" : "none")}}>
                            <DeathSavingThrowsDisplay playerConfigs={playerConfigs} inputChangeHandler={inputChangeHandler} showDeathScreen={showDeathScreen}></DeathSavingThrowsDisplay>
                        </div>
                        <div className="encounterStats">
                            <BasicStatDisplay statValue={addLeadingPlusIfNumericAndPositive(initiativeBonus)} onClick={() => {
                                playAudio("menuaudio");
                                setCenterScreenMenu({ show: true, menuType: "AspectMenu", data: { menuTitle: "Initiative", aspectName: "initiativeBonus", addendumsToShow: ["initiativeAddendum"], leadingPlus: true } });
                            }}>Initiative</BasicStatDisplay>
                            <BasicStatDisplay statValue={speed} onClick={() => {
                                playAudio("menuaudio");
                                setCenterScreenMenu({ show: true, menuType: "AspectMenu", data: { menuTitle: "Speed", aspectName: "speed", addendumsToShow: ["speedAddendum"] } });
                            }}>Speed</BasicStatDisplay>
                            <BasicStatDisplay statValue={size} onClick={() => {
                                playAudio("menuaudio");
                                setCenterScreenMenu({ show: true, menuType: "AspectMenu", data: { menuTitle: "Size", aspectName: "size", addendumsToShow: ["sizeAddendum"] } });
                            }}>Size</BasicStatDisplay>
                            <BasicStatDisplay statValue={passivePerception} onClick={() => {
                                playAudio("menuaudio");
                                setCenterScreenMenu({ show: true, menuType: "AspectMenu", data: { menuTitle: "Passive Perception", aspectName: "passivePerception", addendumsToShow: ["passivePerceptionAddendum"] } });
                            }}>Passive<br></br>Perception</BasicStatDisplay>
                        </div>
                        <div className="baseStats">
                            <BasicStatDisplay statValue={"+" + proficiencyBonus} onClick={() => {
                                playAudio("menuaudio");
                                setCenterScreenMenu({ show: true, menuType: "AspectMenu", data: { menuTitle: "Proficency Bonus", aspectName: "proficiencyBonus", addendumsToShow: ["proficiencyBonusAddendum"], leadingPlus: true } });
                            }}>Proficency<br></br>Bonus</BasicStatDisplay>
                            <StatDisplay name="strength" playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} value={calculateBaseStat(playerConfigs, "strength")}/>
                            <StatDisplay name="dexterity" playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} value={calculateBaseStat(playerConfigs, "dexterity")}/>
                            <StatDisplay name="constitution" playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} value={calculateBaseStat(playerConfigs, "constitution")}/>
                            <HeroicInspirationDisplay playerConfigs={playerConfigs} inputChangeHandler={inputChangeHandler}/>
                            <StatDisplay name="intelligence" playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} value={calculateBaseStat(playerConfigs, "intelligence")}/>
                            <StatDisplay name="wisdom" playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} value={calculateBaseStat(playerConfigs, "wisdom")}/>
                            <StatDisplay name="charisma" playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} value={calculateBaseStat(playerConfigs, "charisma")}/>
                        </div>
                    </div>
                </>
            }
        },
        {
            name: "Active FX",
            showTab: () => {
                return activeEffects.length > 0;
            },
            generateTab: () => {
                return <>
                    <div className="outerDiv">
                        <div>
                            <ActiveEffectsDisplay playerConfigs={playerConfigs} activeEffects={activeEffects} setCenterScreenMenu={setCenterScreenMenu} generateButtonText={(i) => "X"} onButtonClick={(i) => removeActiveEffect(playerConfigs, activeEffects, i, inputChangeHandler)}></ActiveEffectsDisplay>
                        </div>
                    </div>
                </>
            }
        },
        {
            name: "Basic Attacks",
            showTab: () => true,
            generateTab: () => {
                return <>
                    <div className="outerDiv">
                        <div>
                            <WeaponsAndDamageCantrips playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu}></WeaponsAndDamageCantrips>
                        </div>
                    </div>
                </>
            }
        },
        {
            name: "Feature Actions",
            showTab: () => {
                return actionFeatures.length > 0;
            },
            generateTab: () => {
                return <>
                    <div className="outerDiv">
                        <div>
                            <FeatureActionsDisplay playerConfigs={playerConfigs} actionFeatures={actionFeatures} setCenterScreenMenu={setCenterScreenMenu}></FeatureActionsDisplay>
                        </div>
                    </div>
                </>
            }
        },
        {
            name: "Item Actions",
            showTab: () => {
                return consumeActionItems.length > 0;
            },
            generateTab: () => {
                return <>
                    <div className="outerDiv">
                        <div>
                            <ItemActionsDisplay playerConfigs={playerConfigs} items={consumeActionItems} getItemAction={(dndItem) => dndItem.consumeEffect} setCenterScreenMenu={setCenterScreenMenu}></ItemActionsDisplay>
                        </div>
                    </div>
                </>
            }
        },
        {
            name: "Spells",
            showTab: () => {
                return spellcastingFeatures.length > 0;
            },
            generateTab: () => {
                const spellcastingLevel = getSpellcastingLevel(playerConfigs);
                const spellcastingFeatures = getAllSpellcastingFeatures(playerConfigs);

                const pactSlotLevel = getPactSlotLevel(playerConfigs);

                return <>
                     <div className="outerDiv">
                        <div style={{display: (spellcastingLevel > 0 || pactSlotLevel > 0 ? "block" : "none")}}>
                            <SpellSlotsDisplay playerConfigs={playerConfigs} casterLevel={spellcastingLevel} pactSlotLevel={pactSlotLevel}></SpellSlotsDisplay>
                        </div>
                        <div>
                            <SpellcastingDisplay playerConfigs={playerConfigs} spellcastingFeatures={spellcastingFeatures} setCenterScreenMenu={setCenterScreenMenu}></SpellcastingDisplay>
                        </div>
                    </div>
                </>
            }
        },
        {
            name: "Standard Actions",
            showTab: () => {
                return true;
            },
            generateTab: () => {
                return <>
                     <div className="outerDiv">
                        <div>
                            <OtherActionsDisplay playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu}></OtherActionsDisplay>
                        </div>
                    </div>
                </>
            }
        },
        {
            name: "Inventory",
            showTab: () => {
                return true;
            },
            generateTab: () => {
                return <>
                     <div className="outerDiv">
                        <InventoryDisplay playerConfigs={playerConfigs} inputChangeHandler={inputChangeHandler} setCenterScreenMenu={setCenterScreenMenu}></InventoryDisplay>
                    </div>
                </>
            }
        },
        {
            name: "Misc Info",
            showTab: () => {
                return true;
            },
            generateTab: () => {
                const languagesString = concatStringArrayToAndStringWithCommas(calculateAspectCollection(playerConfigs, "languages"));
                const armorTrainingString = concatStringArrayToAndStringWithCommas(calculateAspectCollection(playerConfigs, "armorTraining"));
                const weaponProficienciesString = concatStringArrayToAndStringWithCommas(calculateAspectCollection(playerConfigs, "weaponProficiencies"));
                const toolProficienciesString = concatStringArrayToAndStringWithCommas(calculateAspectCollection(playerConfigs, "toolProficiencies"));

                let mountedCombatDescription = undefined;
                if (playerConfigs.parent) {
                    // This is an allied creature... Show mounted combatant rules at the bottom in case we want to mount it.
                    const miscMap = getNameDictionaryForCollection("misc");
                    const mountedCombat = miscMap["MountedCombat"];
                    mountedCombatDescription = parseStringForBoldMarkup(mountedCombat.description);
                }

                return <>
                     <div className="outerDiv">
                        <div className="textEntry" style={{display: (languagesString ? "block" : "none")}}>
                            <div><b>Languages:</b> {languagesString}</div>
                        </div>
                        <div className="textEntry" style={{display: (armorTrainingString ? "block" : "none")}}>
                            <div><b>Armor Training:</b> {armorTrainingString}</div>
                        </div>
                        <div className="textEntry" style={{display: (weaponProficienciesString ? "block" : "none")}}>
                            <div><b>Weapon Proficenies:</b> {weaponProficienciesString}</div>
                        </div>
                        <div className="textEntry" style={{display: (toolProficienciesString ? "block" : "none")}}>
                            <div><b>Tool Proficenies:</b> {toolProficienciesString}</div>
                        </div>
                        <div className="textEntry" style={{display: (mountedCombatDescription ? "block" : "none")}}>
                            <div className="textWithLinesWrapper">{mountedCombatDescription}</div>
                        </div>
                    </div>
                </>
            }
        },
        {
            name: "Feature List",
            showTab: () => {
                return true;
            },
            generateTab: () => {
                let features = getAllFeatures(playerConfigs);

                // There are certain features that don't make sense to show here.
                features = features.filter(outerFeature => outerFeature.feature.description || (!outerFeature.feature.feat && !outerFeature.feature.subclass))

                let currentHeading = "";

                const featureRows = [];
                for (let outerFeature of features) {
                    const thisFeatureHeading = outerFeature.playerConfigForObject.name;
                    if (thisFeatureHeading != currentHeading) {
                        featureRows.push(<>
                            <div className="textEntry textWithLinesWrapper">
                                <div className="featuresListFeatureMainHeading">{thisFeatureHeading}</div>
                            </div>
                        </>);
                        currentHeading = thisFeatureHeading;
                    }

                    const feature = outerFeature.feature;
                    let description = feature.description;
                    if (!description) {
                        if (feature.actions && feature.actions.length > 0) {
                            description = feature.actions.map(action => action.description).join('\n\n');
                        }
                    }

                    featureRows.push(<>
                        <div className="textEntry textWithLinesWrapper">
                            <div>
                                <div className="featuresListFeatureHeading">{feature.name}</div>
                                <br></br>
                                {parseStringForBoldMarkup(description)}
                            </div>
                        </div>
                    </>);

                    if (description) {
                        featureRows.push(<br></br>);
                    }
                }

                return <>
                     <div className="outerDiv">
                        {featureRows}
                    </div>
                </>
            }
        }
    ]

    return (
        <>
            <div className="outerDiv">
                <TabScroller tabScrollerId={"MAIN_RENDERER"} tabs={tabs}></TabScroller>
            </div>
        </>
    )
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
        showDeathScreen(newPlayerConfigs);
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

function removeActiveEffect(playerConfigs, activeEffects, i, inputChangeHandler) {
    const activeEffectToRemove = activeEffects[i];
    let itemsToMoveToPlayer = [];
    if (activeEffectToRemove.allies) {
        for (let ally of activeEffectToRemove.allies) {
            if (ally.items) {
                for (let allyItem of ally.items) {
                    const itemToAdd = {...allyItem};
                    delete itemToAdd.equipped;
                    itemsToMoveToPlayer.push(itemToAdd);
                }
            }
        }
    }

    if (itemsToMoveToPlayer.length > 0) {
        const newPlayerConfigs = {...playerConfigs}
        const newCurrentStatus = {...newPlayerConfigs.currentStatus};
        newPlayerConfigs.currentStatus = newCurrentStatus;
        const newActiveEffects = [...newCurrentStatus.activeEffects];
        newActiveEffects.splice(i, 1);
        newCurrentStatus.activeEffects = newActiveEffects;

        const newPlayerItems = [...newPlayerConfigs.items];
        addItemsToNewItems(newPlayerItems, itemsToMoveToPlayer);
        newPlayerConfigs.items = newPlayerItems;

        inputChangeHandler(playerConfigs, "", newPlayerConfigs);
    } else {
        const newActiveEffects = [...activeEffects];
        newActiveEffects.splice(i, 1);
        inputChangeHandler(playerConfigs, "currentStatus.activeEffects", newActiveEffects);
    }
}