"use strict";

var ITEM = new Object();

function startExercise(json) {
    if (typeof json == 'undefined') {
        mapJsonToExerciseJson(function (exerciseJSON) {
            var exercise = new ITEM.Exercise(exerciseJSON, {
                contentWrapSelector: "#assetContentWrapper",
                exerciseSelector: "#assetContentWrapper .task__list",
                defaultAreaInstructionDelay: 5000,
                autoHideAreaErrorInstructionsAfter: 5000,
                help: true,
                // assetsPath: "assets/localAssets/",
                // assetsPath: "assets/extra-assets/WINDOWS10/",
                // assetsPath: "assets/extra-assets/UMBRACOJSON/",
                assetsPath: "",

                showIntro: true,
                debugMode: true,
                navigation: { selector: "#nav", allowPreviousTask: true, allowNextTask: true }
            });
            exercise.Start();
        }, function (response) {
            console.error("Unable to load exercise JSON:", response);
        });
    } else {

        var exercise = new ITEM.Exercise(json, {
            contentWrapSelector: "#assetContentWrapper",
            exerciseSelector: "#assetContentWrapper .task__list",
            defaultAreaInstructionDelay: 5000,
            autoHideAreaErrorInstructionsAfter: 5000,
            help: true,
            // assetsPath: "assets/localAssets/",
            // assetsPath: "assets/extra-assets/WINDOWS10/",
            // assetsPath: "assets/extra-assets/UMBRACOJSON/",
            assetsPath: "",
            showIntro: true,
            debugMode: false,
            navigation: { selector: "#nav", allowPreviousTask: true, allowNextTask: true }
        });
        exercise.Start();
    }
}

function mapJsonToExerciseJson(successCallback, errorCallback) {
    var json = $.getJSON({
        url: "assets/json/umbraco-test.json",
        success: function jsonLoadData(data) {

            var exerciseJSON = JSON.parse(JSON.stringify(data));
            if (typeof successCallback == 'function') {
                successCallback(exerciseJSON);
            } else {
                console.error("No success callback specified.");
            }
        },
        error: function jsonLoadDataError(response) {

            if (typeof errorCallback == 'function') {
                errorCallback(response);
            } else {
                console.error("No error callback specified.");
            }
        }
    });
};

