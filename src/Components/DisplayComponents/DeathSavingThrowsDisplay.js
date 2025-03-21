import React from "react";
import './DeathSavingThrowsDisplay.css';
import { playAudio } from "../../SharedFunctions/Utils";
import { SetPlayerDead } from "../../SharedFunctions/DeathFunctions";

export function DeathSavingThrowsDisplay({playerConfigs, inputChangeHandler, showDeathScreen}) {
    const failures = playerConfigs.currentStatus?.deathSavingThrowFailures ?? 0;
    const successes = playerConfigs.currentStatus?.deathSavingThrowSuccesses ?? 0;

    const deathSavingThrowsCompleted = failures > 2 || successes > 2;

    return (<>
        <div className="deathSavingThrowWrapper pixel-corners">
            <div className="deathSavingThrowLabel">Death Saving Throws</div>
            <div className="deathSavingThrowGrid">
                <div className="deathSavingThrowClickableDiv" onClick={() => {
                    if (failures < 3) {
                        const newAmountOfFailures = failures + 1;
                        if (newAmountOfFailures > 2) {
                            // Oh shit we died!
                            SetPlayerDead(playerConfigs);
                            inputChangeHandler(playerConfigs, "currentStatus", playerConfigs.currentStatus);

                            showDeathScreen(playerConfigs);
                        } else {
                            inputChangeHandler(playerConfigs, "currentStatus.deathSavingThrowFailures", newAmountOfFailures);
                            playAudio("selectionaudio");
                        }
                    }
                }}>
                    <div className="deathSavingThrowLabel">Failures</div>
                    <div className="deathSavingThrowButtonWrapper">
                        <div className="deathSavingThrowValue">{failures > 0 ? "X" : "O"}</div>
                        <div className="deathSavingThrowValue">{failures > 1 ? "X" : "O"}</div>
                        <div className="deathSavingThrowValue">{failures > 2 ? "X" : "O"}</div>
                    </div>
                </div>
                <div className="deathSavingThrowCrossWrapper">
                    <div className={"deathSavingThrowCross" + (deathSavingThrowsCompleted ? (failures > 2 ? " deathSavingThrowCrossDead" : " deathSavingThrowCrossSurvive") : " ")}>{deathSavingThrowsCompleted ? "✟" : "✝"}</div>
                </div>
                <div className="deathSavingThrowClickableDiv" onClick={() => {
                    if (failures < 3 && successes < 3) {
                        inputChangeHandler(playerConfigs, "currentStatus.deathSavingThrowSuccesses", successes + 1)
                        playAudio("selectionaudio");
                    }
                }}>
                    <div className="deathSavingThrowLabel">Successes</div>
                    <div className="deathSavingThrowButtonWrapper">
                        <div className="deathSavingThrowValue">{successes > 2 ? "X" : "O"}</div>
                        <div className="deathSavingThrowValue">{successes > 1 ? "X" : "O"}</div>
                        <div className="deathSavingThrowValue">{successes > 0 ? "X" : "O"}</div>
                    </div>
                </div>
            </div>
        </div>
    </>)
}