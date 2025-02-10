import React from 'react';
import './WeaponsAndDamageCantrips.css';
import { getCollection } from '../../Collections';
import { convertArrayToDictionary } from '../../SharedFunctions/Utils';
import { calculateAspectCollection, calculateProficiencyBonus, calculateSpellAttack, calculateSpellSaveDC, calculateWeaponAttackBonus, calculateWeaponDamage, getAllSpellcastingFeatures, getAllSpells, performDiceRollCalculation, performMathCalculation } from '../../SharedFunctions/TabletopMathFunctions';

const rows = [
    {
        name: "Name",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            return weapon.name + (isThrown ? " (Thrown)" : "")
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
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
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            if (dndCantrip.challengeType === "savingThrow") {
                const spellSaveDC = calculateSpellSaveDC(playerConfigs, dndCantrip);
                return "DC" + spellSaveDC;
            } else {
                const spellAttack = calculateSpellAttack(playerConfigs, dndCantrip);
                return (spellAttack < 0 ? "" : "+") + spellAttack;
            }
        }
    },
    {
        name: "Damage",
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            const amount = calculateWeaponDamage(playerConfigs, weapon, isThrown);
            return amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
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
        calculateCantripValue: (playerConfigs, dndCantrip) => {
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
                    weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem, false)}</div>)
                }

                if (dndItem.properties && dndItem.properties.includes("Thrown") && dndItem.weaponRange == "Melee") {
                    // Do calculations for the weapon thrown as well.
                    for (let row of rows) {
                        weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem, true)}</div>)
                    }
                }
            }
        }
    }

    // Check Cantrips
    const spellcastingFeatures = getAllSpellcastingFeatures(playerConfigs);
    const allPlayerSpells = getAllSpells(spellcastingFeatures);
    for (let spell of allPlayerSpells) {
        if (!spell.level) {
            hasDamageCantrips = pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, spell) || hasDamageCantrips;
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

function pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, dndcantrip) {
    if (dndcantrip.type.includes("damage")) {
        for (let row of rows) {
            weaponOrDamageCantripRows.push(<div className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateCantripValue(playerConfigs, dndcantrip)}</div>)
        }
        return true;
    }
    return false;
}