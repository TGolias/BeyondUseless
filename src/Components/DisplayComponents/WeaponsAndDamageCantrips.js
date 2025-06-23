import React from 'react';
import './WeaponsAndDamageCantrips.css';
import { getCollection, getNameDictionaryForCollection } from '../../Collections';
import { addLeadingPlusIfNumericAndPositive, playAudio } from '../../SharedFunctions/Utils';
import { calculateAttackRollForAttackRollType, calculateOtherSpellAspect, calculateSpellSaveDC, calculateUnarmedAttackBonus, calculateUnarmedAttackDC, calculateUnarmedDamage, calculateWeaponAttackBonus, calculateWeaponDamage, getAllSpellcastingFeatures, getAllSpells, getItemFromItemTemplate } from '../../SharedFunctions/TabletopMathFunctions';
import { GetOpenHands } from '../../SharedFunctions/EquipmentFunctions';
import { RetroButton } from '../SimpleComponents/RetroButton';

const rows = [
    {
        name: "Name",
        calculateUnarmedStrikeValue: (playerConfigs, unarmedStrike) => {
            return unarmedStrike.name;
        },
        calculateWeaponValue: (playerConfigs, weapon, isThrown, weaponAttackCantrip) => {
            return (weaponAttackCantrip ? weaponAttackCantrip.name + " - " : "") + weapon.name + (isThrown ? " (Thrown)" : "");
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            return dndCantrip.name;
        },
        addClass: "firstCol"
    },
    {
        name: "Atk/DC",
        calculateUnarmedStrikeValue: (playerConfigs, unarmedStrike) => {
            if (unarmedStrike.challengeType === "savingThrow") {
                const unarmedAttackDC = calculateUnarmedAttackDC(playerConfigs);
                return "DC" + unarmedAttackDC.dc;
            } else {
                const attack = calculateUnarmedAttackBonus(playerConfigs);
                return addLeadingPlusIfNumericAndPositive(attack.amount);
            }
        },
        calculateWeaponValue: (playerConfigs, weapon, isThrown, weaponAttackCantrip) => {
            const attack = calculateWeaponAttackBonus(playerConfigs, weapon, isThrown, weaponAttackCantrip ? [{ type: "spell", name: weaponAttackCantrip.name, path: "weaponAttack" }] : []);
            return addLeadingPlusIfNumericAndPositive(attack.amount);
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            if (dndCantrip.challengeType === "savingThrow") {
                const spellSave = calculateSpellSaveDC(playerConfigs, [], dndCantrip, true, 0);
                return "DC" + spellSave.dc;
            } else {
                const attack = calculateAttackRollForAttackRollType(playerConfigs, [], dndCantrip, true, 0, dndCantrip.attackRollType);
                return addLeadingPlusIfNumericAndPositive(attack.amount);
            }
        }
    },
    {
        name: "Damage",
        calculateUnarmedStrikeValue: (playerConfigs, unarmedStrike) => {
            if (unarmedStrike.type.includes("damage")) {
                const amount = calculateUnarmedDamage(playerConfigs);
                return amount;
            }
            return "";
        },
        calculateWeaponValue: (playerConfigs, weapon, isThrown, weaponAttackCantrip) => {
            const amount = calculateWeaponDamage(playerConfigs, weapon, isThrown, false, false, weaponAttackCantrip ? [{ type: "spell", name: weaponAttackCantrip.name, path: "weaponAttack" }] : []);
            return amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            const amount = calculateOtherSpellAspect(playerConfigs, dndCantrip, 0, "damage", "spellDamageBonus", []);
            return amount;
        },
        addClass: "lastCol"
    },
];

