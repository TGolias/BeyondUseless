import React from "react";
import './HPandLVLDisplay.css';
import { calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";

export function HPandLVLDisplay({playerConfigs, setCenterScreenMenu}) {
    const level = playerConfigs.level;
    const hpMax = calculateHPMax(playerConfigs);
    const currentHp = (!!playerConfigs.currentStatus.remainingHp || playerConfigs.currentStatus.remainingHp === 0) ? playerConfigs.currentStatus.remainingHp : hpMax;
    const tempHp = playerConfigs.currentStatus.tempHp ?? 0;

    const percentHpRemaining = (currentHp / hpMax) * 100;

    const percentTempHp = (tempHp / hpMax) * 100;

    return <>
        <div className="hp-corners" onClick={() => setCenterScreenMenu({ show: true, menuType: "HealthMenu" })}>
            <div className="healthWrapper">
                <div>LVL{level}</div>
                <div className="healthBar">
                    <div>HP:</div>
                    <div className="healthBarValue hp-bar-corners">
                        <div className={"healthBarFill" + (percentHpRemaining <= 50 ? (percentHpRemaining <= 20 ? " healthBarCritical" : " healthBarBloodied") : "")} style={{width: (percentHpRemaining + "%")}}></div>
                        <div className={"tempHp"} style={{width: (percentTempHp + "%")}}></div>
                    </div>
                </div>
                <div>{currentHp}{tempHp > 0 ? "(+" + tempHp + ")" : ""} / {hpMax}</div>
            </div>
        </div>
    </>
}