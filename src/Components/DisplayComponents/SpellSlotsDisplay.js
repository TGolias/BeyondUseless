import React from 'react';
import './SpellSlotsDisplay.css';
import { getCollection } from '../../Collections';

export function SpellSlotsDisplay({playerConfigs, casterLevel}) {
    const spellSlotsForEachLevel = getCollection("spellslots");

    const spellSlotRows = [];
    spellSlotRows.push(<>
        <div className='firstCol'>Slot Level</div>
        <div className='lastCol'>Used</div>
    </>);

    if (casterLevel > 0) {
        const spellSlotsForThisLevel = spellSlotsForEachLevel[casterLevel - 1];
        for (let i = 0; i < 10; i++) {
            const slotLevel = i + 1;
            const slotLevelPropertyName = "slotLevel" + slotLevel;
            const spellsForSlotLevel = spellSlotsForThisLevel[slotLevelPropertyName];

            if (spellsForSlotLevel && spellsForSlotLevel > 0) {
                let spellSlotsUsed = 0;
                if (playerConfigs.currentStatus && playerConfigs.currentStatus.remainingSpellSlots && playerConfigs.currentStatus.remainingSpellSlots[slotLevelPropertyName] !== undefined) {
                    const remainingFreeUses = playerConfigs.currentStatus.remainingSpellSlots[slotLevelPropertyName];
                    spellSlotsUsed = spellsForSlotLevel - remainingFreeUses;
                } 

                let slotUsesString = "";
                for (let j = 0; j < spellsForSlotLevel; j++) {
                    if (j > 0) {
                        slotUsesString += " "
                    }

                    if (j < spellSlotsUsed) {
                        slotUsesString += "X"
                    } else {
                        slotUsesString += "O"
                    }
                    
                }
                spellSlotRows.push(<>
                    <div className='spellslotsDisplayRow firstCol'>Level {slotLevel}</div>
                    <div className='spellslotsDisplayRow lastCol'>{slotUsesString}</div>
                </>);
            }
        }
    }
     
    return (
        <>
            <div className='outerSpellslotsDisplay pixel-corners'>
                <div className='spellslotsDisplayTitle'>Spell Slots</div>
                <div className='spellslotsDisplayGrid'>{spellSlotRows}</div>
            </div>
        </>
    )
}