export function WeaponsAndDamageCantrips({playerConfigs, setCenterScreenMenu}) {
    const itemName2Item = getNameDictionaryForCollection("items");

    const weaponOrDamageCantripRows = [];
    for (let row of rows) {
        weaponOrDamageCantripRows.push(<div className={row.addClass}>{row.name}</div>)
    }

    // Check weapons
    let hasWeapons = processAllWeapons(playerConfigs, itemName2Item, undefined, weaponOrDamageCantripRows, setCenterScreenMenu);

    // Check Cantrips
    let hasDamageCantrips = false;
    const spellcastingFeatures = getAllSpellcastingFeatures(playerConfigs);
    const allPlayerSpells = getAllSpells(playerConfigs, spellcastingFeatures);
    for (let spell of allPlayerSpells) {
        if (!spell.level) {
            hasDamageCantrips = pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, itemName2Item, spell, setCenterScreenMenu) || hasDamageCantrips;
        }
    }

    const openHands = GetOpenHands(playerConfigs, playerConfigs.items);
    const hasAtLeastOneOpenHand = openHands > 0;
    // Check unarmed strikes.
    const unarmedStrikes = getCollection("unarmed");
    for (let unarmedStrike of unarmedStrikes) {
        // Grappling requires an open hand.
        if (unarmedStrike.name !== "Unarmed Strike: Grapple" || hasAtLeastOneOpenHand) {
            hasWeapons = true;
            for (let row of rows) {
                weaponOrDamageCantripRows.push(<div onClick={() => openMenuForUnarmedStrike(unarmedStrike, setCenterScreenMenu)} className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateUnarmedStrikeValue(playerConfigs, unarmedStrike)}</div>)
            }
        }
    }

    return (
        <>
            <div className='outerWeaponOrDamageCantrip pixel-corners'>
                <div className='weaponOrDamageCantripTitle'>{hasWeapons && !hasDamageCantrips ? "Weapons" : (!hasWeapons && hasDamageCantrips ? "Damage Cantrips" : (!hasWeapons && !hasDamageCantrips ? "No Weapons + Damage Cantrips" : "Weapons + Damage Cantrips"))}</div>
                <div style={{display: (hasWeapons || hasDamageCantrips ? "grid" : "none")}} className='weaponOrDamageCantripGrid'>{weaponOrDamageCantripRows}</div>
                <div className='weaponOrDamageCantripManageEquipment'><RetroButton text={"Manage Held Equipment"} onClickHandler={() => {
                    setCenterScreenMenu({ show: true, menuType: "ManageHeldEquipmentMenu" });
                }} showTriangle={false} disabled={false} buttonSound={"menuaudio"}></RetroButton></div>
            </div>
        </>
    )
}

function pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, itemName2Item, dndcantrip, setCenterScreenMenu) {
    if (dndcantrip.type && (dndcantrip.type.includes("damage") || dndcantrip.type.includes("weaponAttack"))) {
        if (dndcantrip.type.includes("weaponAttack")) {
            processAllWeapons(playerConfigs, itemName2Item, dndcantrip, weaponOrDamageCantripRows, setCenterScreenMenu);
        } else {
            for (let row of rows) {
                weaponOrDamageCantripRows.push(<div onClick={() => openMenuForSpell(dndcantrip, setCenterScreenMenu)} className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateCantripValue(playerConfigs, dndcantrip)}</div>)
            }
            return true;
        }
    }
    return false;
}

function processAllWeapons(playerConfigs, itemName2Item, weaponAttackCantrip, weaponOrDamageCantripRows, setCenterScreenMenu) {
    // Check weapons
    let hasWeapons = false;
    for (let item of playerConfigs.items) {
        if (item.equipped) {
            let dndItem = itemName2Item[item.name];
            dndItem = getItemFromItemTemplate(dndItem, itemName2Item);
            if (dndItem.type === "Weapon") {
                hasWeapons = true;

                // Weapons that are "Ranged" and "Thrown" are thrown only. That is the only group that we do not do the non-thrown calculation for.
                if (!(dndItem.weaponRange == "Ranged" && dndItem.properties.includes("Thrown"))) {
                    for (let row of rows) {
                        weaponOrDamageCantripRows.push(<div onClick={() => openMenuForItem(dndItem, weaponAttackCantrip, setCenterScreenMenu)} className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem, false, weaponAttackCantrip)}</div>)
                    }
                }

                // If the Weapon is thrown, we do a different calculation for it because the numbers could come out differently based on Fighting Style and other aspects.
                if (dndItem.properties.includes("Thrown")) {
                    for (let row of rows) {
                        weaponOrDamageCantripRows.push(<div onClick={() => openMenuForItem(dndItem, weaponAttackCantrip, setCenterScreenMenu)} className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem, true, weaponAttackCantrip)}</div>)
                    }
                }
            }
        }
    }
    return hasWeapons;
}

function openMenuForSpell(dndcantrip, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "SpellMenu", data: { menuTitle: dndcantrip.name, spell: dndcantrip } });
}

function openMenuForItem(dndItem, weaponAttackCantrip, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem, additionalEffects: (weaponAttackCantrip ? [{ type: "spell", name: weaponAttackCantrip.name, path: "weaponAttack" }] : []) } });
}

function openMenuForUnarmedStrike(dndUnarmedStrike, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "UnarmedStrikeMenu", data: { menuTitle: dndUnarmedStrike.name, unarmedStrike: dndUnarmedStrike } });
}