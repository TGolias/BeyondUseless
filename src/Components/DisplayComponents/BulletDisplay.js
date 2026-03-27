import React from "react";
import './BulletDisplay.css';

export function BulletDisplay({ item, itemConfig }) {
    let ammo = [];
    const reloadProperty = item.properties.find(prop => prop.startsWith('Reload '));
    if (reloadProperty) {
        const reloadAmountString = reloadProperty.substring(7);
        const reloadAmount = parseInt(reloadAmountString);
        if (reloadAmount > 0) {
            for (let ammoIndex = 0; ammoIndex < reloadAmount; ammoIndex++) {
                if (itemConfig.bullets && itemConfig.bullets.length > ammoIndex && itemConfig.bullets[ammoIndex]) {
                    ammo.push(<div className="bulletDisplaySingleBullet" style={{ backgroundColor: itemConfig.bullets[ammoIndex].color }}><div className="bulletDisplaySingleBulletBottomOfShell"></div></div>);
                } else {
                    ammo.push(<div className="bulletDisplaySingleBullet bulletDisplaySingleBulletEmpty"><div className="bulletDisplaySingleBulletBottomOfShell"></div></div>);
                }
            }
        }
    }
    return <div className="bulletDisplayAmmoHolder">{ammo}</div>;
}