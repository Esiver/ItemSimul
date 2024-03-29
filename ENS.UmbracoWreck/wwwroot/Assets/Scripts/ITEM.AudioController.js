﻿// The audioController is instanciated as its own object.
// fx: var_audioController = ITEM.AudioController({})
// the audioController is fed an audiofile path with loadAudioFile(filePath)
//      in theory, loadAudioFile() can also take a callback and callbackWhen, but make sure the flow is set up for it.
// audioController is controlled with playAudio(), pauseAudio(), stopAudio(), replayAudio(), muteAudio(), and unmuteAudio().

// the general flow of the audioController is as such:

// 0. init --> var _audioController = ITEM.AudioController({})
// 1. load audio file --> _audioController.loadAudioFile(path)
// 2. play audio file --> _audioController.playAudio()


// 2.5 (optional) stop audioFile --> _audioController.stopAudio()
// 3. clear audioFile --> _audioController.clearAudioFile()
// 4. load new file -->  _audioController.loadAudioFile(path)
// 5. play audio file (go to point 2)

// at one point, either the audio file is played to an end,
//      or is set to stop with _audioController.stopAudio().

// Manually calling the stopAudio() is not strictly necesarry,
//      as it is also called in clearAudioFile()
//      - in practice you could skip calling clearAudioFile() and go straight at loadAudioFile()
//      but this may in some cases throw an error, and as such clearAudioFile() is kosher.

// Be aware, that you can technically play two or more audiofiles at the same time,
// which will sound horrible.


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
            // all error handling is currently done with the onDOMError fn. 
            // needs replacing with correct error handling, if desired...
            case DOMException:

                if (settings.onDOMError !== undefined) {
                    settings.onDOMError("Du skal lige interagere med din browser før vi må afspille lyden ...");
                } else {
                    // What to do then?
                    //console.error(error);
                }
                break;

            case SyntaxError:
                if (settings.onSyntexError !== undefined) {
                    settings.onSyntaxError("Der er noget galt med lydfilen. Kontakt en kursusadminstrator.");
                } else {
                    //console.error(error);
                }
                break;

            case Error:
                if (settings.onError !== undefined) {
                    settings.onError("Der er noget galt med lydfilen. Kontakt en kursusadminstrator.");
                } else {
                    //console.error(error);
                }
                break;
            default:
                if (settings.onDefaultError !== undefined) {
                    settings.onDefaultError("Der er noget galt med lydfilen. Kontakt en kursusadminstrator.");
                } else {
                    //console.error(error);
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
        // yet to be used, and actually doesnt work...
        // but could come in handy if fixed. 
        
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


