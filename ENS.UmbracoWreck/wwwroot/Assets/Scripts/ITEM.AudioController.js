ITEM.AudioController = function (settings) {

    audioControllerState = {
        audioObject: new Audio(),
        isPlaying: false,
        isPaused: false,
        currentFile: '',
        formerFile: '',
        playAttemptCount: 0,

    }
    function debugLog(msg, obj) {
        if (settings.debugMode) {
            console.log(msg, obj)
        }
    }

    function playAudio() {
        if (fileCheck()) {

            debugLog("PlayAudio (fileCheck FAILED)", audioControllerState)

            let attempts = audioControllerState.playAttemptCount;
            let playPromise = audioControllerState.audioObject.play();

            debugLog("playAudio (start)", { audioObject: audioControllerState.audioObject, audioFile: audioControllerState.currentFile, attempts: attempts, promist: playPromise })

            if (typeof playPromise != 'undefined' && audioControllerState.currentFile != "") {
                playPromise
                    .then(() => {
                        audioControllerState.playAttemptCount = 0;
                    })
                    .catch((error) => {
                        if (audioControllerState.playAttemptCount < 1) {

                            setTimeout(function retryPlayPromise() {
                                debugLog(`playAudio() : attempting to play audio at attempt #${attempts + 1} `, playPromise)
                                playAudio();

                            }, 250);

                        } else {

                            debugLog(`playAudio() : Could not play audiofile after ${attempts + 1} attempts. Handling error:`, error)
                            handleError(error);
                        } if (audioControllerState.playAttemptCount > 1) {
                            clearAudioFile()
                            return false
                        }
                    });
            }

            audioControllerState.playAttemptCount++;
        }
    }

    function pauseAudio() {
        debugLog("pauseAudio (audioPlayer.js)")
        audioControllerState.audioObject.pause();
    }
    function replayAudio() {
        debugLog("replayAudio (audioPlayer.js)")
        audioControllerState.audioObject.currentTime = 0;
        audioControllerState.audioObject.play();
    }
    function stopAudio() {
        debugLog("stopAudio (audioPlayer.js)")
        audioControllerState.audioObject.currentTime = 0;
        audioControllerState.audioObject.pause();
    }

    function loadAudioFile(file, callback, callbackWhen) {
        audioControllerState.formerFile = audioControllerState.currentFile;
        audioControllerState.currentFile = file;
        audioControllerState.audioObject = new Audio(audioControllerState.currentFile);

        debugLog("loadAudioFile", { audioObj: audioControllerState.audioObject, file: file, callback: callback, duration: audioControllerState.audioObject.duration })

        audioControllerState.audioObject.addEventListener("play", function playEventListener() {
            audioControllerState.isPlaying = true;
            audioControllerState.isPaused = false;
            if (callbackWhen == "play") {
                callback();
            }
        });
        audioControllerState.audioObject.addEventListener("pause", function pauseEventListener() {
            audioControllerState.isPaused = true;
            if (callbackWhen == "pause") {
                callback();
            }
        });
        audioControllerState.audioObject.addEventListener("ended", function endedEventListener() {
            audioControllerState.isPlaying = false;
            audioControllerState.isPaused = false;
            if (callbackWhen == "ended" || typeof callbackWhen == undefined) {
                callback();
            }
        });
    }

    function fileCheck() {
        if (audioControllerState.currentFile != "") {
            return true;
        } else {
            return false;
        }
    }

    function handleError(error) {
        debugLog("handleError (audio). Error:", { error: error, state: audioControllerState })

        switch (error.constructor) {

            case DOMException:

                if (settings.onDOMError !== undefined) {
                    settings.onDOMError("Du skal lige interagere med din browser før vi må afspille lyden ...");
                } else {
                    console.error(error);
                }
                break;

            case SyntaxError:
                if (settings.onDOMError !== undefined) {
                    settings.onDOMError("Der er noget galt med lydfilen. Kontakt en kursusadminstrator.");
                } else {
                    console.error(error);
                }
                break;

            case Error:
                if (settings.onDOMError !== undefined) {
                    settings.onDOMError("Der er noget galt med lydfilen. Kontakt en kursusadminstrator.");
                } else {
                    console.error(error);
                }
                break;
            default:
                if (settings.onDOMError !== undefined) {
                    settings.onDOMError("Der er noget galt med lydfilen. Kontakt en kursusadminstrator.");
                } else {
                    console.error(error);
                }
                break;
        }
    }

    function clearAudioFile() {
        stopAudio();
        audioControllerState.formerFile = audioControllerState.currentFile;
        audioControllerState.currentFile = '';
        audioControllerState.audioObject = new Audio(audioControllerState.currentFile);
    }
    function muteAudio() {
        audioControllerState.audioObject.volume = 0;
    }
    function unmuteAudio() {
        audioControllerState.audioObject.volume = 1;

    }
    function getAudioControllerState() {
        return audioControllerState
    }
    function getAudioObject() {
        return audioControllerState.audioObject;
    }

    function getAudioFileDuration() {
        if (typeof audioControllerState.audioObject != 'undefined' && audioControllerState.audioObject != null) {
            if (audioControllerState.audioObject.src == "") {
                return audioControllerState.audioObject.duration;
            } else {
                return false;
            }
        }
        else {
            return false;
        }
    }

    this.PlayAudio = playAudio;
    this.ReplayAudio = replayAudio;
    this.StopAudio = stopAudio;
    this.PauseAudio = pauseAudio;
    this.FileCheck = fileCheck;
    this.LoadAudioFile = loadAudioFile;
    this.ClearAudioFile = clearAudioFile;
    this.MuteAudio = muteAudio;
    this.UnmuteAudio = unmuteAudio;
    this.GetAudioFileDuration = getAudioFileDuration;
    this.GetAudioObject = getAudioObject;
    this.GetAudioControllerState = getAudioControllerState;

    return this;
}


