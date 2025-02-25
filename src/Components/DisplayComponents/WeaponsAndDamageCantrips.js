import React from 'react';
import './WeaponsAndDamageCantrips.css';
import { getCollection } from '../../Collections';
import { convertArrayToDictionary, playAudio } from '../../SharedFunctions/Utils';
import { calculateOtherSpellAspect, calculateSpellAttack, calculateSpellSaveDC, calculateUnarmedAttackBonus, calculateUnarmedAttackDC, calculateUnarmedDamage, calculateWeaponAttackBonus, calculateWeaponDamage, getAllSpellcastingFeatures, getAllSpells, getItemFromItemTemplate } from '../../SharedFunctions/TabletopMathFunctions';
import { GetOpenHands } from '../../SharedFunctions/EquipmentFunctions';
import { RetroButton } from '../SimpleComponents/RetroButton';

const rows = [
    {
        name: "Name",
        calculateUnarmedStrikeValue: (playerConfigs, unarmedStrike) => {
            return unarmedStrike.name;
        },
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            return weapon.name + (isThrown ? " (Thrown)" : "");
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
                return (attack.amount < 0 ? "" : "+") + attack.amount;
            }
        },
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            const attack = calculateWeaponAttackBonus(playerConfigs, weapon, isThrown);
            return (attack.amount < 0 ? "" : "+") + attack.amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            if (dndCantrip.challengeType === "savingThrow") {
                const spellSave = calculateSpellSaveDC(playerConfigs, dndCantrip, 0);
                return "DC" + spellSave.dc;
            } else {
                const attack = calculateSpellAttack(playerConfigs, dndCantrip, 0);
                return (attack.amount.length === 0 || attack.amount.startsWith("-") ? "" : "+") + attack.amount;
            }
        }
    },
    {
        name: "Damage",
        calculateUnarmedStrikeValue: (playerConfigs, unarmedStrike) => {
            if (unarmedStrike.type.includes("damage")) {
                let amount = calculateUnarmedDamage(playerConfigs);
                amount += " Bludgeoning";
                return amount;
            }
            return "";
        },
        calculateWeaponValue: (playerConfigs, weapon, isThrown) => {
            let amount = calculateWeaponDamage(playerConfigs, weapon, isThrown, false, false);
            amount += " " + weapon.damage.damageType;
            return amount;
        },
        calculateCantripValue: (playerConfigs, dndCantrip) => {
            let amount = calculateOtherSpellAspect(playerConfigs, dndCantrip, 0, "damage", "spellDamageBonus");
            amount += " " + dndCantrip.damage.damageType;
            return amount;
        },
        addClass: "lastCol"
    },
];

export function WeaponsAndDamageCantrips({playerConfigs, setCenterScreenMenu}) {
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
            let dndItem = itemName2Item[item.name];
            dndItem = getItemFromItemTemplate(dndItem, itemName2Item);
            if (dndItem.type === "Weapon") {
                hasWeapons = true;

                // Weapons that are "Ranged" and "Thrown" are thrown only. That is the only group that we do not do the non-thrown calculation for.
                if (!(dndItem.weaponRange == "Ranged" && dndItem.properties.includes("Thrown"))) {
                    for (let row of rows) {
                        weaponOrDamageCantripRows.push(<div onClick={() => openMenuForItem(dndItem, setCenterScreenMenu)} className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem, false)}</div>)
                    }
                }

                // If the Weapon is thrown, we do a different calculation for it because the numbers could come out differently based on Fighting Style and other aspects.
                if (dndItem.properties.includes("Thrown")) {
                    for (let row of rows) {
                        weaponOrDamageCantripRows.push(<div onClick={() => openMenuForItem(dndItem, setCenterScreenMenu)} className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateWeaponValue(playerConfigs, dndItem, true)}</div>)
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
            hasDamageCantrips = pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, spell, setCenterScreenMenu) || hasDamageCantrips;
        }
    }

    const openHands = GetOpenHands(playerConfigs.items);
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

function pushCantripRowIfDamage(playerConfigs, weaponOrDamageCantripRows, dndcantrip, setCenterScreenMenu) {
    if (dndcantrip.type.includes("damage")) {
        for (let row of rows) {
            weaponOrDamageCantripRows.push(<div onClick={() => openMenuForSpell(dndcantrip, setCenterScreenMenu)} className={row.addClass ? "weaponOrDamageCantripRow " + row.addClass : "weaponOrDamageCantripRow"}>{row.calculateCantripValue(playerConfigs, dndcantrip)}</div>)
        }
        return true;
    }
    return false;
}

function openMenuForSpell(dndcantrip, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "SpellMenu", data: { menuTitle: dndcantrip.name, spell: dndcantrip } });
}

function openMenuForItem(dndItem, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem } });
}

function openMenuForUnarmedStrike(dndUnarmedStrike, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "UnarmedStrikeMenu", data: { menuTitle: dndUnarmedStrike.name, unarmedStrike: dndUnarmedStrike } });
}