import React from "react";
import './HPandLVLDisplay.css';
import { calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";

export function HPandLVLDisplay({playerConfigs, setCenterScreenMenu, playLowHpAudio}) {
    const level = playerConfigs.level;
    const hpMax = calculateHPMax(playerConfigs);
    const currentHp = (!!playerConfigs.currentStatus.remainingHp || playerConfigs.currentStatus.remainingHp === 0) ? playerConfigs.currentStatus.remainingHp : hpMax;
    const tempHp = playerConfigs.currentStatus.tempHp ?? 0;

    let percentHpRemaining = currentHp > hpMax ? 100 : (currentHp / hpMax) * 100;

    let percentTempHp = tempHp > hpMax ? 100 : (tempHp / hpMax) * 100;

    controlLowHpSound(playLowHpAudio, percentHpRemaining);

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

function controlLowHpSound(playLowHpAudio, percentHpRemaining) {
    const lowHpAudio = document.getElementById("lowhpaudio"); 
    if (percentHpRemaining <= 20) {
        if (playLowHpAudio) {
            // @ts-ignore
            if (lowHpAudio.paused) {
                // @ts-ignore
                lowHpAudio.currentTime = 0;
            }
            // @ts-ignore
            lowHpAudio.loop = true;
            
            // There's an issue with play pause. This is the best way I can find around it right now.
            setTimeout(function () {
                // @ts-ignore    
                lowHpAudio.play();
            }, 150);
        }
    } else {
        // @ts-ignore
        lowHpAudio.pause();
    }
}