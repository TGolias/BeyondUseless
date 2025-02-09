import React from 'react';
import './WeaponsAndDamageCantrips.css';
import { getCollection } from '../../Collections';
import { convertArrayToDictionary } from '../../SharedFunctions/Utils';
import { calculateAspectCollection, calculateProficiencyBonus, calculateWeaponAttackBonus, calculateWeaponDamage, performDiceRollCalculation, performMathCalculation } from '../../SharedFunctions/TabletopMathFunctions';

const rows = [
    {
        name: "Name",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            return weapon.name + (isThrown ? " (Thrown)" : "")
        },
        calculateCantripValue: (playerConfigs, dndCantrip, spellcastingAbility) => {
            return dndCantrip.name;
        },
        addClass: "firstCol"
    },
    {
        name: "Atk/DC",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            const amount = calculateWeaponAttackBonus(playerConfigs, weapon, isThrown);
            return (amount < 0 ? "" : "+") + amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip, spellcastingAbility) => {
            if (dndCantrip.challengeType === "savingThrow") {
                const charismaModifier = calculateAspectCollection(playerConfigs, spellcastingAbility + "Modifier");
                const proficencyBonus = calculateProficiencyBonus(playerConfigs);
                return "DC" + (8 + charismaModifier + proficencyBonus);
            } else {
                const charismaModifier = calculateAspectCollection(playerConfigs, spellcastingAbility + "Modifier");
                const proficencyBonus = calculateProficiencyBonus(playerConfigs);
                const amount = charismaModifier + proficencyBonus;
                return (amount < 0 ? "" : "+") + amount;
            }
        }
    },
    {
        name: "Damage",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            const amount = calculateWeaponDamage(playerConfigs, weapon, isThrown);
            return amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip, spellcastingAbility) => {
            let calculationString = performDiceRollCalculation(playerConfigs, dndCantrip.damage.calcuation);
            return calculationString;
        }
    },
    {
        name: "Range",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            if (weapon.weaponRange === "Ranged" || isThrown) {
                return weapon.range;
            } else {
                if (weapon.properties.includes("Reach")) {
                    return 10;
                } else {
                    return 5;
                }
            }
        },
        calculateCantripValue: (playerConfigs, dndCantrip, spellcastingAbility) => {
            return dndCantrip.range;
        },
        addClass: "lastCol"
    }
];

export function WeaponsAndDamageCantrips({playerConfigs}) {
    const items = getCollection("items");
    const itemName2Item = convertArrayToDictionary(items, "name");

    let hasWeapons = false;
    let hasDamageCantrips = false;

    const weaponOrDamageCantripRows = [];
    for (let row of rows) {
        weaponOrDamageCantripRows.push(<div className={row.addClass}>{row.name}</div>)
    }

    // Check weapons
    for (let item of playerConfigs.items) {
        if (item.equipped) {
            let itemName = item.name;
            let dndItem = itemName2Item[item.name];
            while (dndItem.type === "Template") {
                itemName = dndItem.templateOf;
                dndItem = {...itemName2Item[itemName]};
                dndItem.name = item.name;
            }
            if (dndItem.type === "Weapon") {
                hasWeapons = true;
                for (let row of rows) {
                    weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem)}</div>)
                }
            }
        }
    }

    // Check Cantrips
    const cantrips = getCollection("cantrips");
    const cantripName2Cantrip = convertArrayToDictionary(cantrips, "name");
    const features = calculateAspectCollection(playerConfigs, "features");
    const spellcastingFeatures = features.filter(object => object.feature.spellcasting);
    const allKnownCantrips = [];
    for (let spellcastingFeature of spellcastingFeatures) {
        const spellcasting = spellcastingFeature.feature.spellcasting;
        if (spellcasting.cantripsKnown) {
            const spellcastingAbility = performMathCalculation(playerConfigs, spellcasting.ability.calcuation);

            if (spellcasting.cantripsKnown.predeterminedSelections && spellcasting.cantripsKnown.predeterminedSelections > 0) {
                for (let predeterminedSelection of spellcasting.cantripsKnown.predeterminedSelections) {
                    pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, cantripName2Cantrip[predeterminedSelection], spellcastingAbility);
                }
            }
            
            const featurePropertyName = spellcastingFeature.feature.name.replace(/\s/g, "") + (spellcastingFeature.feature.level ?? spellcastingFeature.feature.classLevel);
            const userInputForSpells = spellcastingFeature.playerConfigForObject.features[featurePropertyName];
            if (userInputForSpells && userInputForSpells.cantrips) {
                for (let cantripName of userInputForSpells.cantrips) {
                    pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, cantripName2Cantrip[cantripName], spellcastingAbility);
                }
            }
        }
    }
    
    for (let dndcantrip of allKnownCantrips) {
        if (dndcantrip.type.includes("damage")) {
            hasDamageCantrips = true;
            for (let row of rows) {
                weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateCantripValue(playerConfigs, dndcantrip)}</div>)
            }
        }
    }    

    return (
        <>
            <div className='outerWeaponOrDamageCantrip pixel-corners'>
                <div className='weaponOrDamageCantripTitle'>{hasWeapons && !hasDamageCantrips ? "Weapons" : (!hasWeapons && hasDamageCantrips ? "Damage Cantrips" : (!hasWeapons && !hasDamageCantrips ? "No Weapons + Damage Cantrips" : "Weapons + Damage Cantrips"))}</div>
                <div style={{display: (hasWeapons || hasDamageCantrips ? "grid" : "none")}} className='weaponOrDamageCantripGrid'>{weaponOrDamageCantripRows}</div>
            </div>
        </>
    )
}

function pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, dndcantrip, spellcastingAbility) {
    if (dndcantrip.type.includes("damage")) {
        for (let row of rows) {
            weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateCantripValue(playerConfigs, dndcantrip, spellcastingAbility)}</div>)
        }
        return true;
    }
    return false;
}