ITEM.Exercise = function (jsonData, settings) {
    debugLog("jsonData:", typeof jsonData);

    //_____ Html selectors
    var exerciseHeaderTitleSelector = "#exercise-title";
    var exerciseTitleSelector = "#exercise-title";
    var exerciseDescriptionSelector = "#exercise-description";
    var introBeginSelector = "#intro-begin";

    // _____ Header
    var headerToolListSelector = ".exercise-header__tools-list";
    var headerToolItemSelector = ".task-tool";
    var settingsBtnSelector = "#exerciseSettings";
    var prevTaskSelector = "#prevTask";
    var pauseTaskSelector = "#pauseTask";
    var playTaskSelector = "#playTask";
    var enableAudioSelector = "#enableAudio";
    var disableAudioSelector = "#disableAudio";
    var skipTaskSelector = "#skipTask";
    var enableSubtitlesSelector = "#enableSubtitles";
    var disableSubtitlesSelector = "#disableSubtitles";
    var replayAudioSelector = "#replayAudio";
    var restartExerciseHeaderBtnSelector = "#restartExercise";
    var headerToolHiddenClass = 'hidden';

    // ___ Overlay
    var overlayListSelector = ".overlay__list";
    var overlayItemSelector = ".overlay__item";
    var debugOverlaySelector = "#debug-overlay";
    var settingsOverlaySelector = "#settings-overlay";
    var resultsOverlaySelector = "#results-overlay";
    var unfocusOverlaySelector = "#unfocus-overlay";
    var audioOverlaySelector = "#audio-error-overlay";
    var introOverlaySelector = "#intro-overlay";
    var resultsOverlayTaskListSelector = "#result-task-list";
    var resultsOverlayTaskStatsSelector = "#result-stats-list";
    var resultOverlayAttemptListSelector = "#result-attempt-list";
    var confirmRestartOverlaySelector = "#confirm-restart-overlay";
    var confirmRestartBtnSelector = "#confirm-restart-btn";
    var cancelRestartBtnSelector = "#cancel-restart-btn";

    // ____ settings overlay

    var toggleMuteSelector = "#mute-checkbox";
    var toggleSubtitlesSelector = "#subtitles-checkbox";
    var toggleFeedbackSelector = "#feedback-checkbox";
    var feedbackComponentSelector = "feedback-component";
    var feedbackWrapperSelector = ".feedback-wrapper";

    var subtitlesSelector = "#subtitles";
    var subtitlesCloseSelector = "#subtitles-hide";
    var subtitlesMoveSelector = '#subtitles-move';

    var taskSelector = ".task";
    var firstTaskSelector = ".task:first";
    var activeTaskSelector = ".task.active:first";
    var taskInteractionSelector = ".interactions";
    var activeClassSelector = ".active";
    var exerciseSelector = settings.exerciseSelector;
    var navSelector = settings.navigation.selector;

    //_____ Html classes
    var taskClass = "task";
    var taskInteractionsClass = "interactions";
    var activeOverlayClass = "active-overlay";
    var activeSubtitlesClass = "active-subtitles";
    var activeTaskClass = "active";
    var pauseExerciseClass = "paused";
    var debugSightClass = "debug-sight";

    // ____ JSON (object) selectors
    // exercise
    var exerciseTitleObjectSelector = "name";
    var exerciseDescriptionObjectSelector = "description";
    var exerciseAudiofileObjectSelector = "audioFile";
    var exerciseTaskModelsObjectSelector = "exerciseTaskModels";
    // task ...
    var taskIdObjectSelector = "id";
    var taskAudioObjectSelector = "audioFile";
    var taskDelayObjectSelector = "delay";
    var taskScreenshotObjectSelector = "screenshot";
    var taskSubtitlesObjectSelector = "subtitles";
    var taskInteractionListObjectSelector = "interactionList";
    var taskFeedbackListObjectSelector = "feedbackList";
    // interactions
    var taskInteractionIdObjectSelector = "id";
    var taskInteractionNameObjectSelector = "name";
    var taskInteractionTypeObjectSelector = "type";
    var taskInteractionFeedbackListObjectSelector = "feedbackList";
    var taskInteractionDimensionsObjectSelector = "dimensions";
    var taskInteractionAssessmentListObjectSelector = "assessmentList";
    //interaction feedback
    var taskInteractionFeedbackIdObjectSelector = "id";
    var taskInteractionFeedbackTextObjectSelector = "text";
    var taskInteractionFeedbackDisplayObjectSelector = "display";
    var taskInteractionFeedbackDisplayTypeObjectSelector = "type";
    var taskInteractionFeedbackDisplayThresholdObjectSelector = "threshold";
    var taskInteractionFeedbackHighlightObjectSelector = "highlight";
    var taskInteractionFeedbackHighlightInteractionObjectSelector = "highlightInteraction";
    var taskInteractionFeedbackTypeObjectSelector = "feedbackType";
    var taskInteractionFeedbackTypeMoodObjectSelector = "mood";
    var taskInteractionFeedbackTypeSizeObjectSelector = "size";
    var taskInteractionFeedbackDismissObjectSelector = "dismiss";
    var taskInteractionFeedbackDismissBtnText = "text";
    var taskInteractionFeedbackDismissDoItForMeObjectSelector = "doItForMe";
    var taskInteractionFeedbackDismissTypeObjectSelector = "type";
    var taskInteractionFeedbackDismissTimeoutObjectSelector = "timeout";
    // feedback
    var taskFeedbackTextObjectSelector = "text";
    var taskFeedbackDisplayObjectSelector = "display";
    var taskFeedbackDisplayTypeObjectSelector = "type";
    var taskFeedbackDisplayThresholdObjectSelector = "threshold";
    var taskFeedbackhighlightObjectSelector = "highlight";
    var taskFeedbackhighlightInteractionObjectSelector = "highlightInteraction";
    var taskFeedbackTypeObjectSelector = "feedbackType";
    var taskFeedbackTypeMoodObjectSelector = "mood";
    var taskFeedbackTypeSizeObjectSelector = "size";
    var taskFeedbackDismissObjectSelector = "dismiss";
    var taskFeedbackDismissBtnText = "text";
    var taskFeedbackDismissDoItForMeObjectSelector = "doItForMe";
    var taskFeedbackDismissTypeObjectSelector = "type";
    var taskFeedbackDismissTimeoutObjectSelector = "timeout";

    var _startDate = null;
    var _endDate = null;
    var _timers = new Object();
    var _skippedTasks = new Array();
    var _msecsSinceTaskStart = 0;
    var _taskTimerId = undefined;
    var autoCompleteEffectTimeout = undefined;

    var state = {
        jsonData: jsonData,
        currentTaskObject: new Object(),
        currentTaskId: new String(),
        currentTaskIndex: 0,
        exerciseAttemptCount: 0,

        InteractionArray: [],
        TaskObjectArray: [],
        EventLog: [],

        didStart: false,
        isFinished: false,
        isPaused: false,
        isShowingSettings: false,
        isShowingResults: false,

        hideFeedback: false,
        isMuted: false,
        isSubtitled: true
    };
    function clearState() {
        state.didStart = false;
        state.isFinished = false;
        state.isPaused = false;
        state.isShowingSettings = false;
        state.isShowingResults = false;
    }

    var _logController = ITEM.LogController({ debugMode: settings.debugMode }, state.EventLog);
    var _inputController = ITEM.InputController({
        exerciseContainerSelector: exerciseSelector,
        dblClickDetect: true,
        mouseDownDetect: true,
        keyDownDetect: true,
        logController: _logController,
        debugMode: settings.debugMode
    });

    var _audioController = ITEM.AudioController({
        onDOMError: showOverlayAudioError,
        debugMode: settings.debugMode
    });

    var _feedbackController = ITEM.FeedbackController(exerciseSelector + " " + taskSelector + activeClassSelector + " " + feedbackWrapperSelector, {
        debugMode: settings.debugMode,
        logController: _logController,
        exerciseController: this
    }, {
        feedbackComponentSelector: feedbackComponentSelector,
        activeTaskSelector: activeTaskSelector

    });

    var _resultsController = ITEM.ResultsController(settings, state, {});
    var _markupController = ITEM.MarkupController(settings, state, {});

    function init() {
        debugLog("init Exercise.js");

        initSettings(state.jsonData);
        if (settings.debugMode) {
            initDebug();
        }
        generateExercise(state.jsonData);
        updateHeaderIcons();
    }

    function initSettings(jsonData) {
        debugLog("initSettings(), {jsonData, settings}:", { jsonData: jsonData, settings: settings });
        if (typeof jsonData.exerciseSettingsModel != 'undefined') {
            settings.debugMode = jsonData.exerciseSettingsModel.exerciseDebugMode;
        }
        if (typeof jsonData.exerciseSettingsModel.exerciseCustomCss != 'undefined') {
            settings.customCss = jsonData.exerciseSettingsModel.exerciseCustomCss;
        }
    }

    function start() {
        debugLog("start");

        if (!settings.showIntro && !state.didStart) {
            _startDate = new Date();
            state.didStart = true;
            _inputController.InitInputController(state.TaskObjectArray[state.currentTaskIndex]);
            initTask();
        } else {
            initIntro();
        }
    }
    // hvad er forskellen på start() & init() ?  - init kommer først.

    function initEventListeners() {

        // Navigation / Exercise Control
        $(settingsBtnSelector).on('click', handleSettingsBtn);
        $(prevTaskSelector).on('click', goToPrevTask);
        $(pauseTaskSelector).on('click', pauseTask);
        $(playTaskSelector).on('click', resumeTask);
        $(skipTaskSelector).on('click', skipTask);
        $(replayAudioSelector).on('click', replayTaskAudioFile);
        $(enableAudioSelector).on('click', handleEnableAudioBtn);
        $(disableAudioSelector).on('click', handleDisableAudioBtn);
        $(enableSubtitlesSelector).on('click', handleEnableSubtitlesBtn);
        $(disableSubtitlesSelector).on('click', handleDisableSubtitlesBtn);
        $(restartExerciseHeaderBtnSelector).on('click', handleRestartExerciseOverlayBtn);
        $(confirmRestartBtnSelector).on('click', handleRestartExerciseConfirmBtn);
        $(cancelRestartBtnSelector).on('click', hideConfirmResetOverlay);

        $(unfocusOverlaySelector).on('click', function () {
            resumeTask();$(exerciseSelector).focus();
        });
        //settings overlay toggles...
        $(toggleMuteSelector).on('click', toggleMuteAudio);
        $(toggleSubtitlesSelector).on('click', toggleSubtitles);
        $(toggleFeedbackSelector).on('click', toggleFeedback);
        //subtitles
        $(subtitlesCloseSelector).on('click', handleCloseSubtitlesClick);
        $(subtitlesMoveSelector).on('click', moveTaskSubtitles);
        $(exerciseSelector).attr("tabindex", "0").trigger('focus').on('focusout', handleUnfocus).on('focus', handleFocus);
    }

    function initIntro() {
        $(introOverlaySelector).addClass(activeOverlayClass);
        $(introOverlaySelector).find(introBeginSelector).on("click", handleBeginExerciseBtn);
    }

    // __ TASK FLOW _____________________________________________________________________
    function initFirstTask() {
        state.currentTaskIndex = 0;
        state.currentTaskId = state.TaskObjectArray[0][taskIdObjectSelector];
        state.currentTaskObject = state.TaskObjectArray[0];

        $(settings.exerciseSelector).find(taskSelector).removeClass(activeTaskClass);
        $(settings.exerciseSelector).find(firstTaskSelector).addClass(activeTaskClass);
    }

    function initTask() {
        if (!state.isFinished && state.didStart) {
            debugLog("initTask (Exercise.js)", state.TaskObjectArray[state.currentTaskIndex]);

            if ($(activeClassSelector).before().find("input")) {
                $(exerciseSelector).trigger("focus");
            }

            _inputController.InitTask(state.TaskObjectArray[state.currentTaskIndex]);

            clearTaskAudioFile();
            loadTaskAudioFile();
            loadTaskSubtitles();
            showTaskSubtitles();
            cleanTask();

            startTask();
        }
    }

    function startTask() {
        if (!state.isFinished && state.didStart) {
            (function () {
                debugLog("startTask", state.TaskObjectArray[state.currentTaskIndex]);
                debugLog("startTask, audioControllerState:", _audioController.GetAudioControllerState());

                var startDelay = 0;
                if (!startDelay || startDelay == "") {
                    startDelay = 0;
                }
                var proceedDelay = 0;
                if (!proceedDelay || proceedDelay == "") {
                    proceedDelay = 0;
                }

                // if no interactions && no delay (task has issues, discreetly proceed...?)
                if (state.TaskObjectArray[state.currentTaskIndex][taskInteractionListObjectSelector].length == 0 && state.TaskObjectArray[state.currentTaskIndex][taskDelayObjectSelector] == 0) {
                    proceedDelay = 500;
                } else if (state.TaskObjectArray[state.currentTaskIndex][taskInteractionListObjectSelector].length == 0 && state.TaskObjectArray[state.currentTaskIndex][taskDelayObjectSelector] != 0) {
                    // if no interactions, but delay specified (ie. the audio has to finish playing before we proceed)
                    proceedDelay = state.TaskObjectArray[state.currentTaskIndex][taskDelayObjectSelector];
                }

                var timerId = window.setTimeout(function () {
                    if (typeof proceedDelay == 'undefined' || proceedDelay) {
                        showInstructions();
                    }

                    // let timerId = window.setTimeout(goToNextTask, proceedDelay);
                    addTimerId("proceedTimer", timerId);
                    startTaskTimer();
                }, startDelay);

                handleFeedbackState();
                handleMuteAudio();
                playTaskAudioFile();

                // no task interactions or delay
                if (state.TaskObjectArray[state.currentTaskIndex][taskInteractionListObjectSelector].length == 0 && state.TaskObjectArray[state.currentTaskIndex][taskDelayObjectSelector] == 0) {
                    debugLog("startTask (task issues, no interaction && delay)");
                    setTimeout(onTaskEnd, proceedDelay);
                }
                // if no interactions but delay! (if fx we want to listen to an audiofile before proceeding or to have a 10 second coffee break)
                if (state.TaskObjectArray[state.currentTaskIndex][taskInteractionListObjectSelector].length == 0 && state.TaskObjectArray[state.currentTaskIndex][taskDelayObjectSelector] > 0) {
                    debugLog("startTask (no interactions, auto-proceed)", proceedDelay);
                    setTimeout(onTaskEnd, proceedDelay);
                }

                updateHeaderIcons();
            })();
        }
    }

    function onTaskEnd() {
        // only engage in taskflow if exercise is not finished.
        if (!state.isFinished && state.didStart) {
            var taskEndObj = {
                timeSpentOnTask: _msecsSinceTaskStart
            };
            debugLog("OnTaskEnd", taskEndObj);

            storeTaskEvents();
            goToNextTask();
        }
    }
    function pauseTask() {
        // only pause if exercise did start. To avoid possible complications.
        if (!state.isFinished && state.didStart && !state.isPaused) {
            state.isPaused = true;
            showPauseOverlay();
            pauseTaskAudioFile();
            pauseTaskTimer();
            //clearTaskSubtitles();
            hideTaskSubtitles();

            var eObj = { event: "Pause Task", timeStamp: Date.now(), task: $(exerciseSelector).find(activeClassSelector), explainer: "Paused Task." };
            _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj);
        }
        debugLog("pauseTask, current EventLog:", state.EventLog);
        updateHeaderIcons();
    }

    function resumeTask() {
        if (!state.isFinished && !state.isShowingSettings && state.didStart && state.isPaused) {
            var activeTask = $(settings.exerciseSelector).find(activeClassSelector);
            state.isPaused = false;
            debugLog("resumeTask", activeTask);

            hideAllOverlays();

            if (activeTask.find("input").length > 0) {
                activeTask.find("input").trigger("focus");
            } else {
                if (!$(exerciseSelector).is(":focus")) {
                    $(exerciseSelector).trigger("focus");
                }
            }

            loadTaskSubtitles();
            if (state.isSubtitled) showTaskSubtitles();
            playTaskAudioFile();
            startTaskTimer();
            updateHeaderIcons();

            var eObj = { event: "Resume Task", timeStamp: Date.now(), task: $(exerciseSelector).find(activeClassSelector), explainer: "Resumed Task." };
            _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj);
        }
    }
    function skipTask() {
        if (!state.isFinished && state.didStart) {
            var eObj = { event: "Skip Task", timeStamp: Date.now(), task: $(exerciseSelector).find(activeClassSelector), explainer: "Brugeren sprang opgavedelen over." };
            _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj);

            storeTaskEvents();
            goToNextTask();
        }
    }

    function goToPrevTask() {
        clearTaskSubtitles();

        if (!state.isFinished && state.didStart) {
            var activeTask = $(settings.exerciseSelector).find(activeClassSelector);

            if (state.currentTaskIndex > -1 && !activeTask.is(":first-of-type")) {
                state.currentTaskIndex--;
                if (settings.debugMode) {
                    $('.taskCountSpan').text("Opgave: " + (state.currentTaskIndex + 1));
                }
                activeTask.find('input:first').val('');
                activeTask.removeClass().addClass(taskClass);
                activeTask.prev().addClass(activeTaskClass);
                initTask();
            } else {
                debugLog("First Task - can not go back.");
            }
        }
    }
    function goToNextTask() {
        clearTaskSubtitles();
        if (!state.isFinished && state.didStart) {
            var activeTask = $(settings.exerciseSelector).find(activeClassSelector);
            state.currentTaskIndex++;
            debugLog("goToNextTask (start)", activeTask);
            if (settings.debugMode) {
                $('.taskCountSpan').text("Opgave: " + (state.currentTaskIndex + 1));
            }
            if (state.TaskObjectArray[state.currentTaskIndex] != state.TaskObjectArray[state.TaskObjectArray.length] && !activeTask.is(":last-child")) {

                activeTask.removeClass().addClass(taskClass);
                activeTask.next().addClass(activeTaskClass);
                state.currentTask = $(settings.exerciseSelector).find(activeClassSelector);

                initTask();
            } else {
                handleEndExercise();
            }
        }
    }
    function cleanTask() {
        $('.show-click-effect').removeClass('show-click-effect');
        $('.show-keydown-effect').remove();
        clearTimeout(autoCompleteEffectTimeout);
        pauseTaskTimer();
        _msecsSinceTaskStart = 0;
    }
    function autoCompleteTask() {
        debugLog('autoCompleteTask (start)', state.TaskObjectArray);
        state.TaskObjectArray[state.currentTaskIndex].userObject.taskDetailObject.autoComplete = true;

        var eObj = {
            event: 'Task Auto-Completed.',
            timeStamp: Date.now(),
            task: state.TaskObjectArray[state.currentTaskIndex],
            explainer: 'User autocompleted/skipped task.'
        };
        _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj, 'User autocompleted/skipped task.');

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = state.TaskObjectArray[state.currentTaskIndex][taskInteractionListObjectSelector][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var interaction = _step.value;

                switch (interaction[taskInteractionTypeObjectSelector]) {
                    case "stringinput":
                        var _iteratorNormalCompletion2 = true;
                        var _didIteratorError2 = false;
                        var _iteratorError2 = undefined;

                        try {
                            for (var _iterator2 = interaction[taskInteractionAssessmentListObjectSelector][Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                                var asm = _step2.value;

                                if (asm.correctInput[0] != undefined) {
                                    var string;
                                    var i;

                                    (function () {
                                        var typeString = function typeString() {
                                            if (i < string.length) {
                                                $(activeClassSelector + ' input:first').val($(activeClassSelector + ' input:first').val() + string[i]);
                                                i++;
                                                setTimeout(typeString, 75);
                                            } else if (i === string.length) {
                                                autoCompleteEffectTimeout = setTimeout(onTaskEnd, 400);
                                            }
                                        };

                                        $(activeClassSelector + ' input:first').val('');
                                        string = asm.correctInput[0];
                                        i = 0;

                                        typeString();
                                    })();
                                }
                            }
                        } catch (err) {
                            _didIteratorError2 = true;
                            _iteratorError2 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                                    _iterator2["return"]();
                                }
                            } finally {
                                if (_didIteratorError2) {
                                    throw _iteratorError2;
                                }
                            }
                        }

                        break;
                    case "click":
                        $(activeClassSelector + ' .click:first').addClass('show-click-effect');
                        autoCompleteEffectTimeout = setTimeout(onTaskEnd, 1200);
                        break;
                    case "dblclick":
                        $(activeClassSelector + ' .dblclick:first').addClass('show-click-effect');
                        autoCompleteEffectTimeout = setTimeout(onTaskEnd, 1200);
                        break;
                    case "mouseover":
                        $(activeClassSelector + ' .mouseover:first').addClass('show-click-effect');
                        autoCompleteEffectTimeout = setTimeout(onTaskEnd, 1200);
                        break;
                    case "rightclick":
                        $(activeClassSelector + ' .rightclick:first').addClass('show-click-effect');
                        autoCompleteEffectTimeout = setTimeout(onTaskEnd, 1200);
                        break;
                    case "keydown":
                        var _iteratorNormalCompletion3 = true;
                        var _didIteratorError3 = false;
                        var _iteratorError3 = undefined;

                        try {
                            for (var _iterator3 = interaction[taskInteractionAssessmentListObjectSelector][Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                var asm = _step3.value;

                                if (asm.correctInput != undefined) {
                                    var displayPrettyKey = function displayPrettyKey(key) {
                                        var prettyMap = {
                                            up: '🠅',
                                            right: '🠆',
                                            down: '🠇',
                                            left: '🠄',
                                            shift: '⇧ shift',
                                            meta: '⌘',
                                            alt: '⌥ alt',
                                            backspace: '⌫ backspace',
                                            "return": '⏎ enter',
                                            capsLock: 'caps lock',
                                            tab: '↹ tab'
                                        };
                                        var prettyMapKey = prettyMap[key] || key;
                                        return prettyMapKey;
                                    };

                                    var key = asm.correctInput;
                                    var keyContainer = document.createElement('div');
                                    keyContainer.classList.add('show-keydown-effect');
                                    var keyWrapper = document.createElement('div');
                                    keyWrapper.classList.add('data-key-wrapper');
                                    $(activeClassSelector + ':first').append(keyContainer);
                                    $(keyContainer).append(keyWrapper);

                                    if (key.includes('+')) {
                                        var splitKeys = key.split('+');
                                        var keyMarkupArr = [];
                                        var _iteratorNormalCompletion4 = true;
                                        var _didIteratorError4 = false;
                                        var _iteratorError4 = undefined;

                                        try {
                                            for (var _iterator4 = splitKeys[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                                var key = _step4.value;

                                                keyMarkupArr.push("<div class=\"data-key\">" + displayPrettyKey(key) + "</div>");
                                            }
                                        } catch (err) {
                                            _didIteratorError4 = true;
                                            _iteratorError4 = err;
                                        } finally {
                                            try {
                                                if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
                                                    _iterator4["return"]();
                                                }
                                            } finally {
                                                if (_didIteratorError4) {
                                                    throw _iteratorError4;
                                                }
                                            }
                                        }

                                        var keyMarkup = keyMarkupArr.join('+');
                                        keyWrapper.innerHTML = keyMarkup;
                                    } else {
                                        var keyMarkup = "<div class=\"data-key\">" + displayPrettyKey(key) + "</div>";
                                        keyWrapper.innerHTML = keyMarkup;
                                    }
                                }
                            }
                        } catch (err) {
                            _didIteratorError3 = true;
                            _iteratorError3 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
                                    _iterator3["return"]();
                                }
                            } finally {
                                if (_didIteratorError3) {
                                    throw _iteratorError3;
                                }
                            }
                        }

                        autoCompleteEffectTimeout = setTimeout(onTaskEnd, 600);
                        break;
                    default:
                        break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator["return"]) {
                    _iterator["return"]();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    }

    // __ EXERCISE FLOW __________________________________________________________________

    function restartExercise() {
        debugLog("restartExercise", state);
        hideAllOverlays();

        clearState();

        _inputController.ICHandleRestartExercise();
        _feedbackController.FCHandleRestartExercise();

        initFirstTask();
        initIntro();
        state.exerciseAttemptCount++;
    }

    function handleEndExercise() {
        state.isFinished = true;
        debugLog("handleEndExercise", state);

        var eObj = {
            event: 'Exercise Complete.',
            timeStamp: Date.now(),
            task: state.TaskObjectArray[state.currentTaskIndex],
            explainer: 'User completed the exercise.'
        };

        _logController.HandleOutputLogEntry(state.TaskObjectArray[state.TaskObjectArray.length - 1], eObj, 'Exercise Complete.');

        clearTaskAudioFile();
        clearTaskSubtitles();
        hideTaskSubtitles();
        cleanTask();

        showResults();
        hideHeaderTools();
    }

    function showResults() {
        var exerciseResultObjectArray = _resultsController.GetExerciseResultObjectArray(state);

        clearResultsOverlay();
        toggleResultsOverlay();
        _markupController.GenerateExerciseResultMarkup(exerciseResultObjectArray);
    }

    // ___ OVERLAY _____________________________________________________________________
    function handleFocus() {
        debugLog("handleFocus", { showingResults: state.isShowingResults, pause: state.isPaused });
        resumeTask();
    }
    function handleUnfocus(e) {
        debugLog("handleUnfocus", { isSubtitles: $(e.relatedTarget).is(subtitlesSelector), event: e, relatedTarget: e.relatedTarget });
        if ($(e.relatedTarget).is(headerToolItemSelector)) {
            ignoreUnfocus();
        }
        if ($(e.relatedTarget).parents(subtitlesSelector).length > 0 || $(e.relatedTarget).is(subtitlesSelector)) {
            ignoreUnfocus();
        }
        if (!state.isShowingResults && !$(exerciseSelector).is('.ignore-unfocus') && !$(e.relatedTarget).is('input')) {
            pauseTask();
        }
        $(exerciseSelector).removeClass('ignore-unfocus');
    }

    function ignoreUnfocus() {

        $(exerciseSelector).addClass('ignore-unfocus');
        $(exerciseSelector).trigger('focus');
    }

    function showAudioOverlay() {
        $(audioOverlaySelector).addClass(activeOverlayClass);
    }
    function hideAudioOverlay() {
        $(audioOverlaySelector).removeClass(activeOverlayClass);
    }
    function showPauseOverlay() {
        $(unfocusOverlaySelector).addClass(activeOverlayClass);
        $('body').addClass(pauseExerciseClass);
    }
    function hidePauseOverlay() {
        $('body').removeClass(pauseExerciseClass);
        $(unfocusOverlaySelector).removeClass(activeOverlayClass);
    }
    function toggleSettingsOverlay() {
        state.isShowingSettings = !state.isShowingSettings;
        $(settingsOverlaySelector).toggleClass(activeOverlayClass);
    }
    function toggleDebugOverlay() {
        $(debugOverlaySelector).toggleClass(activeOverlayClass);
    }
    function toggleResultsOverlay() {
        state.isShowingResults = true;
        $(resultsOverlaySelector).toggleClass(activeOverlayClass);
    }
    function hideResultsOverlay() {
        state.isShowingResults = false;
        $(resultsOverlaySelector).removeClass(activeOverlayClass);
    }
    function clearResultsOverlay() {
        $(resultOverlayAttemptListSelector).html('');
    }
    function showSettingsOverlay() {
        state.isShowingSettings = true;
        $(settingsOverlaySelector).addClass(activeOverlayClass);
    }
    function hideSettingsOverlay() {
        state.isShowingSettings = false;
        $(settingsOverlaySelector).removeClass(activeOverlayClass);
    }
    function showConfirmResetOverlay() {
        $(confirmRestartOverlaySelector).addClass(activeOverlayClass);
    }
    function hideConfirmResetOverlay() {
        $(confirmRestartOverlaySelector).removeClass(activeOverlayClass);
    }

    function hideAllOverlays() {
        hideConfirmResetOverlay();
        hideResultsOverlay();
        hidePauseOverlay();
        hideAudioOverlay();
        hideSettingsOverlay();
    }

    // ___ SUBTITLES _____________________________________________________________________
    function handleCloseSubtitlesClick() {
        //clearTaskSubtitles();
        hideTaskSubtitles();
    }

    function loadTaskSubtitles() {
        var currentTask = state.TaskObjectArray[state.currentTaskIndex];
        debugLog("loadTaskSubtitles", currentTask);
        var subtitles = currentTask.subtitles;

        if (state.isSubtitled && typeof subtitles != 'undefined' && subtitles != null && subtitles != "") {
            $(subtitlesSelector).addClass(activeSubtitlesClass);
            $(subtitlesSelector).find("p:first").html(subtitles);
        }
    }
    function clearTaskSubtitles() {
        debugLog("clearTaskSubtitles");
        $(subtitlesSelector).removeClass(activeSubtitlesClass);
        $(subtitlesSelector).find("p:first").html("");
    }

    function moveTaskSubtitles() {
        debugLog("moveTaskSubtitles()", subtitlesMoveSelector);
        $(subtitlesSelector).toggleClass("moved");
        return false;
    }

    function toggleSubtitles() {
        state.isSubtitled = !state.isSubtitled;
        updateHeaderIcons();
        return false;
    }
    function showTaskSubtitles() {
        $(subtitlesSelector).removeClass("hidden");
        return false;
    }
    function hideTaskSubtitles() {
        $(subtitlesSelector).addClass("hidden");
        return false;
    }
    // ____ HEADER TOOLS & BTN-HANDLERS ________________________________________________________________

    function updateHeaderIcons() {
        if (!state.isPaused) {
            $(playTaskSelector).addClass("hidden");
            $(pauseTaskSelector).removeClass("hidden");
        } else {
            $(pauseTaskSelector).addClass("hidden");
            $(playTaskSelector).removeClass("hidden");
        }

        if (state.isMuted) {
            $(enableAudioSelector).removeClass("hidden");
            $(disableAudioSelector).addClass("hidden");
        } else {
            $(enableAudioSelector).addClass("hidden");
            $(disableAudioSelector).removeClass("hidden");
        }

        if (state.isSubtitled) {
            $(enableSubtitlesSelector).addClass("hidden");
            $(disableSubtitlesSelector).removeClass("hidden");
        } else {
            $(enableSubtitlesSelector).removeClass("hidden");
            $(disableSubtitlesSelector).addClass("hidden");
        }
    }

    function handleSettingsBtn() {
        pauseTask();
        toggleSettingsOverlay();
    }

    function handleEnableAudioBtn() {
        toggleMuteAudio();
        updateHeaderIcons();
        return false;
    }
    function handleDisableAudioBtn() {
        toggleMuteAudio();
        updateHeaderIcons();
        return false;
    }
    function handleEnableSubtitlesBtn() {
        state.isSubtitled = true;
        showTaskSubtitles();
        updateHeaderIcons();
    }
    function handleDisableSubtitlesBtn() {
        state.isSubtitled = false;
        hideTaskSubtitles();
        updateHeaderIcons();
    }
    function handleRestartExerciseOverlayBtn() {
        if ($(confirmRestartOverlaySelector).hasClass(activeOverlayClass)) {
            hideConfirmResetOverlay();
        } else {
            pauseTask();
            showConfirmResetOverlay();
        }
    }
    function handleRestartExerciseConfirmBtn() {
        // the overlay confirm restart btn - not the header btn. Here bc btn!
        restartExercise();
        return false;
    }

    function hideHeaderTools() {
        // does not hide restartExerciseBtn
        $(prevTaskSelector).addClass(headerToolHiddenClass);
        $(pauseTaskSelector).addClass(headerToolHiddenClass);
        $(playTaskSelector).addClass(headerToolHiddenClass);
        $(skipTaskSelector).addClass(headerToolHiddenClass);
        $(enableAudioSelector).addClass(headerToolHiddenClass);
        $(disableAudioSelector).addClass(headerToolHiddenClass);
        $(enableSubtitlesSelector).addClass(headerToolHiddenClass);
        $(disableSubtitlesSelector).addClass(headerToolHiddenClass);
        $(replayAudioSelector).addClass(headerToolHiddenClass);
        $(settingsBtnSelector).addClass(headerToolHiddenClass);
    }

    function handleBeginExerciseBtn(e) {
        e.preventDefault();
        _inputController.InitInputController(state.TaskObjectArray[state.currentTaskIndex]);

        _startDate = new Date();
        state.didStart = true;

        $(introOverlaySelector).removeClass(activeOverlayClass);
        initEventListeners();
        initTask();
    }

    // ___ AUDIO _____________________________________________________________________
    function showOverlayAudioError(error) {
        pauseTaskTimer();
        showAudioOverlay();
        $(audioOverlaySelector).find(".error-action:first").html("Tryk her for at prøve igen.");
        $(audioOverlaySelector).find(".error-detail:first").html(error);
        $(audioOverlaySelector).on("click", function clickAudioError() {

            hideAudioOverlay();
            playTaskAudioFile();
            startTaskTimer();
        });
    }
    function clearTaskAudioFile() {
        _audioController.ClearAudioFile();
    }
    function loadTaskAudioFile() {
        _audioController.LoadAudioFile(settings.assetsPath + state.TaskObjectArray[state.currentTaskIndex][taskAudioObjectSelector]);
    }
    function playTaskAudioFile() {
        debugLog("playTaskAudioFile");
        _audioController.PlayAudio();
    }
    function pauseTaskAudioFile() {
        _audioController.PauseAudio();
    }
    function replayTaskAudioFile() {
        debugLog("replayTaskAudioFile (exercise.js)", state);
        if (!state.isFinished) {
            _audioController.ReplayAudio();
            resumeTask();
        }
    }

    function playTaskAudioFileComplete() {}
    function toggleMuteAudio() {
        state.isMuted = !state.isMuted;
        handleMuteAudio();
        updateHeaderIcons();
    }
    function handleMuteAudio() {
        if (state.isMuted) {
            _audioController.MuteAudio();
        } else {
            _audioController.UnmuteAudio();
        }
    }

    // ___ FEEDBACK _____________________________________________________________________

    function storeTaskEvents() {
        var currentTask = state.TaskObjectArray[state.currentTaskIndex];
        _logController.StoreLogEntriesToTask(currentTask);
    }

    function showInstructions() {}
    function toggleFeedback() {
        state.hideFeedback = !state.hideFeedback;
        handleFeedbackState();
        updateHeaderIcons();
    }
    function handleFeedbackState() {
        debugLog("handleFeedbackState() ... state.hideFeedback = ", state.hideFeedback);
        if (state.hideFeedback) {
            _feedbackController.DisableFeedback();
        } else {
            _feedbackController.EnableFeedback();
        }
    }

    // ___ TIME _____________________________________________________________________
    function addTimerId(name, timerId) {}
    function startTaskTimer() {
        clearInterval(_taskTimerId);
        _taskTimerId = setInterval(function () {
            _msecsSinceTaskStart += 1000;
            showTaskFeedback();
            if (settings.debugMode) {
                var time = new Date(_msecsSinceTaskStart);
                var min = String(time.getMinutes()).padStart(2, '0');
                var sec = String(time.getSeconds()).padStart(2, '0');
                $('.taskTimerSpan').text('Tid: ' + min + ':' + sec);
            }
        }, 1000);
    }

    function pauseTaskTimer() {
        clearInterval(_taskTimerId);
    }

    function showTaskFeedback() {
        var currentTask = state.TaskObjectArray[state.currentTaskIndex];
        var taskFeedbackList = currentTask[taskFeedbackListObjectSelector];

        if (currentTask && taskFeedbackList.length > 0) {
            currentTask.taskFeedback(currentTask.id, "time", { msecsSinceTaskStart: _msecsSinceTaskStart });
        }
    }

    // ___ Handling JSON _____________________________________________________________________
    function getCurrentTaskObject() {
        return state.TaskObjectArray[state.currentTaskIndex];
    }
    function generateExercise(json) {
        //generateExerciseIntro(json)
        state.exerciseName = json.name;
        _markupController.GenerateExerciseHeader(json);
        _markupController.GenerateExerciseIntroOverlay(json);

        handleExerciseCustomCss(json);
        generateExerciseTaskObject(json);
        generateExerciseMarkup(json);
        generateExerciseInteraction(json);
        generateExerciseFeedback(json);
    }

    function handleExerciseCustomCss() {
        var customCssString = settings.customCss;
        debugLog("handleExerciseCustomCss, string", { customCssString: customCssString, json: json, settings: settings });

        if (typeof customCssString != 'undefined') {
            var styleSheet = document.createElement('style');
            styleSheet.type = 'text/css';
            styleSheet.innerHTML = customCssString;
            $(settings.contentWrapSelector).append(styleSheet);

            state.customCssSheet = styleSheet;
        }
    }

    function generateExerciseTaskObject(json) {
        var exerciseTaskModels = json[exerciseTaskModelsObjectSelector];
        debugLog("generateExerciseTaskObject", json);

        exerciseTaskModels.forEach(function (task, index) {
            var tObj = {};

            tObj.index = index;
            tObj[taskAudioObjectSelector] = task[taskAudioObjectSelector];
            tObj[taskScreenshotObjectSelector] = task[taskScreenshotObjectSelector];
            tObj[taskSubtitlesObjectSelector] = task[taskSubtitlesObjectSelector];
            tObj[taskIdObjectSelector] = task[taskIdObjectSelector];
            tObj[taskInteractionListObjectSelector] = task[taskInteractionListObjectSelector];
            tObj[taskFeedbackListObjectSelector] = task[taskFeedbackListObjectSelector];
            tObj[taskDelayObjectSelector] = task[taskDelayObjectSelector];
            tObj.callback = onTaskEnd;
            tObj.taskFeedback = _feedbackController.ShowTaskFeedback;
            tObj.interactionFeedbackList = [_feedbackController.ShowInteractionFeedback];
            tObj.userObject = {
                taskLog: [],
                taskDetailObject: {} // Object open for potential extra information
            };
            state.TaskObjectArray.push(tObj);
        });
    }

    function generateExerciseMarkup(json) {
        // todo: move into markupController.js
        var exerciseTaskModels = json[exerciseTaskModelsObjectSelector];
        var container = $(settings.exerciseSelector);

        exerciseTaskModels.forEach(function (taskObj) {

            var taskMarkup = [];
            var taskEleId = taskObj[taskIdObjectSelector];
            var assetsPath = settings.assetsPath + taskObj[taskScreenshotObjectSelector];
            var taskInteractionList = taskObj[taskInteractionListObjectSelector];

            taskMarkup.push("\n                <div class=\"" + taskClass + "\" id=\"" + taskEleId + "\">\n                <div class=\"" + taskInteractionsClass + "\"></div>\n                <img src=\"" + assetsPath + "\" draggable=\"false\">\n                <div class=\"feedback-wrapper\"></div>\n                </div>\n            ");
            container.append(taskMarkup);
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                var _loop = function () {
                    var interaction = _step5.value;

                    var taskInteractionId = interaction[taskInteractionIdObjectSelector];
                    var taskInteractionType = interaction[taskInteractionTypeObjectSelector];
                    var taskInteractionDimensions = interaction[taskInteractionDimensionsObjectSelector]; // decimal, not yet string.

                    if (taskInteractionType.length == 0) {
                        taskInteractionType = "none";
                    }

                    Object.keys(taskInteractionDimensions).forEach(function (key) {
                        if (typeof taskInteractionDimensions[key] == 'number') {
                            taskInteractionDimensions[key] = taskInteractionDimensions[key] + "%";
                        }
                    }); // turns dimension decimals into 'percentage-string' if in number format.

                    var interactionWrapper = document.createElement('div');
                    var interactionElm = undefined;
                    if (taskInteractionType === "stringinput") {
                        interactionElm = document.createElement('input');
                        $(interactionElm).attr({
                            "type": "text",
                            "autocomplete": "off"
                        });
                    } else {
                        interactionElm = document.createElement('span');
                    }
                    $(interactionWrapper).css(taskInteractionDimensions);
                    $(interactionElm).attr('data-interaction', taskInteractionId);

                    interactionElm.classList.add(taskInteractionType);
                    interactionWrapper.append(interactionElm);

                    $("#" + taskObj.id).find(taskInteractionSelector).append(interactionWrapper);
                };

                for (var _iterator5 = taskInteractionList[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    _loop();
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5["return"]) {
                        _iterator5["return"]();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            ;
        });

        initFirstTask();
        /*$(container).find(firstTaskSelector).addClass(activeTaskClass);*/
    }

    function generateExerciseInteraction(json) {
        var exerciseTaskModels = json[exerciseTaskModelsObjectSelector];

        exerciseTaskModels.forEach(function (taskObj) {

            var taskInteractionList = taskObj[taskInteractionListObjectSelector];
            var iObj = {};
            taskInteractionList.forEach(function (interactionObject) {
                iObj[taskInteractionIdObjectSelector] = interactionObject[taskInteractionIdObjectSelector];
                iObj[taskInteractionNameObjectSelector] = interactionObject[taskInteractionNameObjectSelector];
                iObj[taskInteractionTypeObjectSelector] = interactionObject[taskInteractionTypeObjectSelector];
                iObj[taskInteractionDimensionsObjectSelector] = interactionObject[taskInteractionDimensionsObjectSelector];
                iObj.onCompleteId = interactionObject.onCompleteId;
                iObj.callback = _feedbackController.ShowInteractionFeedback;
            });
            state.InteractionArray.push(iObj);
        });
    }
    function generateExerciseFeedback(json) {
        var exerciseTaskModels = json[exerciseTaskModelsObjectSelector];

        exerciseTaskModels.forEach(function (taskObj) {
            var taskId = taskObj[taskIdObjectSelector];
            var taskInteractionList = taskObj[taskInteractionListObjectSelector];
            var taskFeedbackList = taskObj[taskFeedbackListObjectSelector];

            if (taskFeedbackList) {
                taskFeedbackList.forEach(function (feedback) {
                    var feedbackText = feedback[taskFeedbackTextObjectSelector];
                    var feedbackDisplay = feedback[taskFeedbackDisplayObjectSelector];
                    var feedbackDisplayType = feedback[taskFeedbackDisplayObjectSelector][taskFeedbackDisplayTypeObjectSelector];
                    var feedbackDisplayThreshold = feedback[taskFeedbackDisplayObjectSelector][taskFeedbackDisplayThresholdObjectSelector];
                    var feedbackHightlight = feedback[taskFeedbackhighlightObjectSelector];
                    var feedbackHighlightInteraction = feedback[taskFeedbackhighlightObjectSelector][taskFeedbackhighlightInteractionObjectSelector];
                    var feedbackType = feedback[taskFeedbackTypeObjectSelector];
                    var feedbackMood = feedback[taskFeedbackTypeObjectSelector][taskFeedbackTypeMoodObjectSelector];
                    var feedbackSize = feedback[taskFeedbackTypeObjectSelector][taskFeedbackTypeSizeObjectSelector];
                    var feedbackDismiss = feedback[taskFeedbackDismissObjectSelector];
                    var feedbackDismissBtnText = feedback[taskFeedbackDismissObjectSelector][taskFeedbackDismissBtnText];
                    var feedbackDismissDoItForMe = feedback[taskFeedbackDismissObjectSelector][taskFeedbackDismissDoItForMeObjectSelector];
                    var feedbackDismissType = feedback[taskFeedbackDismissObjectSelector][taskFeedbackDismissTypeObjectSelector];
                    var feedbackDismissTimeout = feedback[taskFeedbackDismissObjectSelector][taskFeedbackDismissTimeoutObjectSelector];
                    var feedbackDismissCallback = feedback[taskFeedbackDismissObjectSelector].callback;

                    var feedbackItem = new ITEM.FeedbackController.FeedbackItem(feedbackText);
                    if (feedbackType) {
                        feedbackItem.SetStyleType(feedbackMood, feedbackSize);
                    } else {
                        feedbackItem.SetStyleType(undefined, undefined);
                    }
                    feedbackItem.SetType("task", taskId);
                    if (feedbackDisplay) {
                        feedbackItem.SetDisplay(feedbackDisplayType, feedbackDisplayThreshold);
                    } else {
                        feedbackItem.SetDisplay("time", 20000);
                    }

                    if (feedbackHightlight && feedbackHighlightInteraction.length > 0) {
                        feedbackItem.SetInteractionHighlight(feedbackHighlightInteraction);
                    } else {
                        (function () {
                            var highlightId = [];
                            taskInteractionList.forEach(function (iObj) {
                                var interactionId = iObj.id;
                                highlightId.push(interactionId);
                            });
                            feedbackItem.SetInteractionHighlight(highlightId);
                        })();
                    }
                    if (feedbackDismiss) {
                        if (feedbackDismissDoItForMe == true) {
                            feedbackItem.SetDismiss(feedbackDismissType, feedbackDismissTimeout, feedbackDismissBtnText, autoCompleteTask, feedbackDismissCallback);
                        } else {
                            feedbackItem.SetDismiss(feedbackDismissType, feedbackDismissTimeout, feedbackDismissBtnText, undefined, feedbackDismissCallback);
                        }
                    } else {
                        feedbackItem.SetDismiss("auto", "8000", undefined, false, undefined);
                    }
                    debugLog("_feedbackArray - adding taskfeedback item:", feedbackItem);

                    _feedbackController.AddFeedbackToArray(feedbackItem);
                });
            }
            if (taskInteractionList) {
                taskInteractionList.forEach(function (interaction) {
                    var interactionId = interaction[taskInteractionIdObjectSelector];
                    var interactionFeedbackList = interaction[taskInteractionFeedbackListObjectSelector];
                    debugLog("interactionFeedbackList", interactionFeedbackList);

                    if (interactionFeedbackList) {
                        interactionFeedbackList.forEach(function (feedback) {
                            var interactionFeedbackId = feedback[taskInteractionFeedbackIdObjectSelector];
                            var interactionFeedbackText = feedback[taskInteractionFeedbackTextObjectSelector];
                            var interactionFeedbackType = feedback[taskInteractionFeedbackTypeObjectSelector];
                            var interactionFeedbackTypeMood = feedback[taskInteractionFeedbackTypeObjectSelector][taskInteractionFeedbackTypeMoodObjectSelector];
                            var interactionFeedbackTypeSize = feedback[taskInteractionFeedbackTypeObjectSelector][taskInteractionFeedbackTypeSizeObjectSelector];
                            var interactionFeedbackDisplay = feedback[taskInteractionFeedbackDisplayObjectSelector];
                            var interactionFeedbackDisplayType = feedback[taskInteractionFeedbackDisplayObjectSelector][taskInteractionFeedbackDisplayTypeObjectSelector];
                            var interactionFeedbackDisplayThreshold = feedback[taskInteractionFeedbackDisplayObjectSelector][taskInteractionFeedbackDisplayThresholdObjectSelector];
                            var interactionFeedbackHighlight = feedback[taskInteractionFeedbackHighlightObjectSelector];
                            var interactionFeedbackHighlightInteraction = feedback[taskInteractionFeedbackHighlightObjectSelector][taskInteractionFeedbackHighlightInteractionObjectSelector];
                            var interactionFeedbackDismiss = feedback[taskInteractionFeedbackDismissObjectSelector];
                            var interactionFeedbackDismissDoItForMe = feedback[taskInteractionFeedbackDismissObjectSelector][taskInteractionFeedbackDismissDoItForMeObjectSelector];
                            var interactionFeedbackDismissType = feedback[taskInteractionFeedbackDismissObjectSelector][taskInteractionFeedbackDismissTypeObjectSelector];
                            var interactionFeedbackDismissTimeout = feedback[taskInteractionFeedbackDismissObjectSelector][taskInteractionFeedbackDismissTimeoutObjectSelector];
                            var interactionFeedbackDismissBtnText = feedback[taskInteractionFeedbackDismissObjectSelector][taskInteractionFeedbackDismissBtnText];
                            var interactionFeedbackDismissCallback = feedback.dismiss.callback;

                            var feedbackItem = new ITEM.FeedbackController.FeedbackItem(interactionFeedbackText);

                            if (interactionFeedbackId) {
                                feedbackItem.id = interactionFeedbackId;
                            }
                            if (interactionFeedbackType) {
                                feedbackItem.SetStyleType(interactionFeedbackTypeMood, interactionFeedbackTypeSize);
                            } else {
                                feedbackItem.SetStyleType(undefined, undefined);
                            }
                            feedbackItem.SetType("interaction", interactionId);
                            if (interactionFeedbackDisplay) {
                                feedbackItem.SetDisplay(interactionFeedbackDisplayType, interactionFeedbackDisplayThreshold);
                            } else {
                                feedbackItem.SetDisplay(undefined, undefined);
                            }
                            if (interactionFeedbackHighlight && interactionFeedbackHighlight.length > 0) {
                                feedbackItem.SetInteractionHighlight(interactionFeedbackHighlightInteraction);
                            } else {
                                feedbackItem.SetInteractionHighlightAsArray(interactionId);
                            }
                            if (interactionFeedbackDismiss) {
                                if (interactionFeedbackDismissDoItForMe == true) {
                                    feedbackItem.SetDismiss(interactionFeedbackDismissType, interactionFeedbackDismissTimeout, interactionFeedbackDismissBtnText, autoCompleteTask, interactionFeedbackDismissCallback);
                                } else {
                                    feedbackItem.SetDismiss(interactionFeedbackDismissType, interactionFeedbackDismissTimeout, interactionFeedbackDismissBtnText, undefined, interactionFeedbackDismissCallback);
                                }
                            } else {
                                feedbackItem.SetDismiss("auto", "8000", undefined, false, undefined);
                            }
                            debugLog("_feedbackArray - adding interaction item:", feedbackItem);

                            _feedbackController.AddFeedbackToArray(feedbackItem);
                        });
                    }
                });
            }
        });
    }

    // ___ DEBUG _____________________________________________________________________

    function initDebug() {
        var debugMenuBtn = document.createElement("a");
        debugMenuBtn.innerText = "Debug Menu";
        $(debugMenuBtn).on("click", toggleDebugOverlay);
        var taskTimerSpan = document.createElement('span');
        var taskCountSpan = document.createElement('span');
        $('#taskCount').append(taskCountSpan, taskTimerSpan);
        $(taskCountSpan).addClass('taskCountSpan');
        $(taskTimerSpan).addClass('taskTimerSpan');
        $(taskCountSpan).text("Opgave: " + (state.currentTaskIndex + 1));
        $("#debug--finish-exercise").on("click", debugFinishAllTask);

        var debugSightBtn = document.createElement('a');
        var debugSightBtnSpan = document.createElement('span');
        $(debugSightBtnSpan).addClass('material-icons');
        var debugSightBtnSpanTextNode = document.createTextNode('local_fire_department');
        debugSightBtnSpan.append(debugSightBtnSpanTextNode);
        debugSightBtn.append(debugSightBtnSpan);
        $(debugSightBtn).on('click', toggleDebugSight);

        $(navSelector).append(debugSightBtn);
        $(navSelector).append(debugMenuBtn);
    }
    function toggleDebugSight() {
        $('body').toggleClass(debugSightClass);
    }
    function debugFinishAllTask() {
        state.didStart = true;
        var tasksArray = Array.from($(taskSelector));
        for (var t = 0; t < tasksArray.length; t++) {
            skipTask();
        }
    }
    function debugLog(msg, obj) {
        //...
        if (settings.debugMode) {
            console.log(msg, obj);
        }
    }

    // ___ Globals _____________________________________________________________________

    this.Start = start;
    this.GetCurrentTaskObject = getCurrentTaskObject;

    // ___ init' m8 _____________________________________________________________________

    init();

    return this;
};

