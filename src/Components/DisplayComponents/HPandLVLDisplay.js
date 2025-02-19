import React from "react";
import './HPandLVLDisplay.css';
import { calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";
import { playAudio } from "../../SharedFunctions/Utils";

export function HPandLVLDisplay({playerConfigs, setCenterScreenMenu = undefined, playLowHpAudio}) {
    const level = playerConfigs.level;
    const hpMax = calculateHPMax(playerConfigs);
    const currentHp = (!!playerConfigs.currentStatus.remainingHp || playerConfigs.currentStatus.remainingHp === 0) ? playerConfigs.currentStatus.remainingHp : hpMax;
    const tempHp = playerConfigs.currentStatus.tempHp ?? 0;

    const percentHpRemaining = currentHp > hpMax ? 100 : (currentHp / hpMax) * 100;

    const percentTempHp = tempHp > hpMax ? 100 : (tempHp / hpMax) * 100;

    const isDead = (percentHpRemaining === 0 && playerConfigs.currentStatus?.deathSavingThrowFailures > 2) || playerConfigs.currentStatus?.conditions?.some(condition => condition.name === "Exhaustion" && condition.level === 6);

    controlLowHpSound(playLowHpAudio, percentHpRemaining);

    return <>
        <div className="hp-corners" onClick={() => {
            if (setCenterScreenMenu) {
                playAudio("menuaudio");
                setCenterScreenMenu({ show: true, menuType: "HealthMenu", data: undefined });
            }
        }}>
            <div className={"healthWrapper"}>
                <div className={isDead ? "leveltextbold" : ""}>{isDead ? "DEAD" : "LVL" + level}</div>
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
    if (lowHpAudio) {
        if (percentHpRemaining <= 20 && percentHpRemaining !== 0) {
            if (playLowHpAudio) {
                // @ts-ignore
                if (lowHpAudio.paused || lowHpAudio.volume == 0) {
                    // @ts-ignore
                    lowHpAudio.currentTime = 0;
                    // @ts-ignore
                    lowHpAudio.volume = 1;
                }

                // We do our own looping logic... Looping html audio elements in a suitable way is a rabbithole... This way is much more consistent than `lowHpAudio.loop = true`, trust me!
                if (lowHpAudio.getAttribute('listener') !== 'true') {
                    // The 'listener' attribute is just so that the looping event listener only gets applied once...
                    lowHpAudio.setAttribute('listener', 'true');
                    lowHpAudio.addEventListener('timeupdate', () => {
                        var buffer = .13;
                        // @ts-ignore
                        if (lowHpAudio.currentTime > lowHpAudio.duration - buffer) {
                            // @ts-ignore
                            lowHpAudio.currentTime = 0;
                            // @ts-ignore
                            lowHpAudio.play();
                        }
                    });
                }
                
                // There's an issue with play pause. This is the best way I can find around it right now.
                setTimeout(function () {
                    // @ts-ignore    
                    lowHpAudio.play();
                }, 150);
            }
        } else {
            // @ts-ignore
            lowHpAudio.volume = 0;
            // @ts-ignore
            lowHpAudio.pause();
        }
    }
}