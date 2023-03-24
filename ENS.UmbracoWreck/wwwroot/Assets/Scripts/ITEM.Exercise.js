
const ITEM = new Object();

function startExercise(json) {
    if (typeof json == 'undefined') {
        mapJsonToExerciseJson(function (exerciseJSON) {
            let exercise = new ITEM.Exercise(exerciseJSON, {
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
                //debugMode: true,
                navigation: { selector: "#nav", allowPreviousTask: true, allowNextTask: true }
            });
            exercise.Start();
        }, function (response) {
            console.error("Unable to load exercise JSON:", response)
        })
    } else {
        
        let exercise = new ITEM.Exercise(json, {
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
            //debugMode: true,
            navigation: { selector: "#nav", allowPreviousTask: true, allowNextTask: true }
        });
        exercise.Start();
    }

}

function mapJsonToExerciseJson(successCallback, errorCallback) {
    var json = $.getJSON({
        url: "assets/json/umbraco-test.json",
        success: function jsonLoadData(data) {

            let exerciseJSON = JSON.parse(JSON.stringify(data));
            if (typeof successCallback == 'function') {
                successCallback(exerciseJSON);
            } else {
                console.error("No success callback specified.")
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
    debugLog("jsonData:", typeof jsonData)

    //_____ Html selectors
    const exerciseHeaderTitleSelector = "#exercise-title";
    const exerciseTitleSelector = "#exercise-title";
    const exerciseDescriptionSelector = "#exercise-description"
    const introBeginSelector = "#intro-begin";

    // _____ Header
    const headerToolListSelector = ".exercise-header__tools-list"
    const headerToolItemSelector = ".task-tool";
    const settingsBtnSelector = "#exerciseSettings";
    const prevTaskSelector = "#prevTask";
    const pauseTaskSelector = "#pauseTask";
    const playTaskSelector = "#playTask";
    const enableAudioSelector = "#enableAudio";
    const disableAudioSelector = "#disableAudio";
    const skipTaskSelector = "#skipTask";
    const enableSubtitlesSelector = "#enableSubtitles";
    const disableSubtitlesSelector = "#disableSubtitles";
    const replayAudioSelector = "#replayAudio";
    const restartExerciseHeaderBtnSelector = "#restartExercise";
    const headerToolLiClass = "tools-list__item";
    const headerToolHiddenClass = 'hidden';

    // ___ Overlay
    const overlayListSelector = ".overlay__list";
    const overlayItemSelector = ".overlay__item";
    const debugOverlaySelector = "#debug-overlay";
    const settingsOverlaySelector = "#settings-overlay";
    const resultsOverlaySelector = "#results-overlay";
    const unfocusOverlaySelector = "#unfocus-overlay";
    const audioOverlaySelector = "#audio-error-overlay";
    const introOverlaySelector = "#intro-overlay";
    const resultsOverlayTaskListSelector = "#result-task-list";
    const resultsOverlayTaskStatsSelector = "#result-stats-list";
    const resultOverlayAttemptListSelector = "#result-attempt-list";
    const confirmRestartOverlaySelector = "#confirm-restart-overlay";
    const confirmRestartBtnSelector = "#confirm-restart-btn";
    const cancelRestartBtnSelector = "#cancel-restart-btn";

    // ____ settings overlay
    
    const toggleMuteSelector = "#mute-checkbox";
    const toggleSubtitlesSelector = "#subtitles-checkbox-settings";
    const toggleFeedbackSelector = "#feedback-checkbox"
    const feedbackComponentSelector = "feedback-component"
    const feedbackWrapperSelector = ".feedback-wrapper";

    const subtitlesSelector = "#subtitles";
    const subtitlesCloseSelector = "#subtitles-hide";
    const subtitlesMoveSelector = '#subtitles-move';

    const taskSelector = ".task"
    const firstTaskSelector = ".task:first";
    const activeTaskSelector = ".task.active:first";
    const taskInteractionSelector = ".interactions";
    const activeClassSelector = ".active";
    const exerciseSelector = settings.exerciseSelector;
    const navSelector = settings.navigation.selector;

    //_____ Html classes
    const taskClass = "task";
    const hiddenClass = "hidden";
    const taskInteractionsClass = "interactions"
    const activeOverlayClass = "active-overlay";
    const activeSubtitlesClass = "active-subtitles";
    const activeTaskClass = "active";
    const pauseExerciseClass = "paused";
    const activeBtnClass = "active";

    //& debug
    const debugHeaderContainerSelector = "#exercise-debug-container";
    const debugSightClass = "debug-sight";
    const debugRecordRectangleClass = "debug-record-rect";
    const debugMockInteractionClass ="mock-interaction"
    const debugMsgId = "debug-msg";
    const debugTaskTimerClass = "debug__task-timer"
    const debugTaskCountClass = "debug__task-count"


    // ____ JSON (object) selectors
    // exercise
    const exerciseTitleObjectSelector = "name";
    const exerciseDescriptionObjectSelector = "description";
    const exerciseAudiofileObjectSelector = "audioFile";
    const exerciseTaskModelsObjectSelector = "exerciseTaskModels";
    // task ...
    const taskIdObjectSelector = "id";
    const taskAudioObjectSelector = "audioFile";
    const taskDelayObjectSelector = "delay";
    const taskScreenshotObjectSelector = "screenshot";
    const taskSubtitlesObjectSelector = "subtitles";
    const taskInteractionListObjectSelector = "interactionList";
    const taskFeedbackListObjectSelector = "feedbackList";
    // interactions
    const taskInteractionIdObjectSelector = "id";
    const taskInteractionNameObjectSelector = "name";
    const taskInteractionTypeObjectSelector = "type";
    const taskInteractionFeedbackListObjectSelector = "feedbackList";
    const taskInteractionDimensionsObjectSelector = "dimensions";
    const taskInteractionAssessmentListObjectSelector = "assessmentList";
    //interaction feedback
    const taskInteractionFeedbackIdObjectSelector = "id"
    const taskInteractionFeedbackTextObjectSelector = "text";
    const taskInteractionFeedbackDisplayObjectSelector = "display";
    const taskInteractionFeedbackDisplayTypeObjectSelector = "type";
    const taskInteractionFeedbackDisplayThresholdObjectSelector = "threshold";
    const taskInteractionFeedbackHighlightObjectSelector = "highlight";
    const taskInteractionFeedbackHighlightInteractionObjectSelector = "highlightInteraction";
    const taskInteractionFeedbackTypeObjectSelector = "feedbackType";
    const taskInteractionFeedbackTypeMoodObjectSelector = "mood";
    const taskInteractionFeedbackTypeSizeObjectSelector = "size";
    const taskInteractionFeedbackDismissObjectSelector = "dismiss";
    const taskInteractionFeedbackDismissBtnText = "text";
    const taskInteractionFeedbackDismissDoItForMeObjectSelector = "doItForMe";
    const taskInteractionFeedbackDismissTypeObjectSelector = "type";
    const taskInteractionFeedbackDismissTimeoutObjectSelector = "timeout";
    // feedback
    const taskFeedbackTextObjectSelector = "text";
    const taskFeedbackDisplayObjectSelector = "display";
    const taskFeedbackDisplayTypeObjectSelector = "type";
    const taskFeedbackDisplayThresholdObjectSelector = "threshold";
    const taskFeedbackhighlightObjectSelector = "highlight";
    const taskFeedbackhighlightInteractionObjectSelector = "highlightInteraction";
    const taskFeedbackTypeObjectSelector = "feedbackType";
    const taskFeedbackTypeMoodObjectSelector = "mood";
    const taskFeedbackTypeSizeObjectSelector = "size";
    const taskFeedbackDismissObjectSelector = "dismiss";
    const taskFeedbackDismissBtnText = "text";
    const taskFeedbackDismissDoItForMeObjectSelector = "doItForMe";
    const taskFeedbackDismissTypeObjectSelector = "type";
    const taskFeedbackDismissTimeoutObjectSelector = "timeout";

    let _startDate = null;
    let _endDate = null;
    let _timers = new Object();
    let _skippedTasks = new Array();
    let _msecsSinceTaskStart = 0;
    let _taskTimerId;
    let autoCompleteEffectTimeout;

    var _logController;
    var _inputController;
    var _audioController;
    var _feedbackController;
    var _resultsController;
    var _markupController;

    var state = {
        jsonData: jsonData,
        currentTaskObject: new Object(),
        currentTaskId: new String,
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
        isSubtitled: true,

        isGeneratingRectanglesMode:false,
    }
    function clearState() {
        state.didStart = false;
        state.isFinished = false;
        state.isPaused = false;
        state.isShowingSettings = false;
        state.isShowingResults = false;
    }


    

    function start() {
        debugLog("start")

        if (!settings.showIntro && !state.didStart) {
            _startDate = new Date();
            state.didStart = true;
            _inputController?.InitInputController(state.TaskObjectArray[state.currentTaskIndex]);
            initTask();
        } else {
            initIntro()
        }
    }
    // hvad er forskellen på start() & init() ?  - init kommer først.
    // _________________________________ INIT _________________________________________
    function init() {
        debugLog("init Exercise.js")
        
        initSettings()
            .then(initControllers())
            .then(initState())
            //.then(initObjects())
            .then(initMarkup()) // markup requires objects to work correctly ... initObjects(initMarkup)?
            .then(initEventListeners())
            .then(
                initFirstTask(),
                initDebug(),
            );

        updateHeaderIcons();
    };

    function initState(json = state.jsonData) {
        state.exerciseName = json.name
    }
    async function initSettings(jsonData = state.jsonData) {
        debugLog("initSettings(), {jsonData, settings}:", { jsonData: jsonData, settings: settings });
        if (typeof jsonData.exerciseSettingsModel != 'undefined') {
            settings.debugMode = jsonData.exerciseSettingsModel?.exerciseDebugMode;
        }
        if (typeof jsonData.exerciseSettingsModel?.exerciseCustomCss != 'undefined') {
            settings.customCss = jsonData.exerciseSettingsModel.exerciseCustomCss;
        }
    }

    function initMarkup(json = state.jsonData) {
        handleExerciseCustomCss(json)
        _markupController.GenerateExerciseHeader(json);
        _markupController.GenerateExerciseIntroOverlay(json);
        _markupController.GenerateExerciseMarkup(json);
    }

    function initObjects(json = state.jsonData) {
        generateExerciseTaskObjects(json);
        generateExerciseInteractionObjects(json);
        generateExerciseFeedbackObjects(json);
    }
    function initEventListeners() {
        _inputController.InitInputController(state.TaskObjectArray[state.currentTaskIndex])

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
        $(disableSubtitlesSelector).on('click', handleDisableSubtitlesBtn)
        $(restartExerciseHeaderBtnSelector).on('click', handleRestartExerciseOverlayBtn);
        $(confirmRestartBtnSelector).on('click', handleRestartExerciseConfirmBtn);
        $(cancelRestartBtnSelector).on('click', hideConfirmResetOverlay);
        
        $(unfocusOverlaySelector).on('click', function () { resumeTask(); $(exerciseSelector).focus() });
        //settings overlay toggles...
        $(toggleMuteSelector).on('click', toggleMuteAudio);
        $(toggleSubtitlesSelector).on('click', toggleSubtitles);
        $(toggleFeedbackSelector).on('click', toggleFeedback);
        //subtitles
        $(subtitlesCloseSelector).on('click', handleCloseSubtitlesClick);
        $(subtitlesMoveSelector).on('click', moveTaskSubtitles);
        $(exerciseSelector)
            .attr("tabindex", "0")
            .trigger('focus')
            .on('focusout', handleUnfocus)
            .on('focus', handleFocus);
        
    }
    
    function initIntro() {
        $(introOverlaySelector).addClass(activeOverlayClass)
        $(introOverlaySelector).find(introBeginSelector).on("click", handleBeginExerciseBtn)
    }
    
    async function initControllers() {
        _logController = ITEM.LogController({ debugMode: settings.debugMode }, state.EventLog);
        _inputController = ITEM.InputController({
            exerciseContainerSelector: exerciseSelector,
            dblClickDetect: true,
            mouseDownDetect: true,
            keyDownDetect: true,
            logController: _logController,
            debugMode: settings.debugMode,
        });

        _audioController = ITEM.AudioController({
            onDOMError: showOverlayAudioError,
            debugMode: settings.debugMode
        });

        _feedbackController = ITEM.FeedbackController(
            `${exerciseSelector} ${taskSelector}${activeClassSelector} ${feedbackWrapperSelector}`,
            {
                debugMode: settings.debugMode,
                logController: _logController,
                exerciseController: this
            },
            {
                feedbackComponentSelector: feedbackComponentSelector,
                activeTaskSelector: activeTaskSelector,

            }
        );

        _resultsController = ITEM.ResultsController(settings, state, {});
        _markupController = ITEM.MarkupController(settings, state, { debugMode: settings.debugMode });

        debugLog("init controllers from exercise.js", { logController: _logController, inputController: _inputController, audioController: _audioController, feedbackController: _feedbackController, resultController: _resultsController, markupController: _markupController });
    }

    function initFirstTask() {
        state.currentTaskIndex = 0;

        if (typeof state.TaskObjectArray[0] != 'undefined' && state.TaskObjectArray[0]) {
            state.currentTaskId = state.TaskObjectArray[0][taskIdObjectSelector];
            state.currentTaskObject = state.TaskObjectArray[0];
        } else {
            handleInitTaskError();
        }

        $(settings.exerciseSelector).find(taskSelector).removeClass(activeTaskClass);
        $(settings.exerciseSelector).find(firstTaskSelector).addClass(activeTaskClass);
    };

    function initTask() {
        if (!state.isFinished && state.didStart && _inputController) {
            debugLog("initTask (Exercise.js)", state.TaskObjectArray[state.currentTaskIndex])

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
    function handleInitTaskError() {
        
    }

    // __ TASK FLOW _____________________________________________________________________

    function startTask() {
        if (!state.isFinished && state.didStart) {
            debugLog("startTask", state.TaskObjectArray[state.currentTaskIndex]);
            let currentTask = state.TaskObjectArray[state.currentTaskIndex];
            let currentTaskInteractionList = typeof currentTask != 'undefined' ? currentTask[taskInteractionListObjectSelector] : [];
            let currentTaskDelay = typeof currentTask != 'undefined' ? currentTask[taskDelayObjectSelector] : 0;
            
            let startDelay = 0;
            if (!startDelay || startDelay == "") {
                startDelay = 0;
            }
            let proceedDelay = 0;
            if (!proceedDelay || proceedDelay == "") {
                proceedDelay = 0;
            }

            // if no interactions && no delay (task has issues, discreetly proceed...?)
            if (currentTaskInteractionList.length == 0 && currentTaskDelay == 0) {
                proceedDelay = 500;
            } else if (currentTaskInteractionList.length == 0 && currentTaskDelay != 0) {
                // if no interactions, but delay specified (ie. the audio has to finish playing before we proceed)
                proceedDelay = currentTaskDelay;
            }

            let timerId = window.setTimeout(function () {
                if (typeof proceedDelay == 'undefined' || proceedDelay) {
                    showInstructions();
                }

                addTimerId("proceedTimer", timerId);
                startTaskTimer();

            }, startDelay);

            handleFeedbackState();
            handleMuteAudio();
            playTaskAudioFile();

            // no task interactions or delay
            if (currentTaskInteractionList.length == 0 && currentTaskDelay == 0) {
                debugLog("startTask (task issues, no interaction && delay)")
                setTimeout(onTaskEnd, proceedDelay)
            }
            // if no interactions but delay! 
            // (if fx we want to listen to an audiofile before proceeding)
            if (currentTaskInteractionList.length == 0 && currentTaskDelay > 0) {
                debugLog("startTask (no interactions, auto-proceed)", proceedDelay)
                setTimeout(onTaskEnd, proceedDelay)
            }

            updateHeaderIcons();
        }
    }

    function onTaskEnd() {
        // only engage in taskflow if exercise is not finished.
        if (!state.isFinished && state.didStart) {
            let taskEndObj = {
                timeSpentOnTask: _msecsSinceTaskStart
            }
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
            pauseTaskAudioFile()
            pauseTaskTimer();
            hideTaskSubtitles();

            let eObj = { event: "Pause Task", timeStamp: Date.now(), task: $(exerciseSelector).find(activeClassSelector), explainer: "Paused Task." };
            _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj);
        }
        debugLog("pauseTask, current EventLog:", state.EventLog);
        updateHeaderIcons()
    }

    function resumeTask() {
        if (!state.isFinished && !state.isShowingSettings && state.didStart && state.isPaused) {
            let activeTask = $(settings.exerciseSelector).find(activeClassSelector);
            state.isPaused = false;
            debugLog("resumeTask", activeTask);
            
            hideAllOverlays()

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

            let eObj = { event: "Resume Task", timeStamp: Date.now(), task: $(exerciseSelector).find(activeClassSelector), explainer: "Resumed Task." };
            _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj);
        }
    }
    function skipTask() {
        if (!state.isFinished && state.didStart) {
            let eObj = { event: "Skip Task", timeStamp: Date.now(), task: $(exerciseSelector).find(activeClassSelector), explainer: "Brugeren sprang opgavedelen over." };
            _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj);

            storeTaskEvents();
            goToNextTask();
        }
    }
    
    function goToPrevTask() {
        clearTaskSubtitles();

        if (!state.isFinished && state.didStart) {
            let activeTask = $(settings.exerciseSelector).find(activeClassSelector);

            if (state.currentTaskIndex > -1 && !activeTask.is(":first-of-type")) {
                state.currentTaskIndex--;
                if (settings.debugMode) {
                    $(`.${debugTaskCountClass}`).text(`Opgave: ${state.currentTaskIndex + 1}`); // todo
                }
                activeTask.find('input:first').val('');
                activeTask.removeClass().addClass(taskClass);
                activeTask.prev().addClass(activeTaskClass);
                initTask();
            } else {
                debugLog("First Task - can not go back.")
            }
        }
    }
    function goToNextTask() {
        clearTaskSubtitles();
        if (!state.isFinished && state.didStart) {
            let activeTask = $(settings.exerciseSelector).find(activeClassSelector);
            state.currentTaskIndex++;
            debugLog("goToNextTask (start)", activeTask)
            if (settings.debugMode) {
                $(`.${debugTaskCountClass}`).text(`Opgave: ${state.currentTaskIndex + 1}`); // todo
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
        debugLog("cleanTask()");
        $('.show-click-effect').removeClass('show-click-effect');
        $('.show-keydown-effect').remove();
        clearTimeout(autoCompleteEffectTimeout);
        pauseTaskTimer();
        _msecsSinceTaskStart = 0;
    }
    function autoCompleteTask() {
        debugLog('autoCompleteTask (start)', state.TaskObjectArray)
        state.TaskObjectArray[state.currentTaskIndex].userObject.taskDetailObject.autoComplete = true

        let eObj = {
            event: 'Task Auto-Completed.',
            timeStamp: Date.now(),
            task: state.TaskObjectArray[state.currentTaskIndex],
            explainer: 'User autocompleted/skipped task.'
        }
        _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj, 'User autocompleted/skipped task.');

        for (var interaction of state.TaskObjectArray[state.currentTaskIndex][taskInteractionListObjectSelector]) {
            switch (interaction[taskInteractionTypeObjectSelector]) {
                case "stringinput":
                    for (var asm of interaction[taskInteractionAssessmentListObjectSelector]) {
                        
                        if (asm.correctInput[0] != undefined) {
                            $(activeClassSelector + ' input:first').val('');
                            var string = asm.correctInput[0];
                            var i = 0;
                            function typeString() {
                                if (i < string.length) {
                                    $(activeClassSelector + ' input:first').val($(activeClassSelector + ' input:first').val() + string[i])
                                    i++
                                    setTimeout(typeString, 75);
                                } else if (i === string.length) {
                                    autoCompleteEffectTimeout = setTimeout(onTaskEnd, 400);
                                }
                            }
                            typeString();
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
                    for (var asm of interaction[taskInteractionAssessmentListObjectSelector]) {
                        if (asm.correctInput != undefined) {
                            var key = asm.correctInput;
                            var keyContainer = document.createElement('div');
                            keyContainer.classList.add('show-keydown-effect');
                            var keyWrapper = document.createElement('div');
                            keyWrapper.classList.add('data-key-wrapper');
                            $(activeClassSelector + ':first').append(keyContainer);
                            $(keyContainer).append(keyWrapper);
                            function displayPrettyKey(key) {
                                const prettyMap = {
                                    up: '🠅',
                                    right: '🠆',
                                    down: '🠇',
                                    left: '🠄',
                                    shift: '⇧ shift',
                                    meta: '⌘',
                                    alt: '⌥ alt',
                                    backspace: '⌫ backspace',
                                    return: '⏎ enter',
                                    capsLock: 'caps lock',
                                    tab: '↹ tab',
                                }
                                const prettyMapKey = prettyMap[key] || key;
                                return prettyMapKey;
                            }
                            if (key.includes('+')) {
                                var splitKeys = key.split('+');
                                var keyMarkupArr = [];
                                for (var key of splitKeys) {
                                    keyMarkupArr.push(`<div class="data-key">${displayPrettyKey(key)}</div>`);
                                }
                                var keyMarkup = keyMarkupArr.join('+');
                                keyWrapper.innerHTML = keyMarkup;
                            } else {
                                var keyMarkup = `<div class="data-key">${displayPrettyKey(key)}</div>`;
                                keyWrapper.innerHTML = keyMarkup;
                            }
                        }
                    }
                    autoCompleteEffectTimeout = setTimeout(onTaskEnd, 600);
                    break;
                default:
                    break;
            }
        }
    }


    // __ EXERCISE FLOW __________________________________________________________________

    function restartExercise() {
        debugLog("restartExercise", state)
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
        debugLog("handleEndExercise", state)

        let eObj = {
            event: 'Exercise Complete.',
            timeStamp: Date.now(),
            task: state.TaskObjectArray[state.currentTaskIndex],
            explainer: 'User completed the exercise.'
        }
        
        _logController.HandleOutputLogEntry(state.TaskObjectArray[state.TaskObjectArray.length -1], eObj, 'Exercise Complete.');

        clearTaskAudioFile();
        clearTaskSubtitles();
        hideTaskSubtitles();
        cleanTask();

        showResults();
        hideHeaderTools();
    }

    function showResults() {
        let exerciseResultObjectArray = _resultsController?.GetExerciseResultObjectArray(state);

        clearResultsOverlay();
        toggleResultsOverlay();
        _markupController?.GenerateExerciseResultMarkup(exerciseResultObjectArray)
    }

    // ___ OVERLAY _____________________________________________________________________
    function handleFocus() {
        debugLog("handleFocus", { showingResults: state.isShowingResults, pause: state.isPaused })
        resumeTask()
    }
    function handleUnfocus(e) {
        debugLog("handleUnfocus", { isSubtitles: $(e.relatedTarget).is(subtitlesSelector), event: e, relatedTarget: e.relatedTarget })

        // conditions for ignoring the unfocus
        if ($(e.relatedTarget).is($(settings.exerciseSelector))) { // avoid clicks on the actual exercise triggering focus/unfocus
            ignoreUnfocus();
        }
        if ($(e.relatedTarget).is(headerToolItemSelector)) { // is header tool
            ignoreUnfocus();
        }
        if ($(e.relatedTarget).parents(subtitlesSelector).length > 0 || $(e.relatedTarget).is(subtitlesSelector)) { // is subtitles
            ignoreUnfocus();
        }
        if (!state.isShowingResults && !$(exerciseSelector).is('.ignore-unfocus') && !$(e.relatedTarget).is('input')) {
            //input.stringinput to also catch header-bar <input> interactions.
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
        $(settingsOverlaySelector).toggleClass(activeOverlayClass)
    }
    function toggleDebugOverlay() {
        $(debugOverlaySelector).toggleClass(activeOverlayClass);
        $(this).toggleClass(activeBtnClass);
        return false;
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
        $(settingsOverlaySelector).addClass(activeOverlayClass)

    }
    function hideSettingsOverlay() {
        state.isShowingSettings = false;
        $(settingsOverlaySelector).removeClass(activeOverlayClass)

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
        return false;
    }

    function loadTaskSubtitles() {
        let currentTask = state.TaskObjectArray[state.currentTaskIndex];
        let subtitles = currentTask?.subtitles;
        debugLog("loadTaskSubtitles", { currentTask: currentTask, subtitles: subtitles });

        if (state.isSubtitled && typeof subtitles != 'undefined' && subtitles != null && subtitles != "") {
            $(subtitlesSelector).addClass(activeSubtitlesClass);
            $(subtitlesSelector).find("p:first").html(subtitles);
        }
    }
    function clearTaskSubtitles() {
        debugLog("clearTaskSubtitles")
        $(subtitlesSelector).removeClass(activeSubtitlesClass);
        $(subtitlesSelector).find("p:first").html("");
    }

    function moveTaskSubtitles() {
        debugLog("moveTaskSubtitles()", subtitlesMoveSelector)
        $(subtitlesSelector).toggleClass("moved");
        return false
    }
    
    function toggleSubtitles() {
        state.isSubtitled = !state.isSubtitled;
        updateHeaderIcons();
        //return false;
    }
    function showTaskSubtitles() {
        $(subtitlesSelector).removeClass(hiddenClass);
        return false;
    }
    function hideTaskSubtitles() {
        $(subtitlesSelector).addClass(hiddenClass);
        return false;
    }
    // ____ HEADER TOOLS, SETTINGS & BTN-HANDLERS ________________________________________________________________

    function updateSettingIcons() {
        if (!state.isMuted && $(toggleMuteSelector).is(':checked')) {
            $(toggleMuteSelector).toggle('checked')
        } else {
            console.log("hehe")
        }
    }

    function updateHeaderIcons() {

        if (!state.isFinished) {
            $(exerciseSettings).removeClass(hiddenClass);
            $(replayAudioSelector).removeClass(hiddenClass);
            
        } else {
            $(exerciseSettings).addClass(hiddenClass);
            $(replayAudioSelector).addClass(hiddenClass);
        }

        if (!state.isPaused) {
            $(playTaskSelector).addClass(hiddenClass);
            $(pauseTaskSelector).removeClass(hiddenClass); 

        } else {
            $(pauseTaskSelector).addClass(hiddenClass);
            $(playTaskSelector).removeClass(hiddenClass);
        }

        if (state.isMuted) {
            $(enableAudioSelector).removeClass(hiddenClass)
            $(disableAudioSelector).addClass(hiddenClass)
        } else {
            $(enableAudioSelector).addClass(hiddenClass)
            $(disableAudioSelector).removeClass(hiddenClass)
        }

        if (state.isSubtitled) {
            $(enableSubtitlesSelector).addClass(hiddenClass)
            $(disableSubtitlesSelector).removeClass(hiddenClass)
        } else {
            $(enableSubtitlesSelector).removeClass(hiddenClass)
            $(disableSubtitlesSelector).addClass(hiddenClass)
        }
    }

    function handleSettingsBtn() {
        pauseTask();
        toggleSettingsOverlay();
    }

    function handleEnableAudioBtn() {
        toggleMuteAudio();
        updateHeaderIcons();
        return false
    }
    function handleDisableAudioBtn() {
        toggleMuteAudio();
        updateHeaderIcons();
        return false
    }
    function handleEnableSubtitlesBtn() {
        state.isSubtitled = true;
        showTaskSubtitles();
        updateHeaderIcons();
    }
    function handleDisableSubtitlesBtn() {
        state.isSubtitled = false;
        hideTaskSubtitles();
        updateHeaderIcons()
    }
    function handleRestartExerciseOverlayBtn() {
        if ($(confirmRestartOverlaySelector).hasClass(activeOverlayClass)) {
            hideConfirmResetOverlay();
        } else {
            pauseTask();
            showConfirmResetOverlay();
        }
    }
    function handleRestartExerciseConfirmBtn() { // the overlay confirm restart btn - not the header btn. Here bc btn!
        debugLog("handleRestartExerciseConfirmBtn", state)
        restartExercise();
        return false
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
        debugLog("handlerBeginExerciseBtn", e)
        e.preventDefault();

        _startDate = new Date();
        state.didStart = true;

        $(introOverlaySelector).removeClass(activeOverlayClass);
        
        initTask();
    }

    // ___ AUDIO _____________________________________________________________________
    function showOverlayAudioError(error) {
        pauseTaskTimer();
        showAudioOverlay();
        $(audioOverlaySelector).find(".error-action:first").html("Tryk her for at prøve igen.")
        $(audioOverlaySelector).find(".error-detail:first").html(error)
        $(audioOverlaySelector).on("click", function clickAudioError() {

            hideAudioOverlay();
            playTaskAudioFile()
            startTaskTimer();
        })
    }
    function clearTaskAudioFile() {
        _audioController?.ClearAudioFile();
    }
    function loadTaskAudioFile() {
        let currentTask = typeof state.TaskObjectArray[state.currentTaskIndex] != 'undefined' ? state.TaskObjectArray[state.currentTaskIndex] : null
        let currentTaskAudio = currentTask != null ? currentTask[taskAudioObjectSelector] : "";
        _audioController?.LoadAudioFile(settings.assetsPath + currentTaskAudio);
    }
    function playTaskAudioFile() {
        debugLog("playTaskAudioFile")
        _audioController?.PlayAudio();
    }
    function pauseTaskAudioFile() {
        _audioController?.PauseAudio();
    }
    function replayTaskAudioFile() {
        debugLog("replayTaskAudioFile (exercise.js)", state)
        if (!state.isFinished) {
            _audioController.ReplayAudio();
            resumeTask()
        }
    }

    function toggleMuteAudio() {
        state.isMuted = !state.isMuted;
        handleMuteAudio();
        updateHeaderIcons();
    }
    function handleMuteAudio() {
        if (state.isMuted) {
            _audioController?.MuteAudio();
        } else {
            _audioController?.UnmuteAudio();
        }
    }

    // ___ FEEDBACK _____________________________________________________________________

    function storeTaskEvents() {
        let currentTaskObject = state.TaskObjectArray[state.currentTaskIndex];
        _logController?.StoreLogEntriesToTaskObject(currentTaskObject)

    }

    function showInstructions() {

    }

    function toggleFeedback() {
        state.hideFeedback = !state.hideFeedback;
        handleFeedbackState();
        updateHeaderIcons();
    }

    function handleFeedbackState() {
        debugLog("handleFeedbackState() ... state.hideFeedback = ", state.hideFeedback)
        if (state.hideFeedback) {
            _feedbackController?.DisableFeedback();
        } else {
            _feedbackController?.EnableFeedback();
        }
    }

    // ___ TIME _____________________________________________________________________
    function addTimerId(name, timerId) {

    }
    function startTaskTimer() {
        clearInterval(_taskTimerId);
        _taskTimerId = setInterval(() => {
            _msecsSinceTaskStart += 1000;
            showTaskFeedback();
            if (settings.debugMode) {
                const time = new Date(_msecsSinceTaskStart);
                const min = String(time.getMinutes()).padStart(2, '0');
                const sec = String(time.getSeconds()).padStart(2, '0');
                $(`.${debugTaskTimerClass}`).text('Tid: ' + min + ':' + sec);
            }
        }, 1000);
    }

    function pauseTaskTimer() {
        clearInterval(_taskTimerId);
    }

    function showTaskFeedback() {
        let currentTask = state.TaskObjectArray[state.currentTaskIndex];
        let taskFeedbackList = currentTask[taskFeedbackListObjectSelector];
        
        if (currentTask && typeof currentTask.taskFeedback != 'undefined' && taskFeedbackList.length > 0) {
            currentTask.taskFeedback(currentTask.id, "time", { msecsSinceTaskStart: _msecsSinceTaskStart });
        }
    }

    // ___ OBJECTS (from json) _____________________________________________________________________

    function generateExerciseTaskObjects(json) {
        const exerciseTaskModels = json[exerciseTaskModelsObjectSelector];
        debugLog("generateExerciseTaskObject", json)

        exerciseTaskModels.forEach((task, index) => {
            let tObj = {};

            tObj.index = index;
            tObj[taskAudioObjectSelector] = task[taskAudioObjectSelector];
            tObj[taskScreenshotObjectSelector] = task[taskScreenshotObjectSelector];
            tObj[taskSubtitlesObjectSelector] = task[taskSubtitlesObjectSelector]
            tObj[taskIdObjectSelector] = task[taskIdObjectSelector];
            tObj[taskInteractionListObjectSelector] = task[taskInteractionListObjectSelector];
            tObj[taskFeedbackListObjectSelector] = task[taskFeedbackListObjectSelector];
            tObj[taskDelayObjectSelector] = task[taskDelayObjectSelector];
            tObj.callback = onTaskEnd;
            tObj.taskFeedback = _feedbackController?.ShowTaskFeedback;
            tObj.interactionFeedbackList = [_feedbackController?.ShowInteractionFeedback];
            tObj.userObject =
            {
                taskLog: [],
                taskDetailObject: {} // Object open for potential extra information
            }
            state.TaskObjectArray.push(tObj);
        })
    }

    
    function getTaskInteractionCssObject(taskInteractionDimensionsRect) {
        let taskInteractionCssObject;
        taskInteractionDimensionsRect = makePercentage(taskInteractionDimensionsRect)
        taskInteractionCssObject = {
            left: taskInteractionDimensionsRect.x,
            top: taskInteractionDimensionsRect.y,
            width: taskInteractionDimensionsRect.width,
            height: taskInteractionDimensionsRect.height
        };

        return taskInteractionCssObject;
    }

    function generateExerciseInteractionObjects(json) {
        const exerciseTaskModels = json[exerciseTaskModelsObjectSelector];

        exerciseTaskModels.forEach(taskObj => {
            let taskInteractionList = taskObj[taskInteractionListObjectSelector];
            let iObj = {}
            taskInteractionList.forEach(interactionObject => {
                iObj[taskInteractionIdObjectSelector] = interactionObject[taskInteractionIdObjectSelector];
                iObj[taskInteractionNameObjectSelector] = interactionObject[taskInteractionNameObjectSelector];
                iObj[taskInteractionTypeObjectSelector] = interactionObject[taskInteractionTypeObjectSelector];
                iObj[taskInteractionDimensionsObjectSelector] = interactionObject[taskInteractionDimensionsObjectSelector];
                iObj.onCompleteId = interactionObject.onCompleteId;
                iObj.callback = _feedbackController?.ShowInteractionFeedback;
            });
            
            state.InteractionArray.push(iObj)
        });
    }

    function generateExerciseFeedbackObjects(json) {
        const exerciseTaskModels = json[exerciseTaskModelsObjectSelector];

        exerciseTaskModels.forEach(taskObj => {
            let taskId = taskObj[taskIdObjectSelector];
            let taskInteractionList = taskObj[taskInteractionListObjectSelector];
            let taskFeedbackList = taskObj[taskFeedbackListObjectSelector];

            if (taskFeedbackList && _feedbackController) {
                taskFeedbackList.forEach(feedback => {
                    let feedbackText = feedback[taskFeedbackTextObjectSelector];
                    let feedbackDisplay = feedback[taskFeedbackDisplayObjectSelector];
                    let feedbackDisplayType = feedback[taskFeedbackDisplayObjectSelector][taskFeedbackDisplayTypeObjectSelector];
                    let feedbackDisplayThreshold = feedback[taskFeedbackDisplayObjectSelector][taskFeedbackDisplayThresholdObjectSelector];
                    let feedbackHightlight = feedback[taskFeedbackhighlightObjectSelector];
                    let feedbackHighlightInteraction = feedback[taskFeedbackhighlightObjectSelector][taskFeedbackhighlightInteractionObjectSelector];
                    let feedbackType = feedback[taskFeedbackTypeObjectSelector];
                    let feedbackMood = feedback[taskFeedbackTypeObjectSelector][taskFeedbackTypeMoodObjectSelector];
                    let feedbackSize = feedback[taskFeedbackTypeObjectSelector][taskFeedbackTypeSizeObjectSelector];
                    let feedbackDismiss = feedback[taskFeedbackDismissObjectSelector];
                    let feedbackDismissBtnText = feedback[taskFeedbackDismissObjectSelector][taskFeedbackDismissBtnText];
                    let feedbackDismissDoItForMe = feedback[taskFeedbackDismissObjectSelector][taskFeedbackDismissDoItForMeObjectSelector];
                    let feedbackDismissType = feedback[taskFeedbackDismissObjectSelector][taskFeedbackDismissTypeObjectSelector];
                    let feedbackDismissTimeout = feedback[taskFeedbackDismissObjectSelector][taskFeedbackDismissTimeoutObjectSelector];
                    let feedbackDismissCallback = feedback[taskFeedbackDismissObjectSelector].callback;

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
                        const highlightId = [];
                        taskInteractionList.forEach(iObj => {
                            const interactionId = iObj.id;
                            highlightId.push(interactionId);
                        });
                        feedbackItem.SetInteractionHighlight(highlightId);
                    }
                    if (feedbackDismiss) {
                        if (feedbackDismissDoItForMe == true) {
                            feedbackItem.SetDismiss(feedbackDismissType, feedbackDismissTimeout, feedbackDismissBtnText, autoCompleteTask, feedbackDismissCallback);
                        } else {
                            feedbackItem.SetDismiss(feedbackDismissType, feedbackDismissTimeout, feedbackDismissBtnText, undefined, feedbackDismissCallback);
                        }
                    } else {
                        feedbackItem.SetDismiss("auto", "8000", undefined, false, undefined)
                    }
                    debugLog("_feedbackArray - adding taskfeedback item:", feedbackItem)

                    _feedbackController.AddFeedbackToArray(feedbackItem);
                });
            }
            if (taskInteractionList && _feedbackController) {
                taskInteractionList.forEach(interaction => {
                    let interactionId = interaction[taskInteractionIdObjectSelector];
                    let interactionFeedbackList = interaction[taskInteractionFeedbackListObjectSelector];
                    debugLog("interactionFeedbackList", interactionFeedbackList)

                    if (interactionFeedbackList) {
                        interactionFeedbackList.forEach(feedback => {
                            let interactionFeedbackId = feedback[taskInteractionFeedbackIdObjectSelector];
                            let interactionFeedbackText = feedback[taskInteractionFeedbackTextObjectSelector];
                            let interactionFeedbackType = feedback[taskInteractionFeedbackTypeObjectSelector];
                            let interactionFeedbackTypeMood = feedback[taskInteractionFeedbackTypeObjectSelector][taskInteractionFeedbackTypeMoodObjectSelector];
                            let interactionFeedbackTypeSize = feedback[taskInteractionFeedbackTypeObjectSelector][taskInteractionFeedbackTypeSizeObjectSelector];
                            let interactionFeedbackDisplay = feedback[taskInteractionFeedbackDisplayObjectSelector];
                            let interactionFeedbackDisplayType = feedback[taskInteractionFeedbackDisplayObjectSelector][taskInteractionFeedbackDisplayTypeObjectSelector];
                            let interactionFeedbackDisplayThreshold = feedback[taskInteractionFeedbackDisplayObjectSelector][taskInteractionFeedbackDisplayThresholdObjectSelector];
                            let interactionFeedbackHighlight = feedback[taskInteractionFeedbackHighlightObjectSelector];
                            let interactionFeedbackHighlightInteraction = feedback[taskInteractionFeedbackHighlightObjectSelector][taskInteractionFeedbackHighlightInteractionObjectSelector];
                            let interactionFeedbackDismiss = feedback[taskInteractionFeedbackDismissObjectSelector];
                            let interactionFeedbackDismissDoItForMe = feedback[taskInteractionFeedbackDismissObjectSelector][taskInteractionFeedbackDismissDoItForMeObjectSelector];
                            let interactionFeedbackDismissType = feedback[taskInteractionFeedbackDismissObjectSelector][taskInteractionFeedbackDismissTypeObjectSelector];
                            let interactionFeedbackDismissTimeout = feedback[taskInteractionFeedbackDismissObjectSelector][taskInteractionFeedbackDismissTimeoutObjectSelector];
                            let interactionFeedbackDismissBtnText = feedback[taskInteractionFeedbackDismissObjectSelector][taskInteractionFeedbackDismissBtnText];
                            let interactionFeedbackDismissCallback = feedback.dismiss.callback;

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
                                    feedbackItem.SetDismiss(interactionFeedbackDismissType, interactionFeedbackDismissTimeout, interactionFeedbackDismissBtnText, autoCompleteTask, interactionFeedbackDismissCallback)
                                } else {
                                    feedbackItem.SetDismiss(interactionFeedbackDismissType, interactionFeedbackDismissTimeout, interactionFeedbackDismissBtnText, undefined, interactionFeedbackDismissCallback)
                                }
                            } else {
                                feedbackItem.SetDismiss("auto", "8000", undefined, false, undefined)
                            }
                            debugLog("_feedbackArray - adding interaction item:", feedbackItem)

                            _feedbackController.AddFeedbackToArray(feedbackItem)
                        });
                    }
                });
            }
        });
    }

    

    // ___ DEBUG _____________________________________________________________________

    
    function initDebug() {
        if (settings.debugMode) {
            debugLog("initDebug", state);

            initDebugDisplays(); // header notice (task count, timer, rectangles)
            initDebugControls(); // header rightside btns
            initDebugOverlay();
        }
        

    };
    function initDebugOverlay() {
        $("#debug--finish-exercise").on("click", debugFinishAllTask);

    };
    function initDebugDisplays() {
        if (_markupController) {
            debugLog("initDebugDisplays")
            let debugMsgInput = _markupController.GetDebugMsgInput(handleDebugInputClick, handleDebugInputChange);
            let debugTaskTimer = _markupController.GetDebugTaskTimer("00:00");
            let debugTaskCount = _markupController.GetDebugTaskCount();

            $(debugHeaderContainerSelector).append(debugTaskTimer);
            $(debugHeaderContainerSelector).append(debugTaskCount);
            $(debugHeaderContainerSelector).append(debugMsgInput);
        };
    };

    function initDebugControls() {
        if (_markupController) {
            let debugMenuBtn = _markupController?.GetHeaderBtn('bug_report', toggleDebugOverlay, { tooltip: 'Debug Menu' })
            let debugSightBtn = _markupController?.GetHeaderBtn('local_fire_department', toggleDebugSight, { tooltip: 'Debug Sight' });
            let debugGenerateRectangleBtn = _markupController?.GetHeaderBtn('image_aspect_ratio', toggleMakeInteractionRectangle, { tooltip: 'Make Interaction Rectangles' });
            let debugSkipTaskBtn = _markupController?.GetHeaderBtn('skip_next', skipTask, { tooltip: 'Skip Task' });

            // seperate appends because because.
            $(headerToolListSelector).append(debugSightBtn);
            $(headerToolListSelector).append(debugMenuBtn);
            $(headerToolListSelector).append(debugGenerateRectangleBtn);
            $(headerToolListSelector).append(debugSkipTaskBtn)
        };
    };
    function handleDebugInputClick(e) {
        if ($(e.target).val().length > 0) {
            let copyValue = $(e.target).val();
            navigator.clipboard.writeText(copyValue);
            debugLog('copied to clipboard:', { copyValue: copyValue });

            $(e.target).next().text(` --copied!`);
        }
    };

    function handleDebugInputChange(e) {
        editMockInteractionRectangle(e);
    };
    function editMockInteractionRectangle(e) {
        let mockInteractionRectangles = $(`${activeTaskSelector} .${debugMockInteractionClass}`);
        let inputString = $(e.target).val();
        let sanitizedInputString = inputString.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
        let inputObject = {};

        try {
            inputObject = JSON.parse(sanitizedInputString);
        }
        catch (error) {
            handleMockInteractionRectangleError(error, e)
        }

        let cssObj = getTaskInteractionCssObject(inputObject)
        cssObj = makePercentage(cssObj);

        if (mockInteractionRectangles.length > 0) {
            mockInteractionRectangles.css(cssObj)
        }
    }

    function handleMockInteractionRectangleError(error) {
        $(`#${debugMsgId} span`).text('Input JSON error.')
        debugLog("JSON input error: ", { error: error })
    }
    function toggleMakeInteractionRectangle() {
        $('body').toggleClass(debugRecordRectangleClass);
        $(this).toggleClass(activeBtnClass);

        state.isGeneratingRectanglesMode = !state.isGeneratingRectanglesMode;
        updateHeaderIcons();
        _inputController?.ToggleReportRectangle(state.isGeneratingRectanglesMode, null)
        return false;
    }
    function toggleDebugSight() {
        $('body').toggleClass(debugSightClass);
        $(this).toggleClass(activeBtnClass);
        return false;
    }

    function debugFinishAllTask() {
        state.didStart = true;
        let tasksArray = Array.from($(taskSelector))
        for (let t = 0; t < tasksArray.length; t++) {
            skipTask();
        }
    }
    function debugLog(msg, obj) { 
        if (settings.debugMode) {
            console.log(msg, obj)
        }
    }
    // ________________________________ Helpers & Gets __________________________________
    function getCurrentTaskObject() {
        return state.TaskObjectArray[state.currentTaskIndex]
    }
    function makePercentage(obj) {
        let percentageObj = obj;
        Object.keys(percentageObj).forEach(key => {
            if (typeof percentageObj[key] == 'number') {
                percentageObj[key] = percentageObj[key] + "%";
            }
        }); // turns dimension decimals into 'percentage-string' if in number format.
        return percentageObj;
    }
    function handleExerciseCustomCss() {
        let customCssString = settings.customCss;
        debugLog("handleExerciseCustomCss, string", { customCssString: customCssString, json: json, settings: settings })

        if (typeof customCssString != 'undefined' && customCssString) {
            let styleSheet = document.createElement('style');
            styleSheet.type = 'text/css';
            styleSheet.innerHTML = customCssString;
            $(settings.contentWrapSelector).append(styleSheet);

            state.customCssSheet = styleSheet;
        }
    }
    // ___ Globals _____________________________________________________________________
    this.Start = start;
    this.GetCurrentTaskObject = getCurrentTaskObject;

    // ___ init' m8 _____________________________________________________________________

    init();
    

    return this;
}

