import React from "react";
import "./FileUpload.css"
import { playAudio } from "../../SharedFunctions/Utils";

export function FileUpload({text, onFileUploaded}) {
    return (<>
        <div className="fileUploadWrapper">
            <input className="fileUploadInputButton" data-content={text} type="file" onInput={(event) => {
                // @ts-ignore
                const files = event.target.files;
                if (files && files.length > 0) {
                    const file = files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.readAsText(file);
                        reader.onload = (event) => {
                            onFileUploaded(event.target.result);
                            playAudio("selectionaudio");
                        }
                    }
                }
            }} onClick={() => playAudio("selectionaudio")}/>
        </div>
    </>)
}