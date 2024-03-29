// Exercise.js
// ITEM.Exercise is seen as the main vessel for running screenshot-simulation-courses.
// attaching additional controllers for functionality.

// We initialise ITEM.EXercise() with exerciseJSON (json generated from umbraco) into init()
// then starts: exercise.Start()

// The init() initialization of ITEM.Exercise runs multiple functions in a promise chain that sets up
//      all necesarry pre-conditions (settings, controllers, state, objects, etc.)
//      for the program to run.
// They're run in a promise chain to imply and emphasize a certain order in which they should be run
// (initialising the controllers in initControllers() is actually a precondition for initObjects).
//

// exercise.Start() begins the exercise UX-interaction-flow, along with preparing the intro-overlay.
// This eventually starts the exercise function composition flow, beginning
//      initTask() ==> startTask() ==> onTaskEnd() ==> isFinished ? initTask() : handleEndExercise()
//      (the above is not actual code, just logic flow)

// meanwhile, the controllers (initialised in init() ) are running their own life,
// but often referring to functions from Exercise.JS -
//      fx. the inputController, on determining that an input was the correct input, calls
//      a callback function, defined in Exercise.Js, given to an "interaction object"/"iObj".



// ___ NOTICE ON OBJECTS ___
// much communication between the controllers have been standardised in objects, and functions expects
// certain object shapes to be passed, or else wont run properly. (it would have been nice to rewrite the program in TypeScript, but I digress...)
// When Exercise.js is initialised, initObjects() is run.
// This fills the Exercise.js state-object with
//      - taskObjects from generateExerciseTaskObjects(json), into state.TaskObjectArray
//      - interactionObjects from generateExerciseInteractionObjects(json), into state.InteractionArray
//      - feedbackObjects from generateExerciseFeedbackObjects(json) into _feedbackController.AddFeedbackToArray(feedbackItem)
//          ... the feedbackObjects are stores within the _feedbackController.
//          eventually the taskObjects and the interactionObjects will call their _feedbackController.showTaskFeedback and _feedbackController.showInteractionFeedback (respectfully)
//          As such, a _feedbackController callback is made within the _inputController, by enriching a task/interaction object within Exercise.JS



// ___ NOTICE ON FOCUS ___
// One thing to be opmærksom about is that the exercise simulation program should be functional within <iframe>'s
// - and in general focus/focusout events are tricky in larger context markup.
// on Exercise.js init(), initEventListeners() is called, chain-binding:
//      $(exerciseSelector)
//          .attr("tabindex", "0")
//          .trigger('focus')
//          .on('focusout', handleUnfocus)
//          .on('focus', handleFocus);
//
// handleUnfocus thus (problematically) triggers on some interactions within the "simulation",
// namely feedback - objects and subtitles(that should be able to be interacted with without pausing the task at hand).
// - these problematic triggers we want to ignore, and gives a 'ignore-unfocus' on exerciseSelector,
// that we use to ignore the call to pauseTask().


// _____ NOTICE ON HEADER BAR & CONTROLS ____
// on Exercise.js init(), initEventListeners() is called, among others, attaching eventListeners to all the header btns.
//      fx. $(enableSubtitlesHeaderBtnSelector).on('click', handleEnableSubtitlesHeaderBtn);
// these event-handlers may change state and/or call further functionality - for the example above we might call showTaskSubtitles().
// As mentioned above, many of these header buttons change the state of the program (fx. ´the bool state.isSubtitled)
// on top of this, there may be other places where these states are altered (perhaps from the settings overlay, or on pauseTask()),
// complicating the the visual feedback of the header icons.
// To solve this, the friendly function updateHeaderIcons() updates the visual header icon buttons to correctly match state, and can be called from anywhere.


const ITEM = {};

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
            console.error("Unable to load exercise JSON:", response);
        });
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

}

ITEM.Exercise = function (jsonData, settings) {
    debugLog("jsonData:", typeof jsonData);

    //_____ Html selectors
    const exerciseHeaderTitleSelector = "#exercise-title";
    const exerciseTitleSelector = "#exercise-title";
    const exerciseDescriptionSelector = "#exercise-description";
    const introBeginSelector = "#intro-begin";

    // _____ Header
    const headerToolListSelector = ".exercise-header__tools-list";
    const headerToolItemSelector = ".task-tool";
    const settingsBtnSelector = "#exerciseSettings";
    const prevTaskSelector = "#prevTask";
    const pauseTaskSelector = "#pauseTask";
    const playTaskSelector = "#playTask";
    const enableAudioSelector = "#enableAudio";
    const disableAudioSelector = "#disableAudio";
    const skipTaskSelector = "#skipTask";
    const enableSubtitlesHeaderBtnSelector = "#enableSubtitles";
    const disableSubtitlesHeaderBtnSelector = "#disableSubtitles";
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
    const introExampleSoundSelector = "#intro-example-sound";
    const resultsOverlayTaskListSelector = "#result-task-list";
    const resultsOverlayTaskStatsSelector = "#result-stats-list";
    const resultOverlayAttemptListSelector = "#result-attempt-list";
    const confirmRestartOverlaySelector = "#confirm-restart-overlay";
    const confirmRestartBtnSelector = "#confirm-restart-btn";
    const cancelRestartBtnSelector = "#cancel-restart-btn";
    const shortcircuitOverlaySelector = "#shortcircuit-overlay";
    const shortcircuitOverlayMsgSelector = "#shortcircuit-overlay-msg";

    // ____ settings overlay

    const toggleMuteSelector = "#mute-checkbox";
    const toggleSubtitlesSettingsOverlaySelector = "#subtitles-checkbox-settings";
    const toggleFeedbackSelector = "#feedback-checkbox";
    const feedbackComponentSelector = "feedback-component";
    const feedbackWrapperSelector = ".feedback-wrapper";

    const subtitlesSelector = "#subtitles";
    const subtitlesCloseSelector = "#subtitles-hide";
    const subtitlesMoveSelector = '#subtitles-move';

    const taskSelector = ".task";
    const firstTaskSelector = ".task:first";
    const activeTaskSelector = ".task.active:first";
    const taskInteractionSelector = ".interactions";
    const activeClassSelector = ".active";
    const exerciseSelector = settings.exerciseSelector;
    const navSelector = settings.navigation.selector;

    //_____ Html classes
    const taskClass = "task";
    const hiddenClass = "hidden";
    const taskInteractionsClass = "interactions";
    const activeOverlayClass = "active-overlay";
    const activeSubtitlesClass = "active-subtitles";
    const activeTaskClass = "active";
    const pauseExerciseClass = "paused";
    const activeBtnClass = "active";

    //& debug
    const debugHeaderContainerSelector = "#exercise-debug-container";
    const debugMsgId = "debug-msg";

    const debugSightClass = "debug--sight";
    const debugRecordRectangleClass = "debug--record-rect";
    const debugMockInteractionClass = "debug__mock-interaction";
    const debugTaskTimerClass = "debug__task-timer";
    const debugTaskCountClass = "debug__task-count";


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
    const taskInteractionFeedbackIdObjectSelector = "id";
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

    //let _startDate = null;
    //let _endDate = null;
    //let _timers = new Object();
    //let _skippedTasks = new Array();
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
        currentTaskObject: {},
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
        isSubtitled: true,

        isGeneratingRectanglesMode: false,
    };
    function clearState() {
        state.didStart = false;
        state.isFinished = false;
        state.isPaused = false;
        state.isShowingSettings = false;
        state.isShowingResults = false;
    }

    function start() {
        //run upon json load succes in startExercise()
        debugLog("start");

        if (!settings.showIntro && !state.didStart) {
            _startDate = new Date();
            state.didStart = true;
            _inputController?.InitInputController(state.TaskObjectArray[state.currentTaskIndex]);
            initTask();
        } else {
            initIntro();
        }
    }


    // _________________________________ INIT _________________________________________
    function init() {
        debugLog("init Exercise.js");
        // initObjects requires controllers (initControllers()) to generate its controllers & their callbacks
        // initMarkup requires objects (initObjects()) to generate its markup from objects
        // initEventListeners requires markup (initMarkup()) to attach eventlisteners to
        // => initObjects -> initMarkup -> initEventlisteners -> ... init the rest

        initSettings()
            .then(initControllers())
            .then(initState())
            .then(initObjects())
            .then(initMarkup()) // markup requires objects to work correctly ... initObjects(initMarkup)?
            .then(initEventListeners())
            .then(
                initFirstTask(),
                initDebug(),
            );

        updateHeaderIcons();
    }

    function initState(json = state.jsonData) {
        state.exerciseName = json.name;
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
        handleExerciseCustomCss(json);
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
        // mainly for user controls and settings.
        // for task-events (simulating clicking, typings, etc ), see inputController's initGlobalEventListeners()
        let currentTaskObject = state.TaskObjectArray[state.currentTaskIndex];

        if (!currentTaskObject || currentTaskObject === void 0) {
            handleObjectError();
        } else {
            _inputController?.InitInputController(currentTaskObject);
            // Navigation / Exercise Control
            $(settingsBtnSelector).on('click', handleSettingsBtn);
            $(prevTaskSelector).on('click', goToPrevTask);
            $(pauseTaskSelector).on('click', pauseTask);
            $(playTaskSelector).on('click', resumeTask);
            $(skipTaskSelector).on('click', skipTask);
            $(replayAudioSelector).on('click', replayTaskAudioFile);
            $(enableAudioSelector).on('click', handleEnableAudioBtn);
            $(disableAudioSelector).on('click', handleDisableAudioBtn);
            $(enableSubtitlesHeaderBtnSelector).on('click', handleEnableSubtitlesHeaderBtn);
            $(disableSubtitlesHeaderBtnSelector).on('click', handleDisableSubtitlesHeaderBtn);
            $(restartExerciseHeaderBtnSelector).on('click', handleRestartExerciseOverlayBtn);
            $(confirmRestartBtnSelector).on('click', handleRestartExerciseConfirmBtn);
            $(cancelRestartBtnSelector).on('click', hideConfirmResetOverlay);

            $(unfocusOverlaySelector).on('click', function () { resumeTask(); $(exerciseSelector).focus(); });
            //settings overlay toggles...
            $(toggleMuteSelector).on('click', toggleMuteAudio);
            $(toggleSubtitlesSettingsOverlaySelector).on('click', toggleSubtitles);
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

    }

    function initIntro() {
        $(introOverlaySelector).addClass(activeOverlayClass);
        $(introOverlaySelector).find(introBeginSelector).on("click", handleBeginExerciseBtn);
    }

    async function initControllers() {
        _logController = ITEM.LogController({ debugMode: settings.debugMode }, state.EventLog); // logController should be initialized first so the other controllers can log.
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
    }

    function initTask() {
        let currentTaskObject = state.TaskObjectArray[state.currentTaskIndex];
        if (currentTaskObject === void 0 || !currentTaskObject) {
            handleInitTaskError();
        } else {
            if (!state.isFinished && state.didStart && _inputController) {
                debugLog("initTask (Exercise.js)", state.TaskObjectArray[state.currentTaskIndex]);

                if ($(activeClassSelector).before().find("input")) {
                    $(exerciseSelector).trigger("focus");
                }

                _inputController.InitTask(currentTaskObject);

                clearTaskAudioFile();
                loadTaskAudioFile();
                loadTaskSubtitles();
                showTaskSubtitles();
                cleanTask();
                startTask();
            }
        }
    }

    function handleInitTaskError() {
        let errorObject = { currentState: state, errorLocation: "inittask", errortype: "Object" };
        handleObjectError(errorObject);
    }

    // __ TASK FLOW _____________________________________________________________________

    function startTask() {
        let currentTaskObject = state.TaskObjectArray[state.currentTaskIndex];
        if (currentTaskObject === void 0 || !currentTaskObject) {
            handleStartTaskError();

        } else {
            if (!state.isFinished && state.didStart) {
                debugLog("startTask", currentTaskObject);

                let currentTaskInteractionList = typeof currentTaskObject != 'undefined' ? currentTaskObject[taskInteractionListObjectSelector] : [];
                let currentTaskDelay = typeof currentTaskObject != 'undefined' ? currentTaskObject[taskDelayObjectSelector] : 0;

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

                    //addTimerId("proceedTimer", timerId);
                    startTaskTimer();

                }, startDelay);

                handleFeedbackState();
                handleMuteAudio();
                playTaskAudioFile();

                // no task interactions or delay
                if (currentTaskInteractionList.length == 0 && currentTaskDelay == 0) {
                    debugLog("startTask (task issues, no interaction && delay)");
                    setTimeout(onTaskEnd, proceedDelay);
                }
                // if no interactions but delay! 
                // (if fx we want to listen to an audiofile before proceeding)
                if (currentTaskInteractionList.length == 0 && currentTaskDelay > 0) {
                    debugLog("startTask (no interactions, auto-proceed)", proceedDelay);
                    setTimeout(onTaskEnd, proceedDelay);
                }

            }
        }
        updateHeaderIcons();
    }

    function handleStartTaskError() {
        let errorObject = { currentState: state, errorLocation: "starttask", errortype: "Object" };
        handleObjectError(errorObject);
    }

    function onTaskEnd() {
        // only engage in taskflow if exercise is not finished.
        if (!state.isFinished && state.didStart) {
            let taskEndObj = {
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
            hideTaskSubtitles();

            let eObj = {
                event: "Pause Task", timeStamp: Date.now(),
                task: $(exerciseSelector).find(activeClassSelector),
                explainer: "Paused Task."
            };
            _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj);
        }
        debugLog("pauseTask, current EventLog:", state.EventLog);
        updateHeaderIcons();
    }

    function resumeTask() {
        if (!state.isFinished && !state.isShowingSettings && state.didStart && state.isPaused) {
            let activeTask = $(settings.exerciseSelector).find(activeClassSelector);
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

            let eObj = { event: "Resume Task", timeStamp: Date.now(), task: $(exerciseSelector).find(activeClassSelector), explainer: "Resumed Task." };
            _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj);
        }
    }
    function skipTask() {
        if (!state.isFinished && state.didStart) {
            let eObj = {
                event: "Skip Task",
                timeStamp: Date.now(),
                task: $(exerciseSelector).find(activeClassSelector),
                explainer: "Brugeren sprang opgavedelen over."
            };
            _logController.HandleOutputLogEntry(
                state.TaskObjectArray[state.currentTaskIndex],
                eObj
            );

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
                debugLog("First Task - can not go back.");
            }
        }
    }
    function goToNextTask() {
        let $activeTask = $(settings.exerciseSelector).find(activeClassSelector);
        let activeTaskObject = state.TaskObjectArray[state.currentTaskIndex];
        clearTaskSubtitles();
        if (!state.isFinished && state.didStart) {
            state.currentTaskIndex++;
            debugLog("goToNextTask (start)", $activeTask);
            if (settings.debugMode) {
                $(`.${debugTaskCountClass}`).text(`Opgave: ${state.currentTaskIndex + 1}`); // todo
            }
            if (activeTaskObject != state.TaskObjectArray[state.TaskObjectArray.length] && !$activeTask.is(":last-child")) {
                $activeTask.removeClass().addClass(taskClass);
                $activeTask.next().addClass(activeTaskClass);
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
        debugLog('autoCompleteTask (start)', state.TaskObjectArray);
        state.TaskObjectArray[state.currentTaskIndex].userObject.taskDetailObject.autoComplete = true;

        let eObj = {
            event: 'Task Auto-Completed.',
            timeStamp: Date.now(),
            task: state.TaskObjectArray[state.currentTaskIndex],
            explainer: 'User autocompleted/skipped task.'
        };
        _logController.HandleOutputLogEntry(state.TaskObjectArray[state.currentTaskIndex], eObj, 'User autocompleted/skipped task.');

        for (var interaction of state.TaskObjectArray[state.currentTaskIndex][taskInteractionListObjectSelector]) {
            switch (interaction[taskInteractionTypeObjectSelector]) {
                case "stringinput":
                    for (var assesment of interaction[taskInteractionAssessmentListObjectSelector]) {

                        if (assesment.correctInput[0] != undefined) {
                            $(activeClassSelector + ' input:first').val('');
                            var string = assesment.correctInput[0];
                            var i = 0;
                            function typeString() {
                                if (i < string.length) {
                                    $(activeClassSelector + ' input:first').val($(activeClassSelector + ' input:first').val() + string[i]);
                                    i++;
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
                    for (var assesment of interaction[taskInteractionAssessmentListObjectSelector]) {
                        if (assesment.correctInput != undefined) {
                            var key = assesment.correctInput;
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
                                };
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

        let eObj = {
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
        let exerciseResultObjectArray = _resultsController?.GetExerciseResultObjectArray(state);

        clearResultsOverlay();
        toggleResultsOverlay();
        _markupController?.GenerateExerciseResultMarkup(exerciseResultObjectArray);
    }

    // ___ OVERLAY _____________________________________________________________________
    function handleFocus() {
        debugLog("handleFocus", { showingResults: state.isShowingResults, pause: state.isPaused });
        resumeTask();
    }
    function handleUnfocus(e) {
        debugLog("handleUnfocus", { isSubtitles: $(e.relatedTarget).is(subtitlesSelector), event: e, relatedTarget: e.relatedTarget });

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

        // finally, pauseTask()
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
        $(settingsOverlaySelector).toggleClass(activeOverlayClass);
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

    function updateHeaderIcons() {
        // in case a user setting is updated, also update the visual representation of these

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
            $(enableAudioSelector).addClass(hiddenClass);
            $(disableAudioSelector).removeClass(hiddenClass);
            
        } else {
            $(enableAudioSelector).removeClass(hiddenClass);
            $(disableAudioSelector).addClass(hiddenClass);
        }

        if (state.isSubtitled) {
            $(enableSubtitlesHeaderBtnSelector).addClass(hiddenClass);
            $(disableSubtitlesHeaderBtnSelector).removeClass(hiddenClass);

        } else {
            $(enableSubtitlesHeaderBtnSelector).removeClass(hiddenClass);
            $(disableSubtitlesHeaderBtnSelector).addClass(hiddenClass);
            
        }
    }

    function updateSettingsIcons() {
        // in case a user setting is updated, also update the visual representation of these

        if (state.hideFeedback) {
            $(toggleFeedbackSelector).prop('checked', false)
        } else {
            $(toggleFeedbackSelector).prop('checked', true)
        }

        if (state.isMuted) {
            $(toggleMuteSelector).prop('checked', false)
        } else {
            $(toggleMuteSelector).prop('checked', true)
        }

        if (state.isSubtitled) {
            $(toggleSubtitlesSettingsOverlaySelector).prop('checked', true)
        } else {
            $(toggleSubtitlesSettingsOverlaySelector).prop('checked', false)
        }
    }

    function handleSettingsBtn() {
        pauseTask();
        toggleSettingsOverlay();
    }

    function handleEnableAudioBtn() {
        toggleMuteAudio();
        updateHeaderIcons();
        updateSettingsIcons();
        return false;
    }
    function handleDisableAudioBtn() {
        toggleMuteAudio();
        updateHeaderIcons();
        updateSettingsIcons();
        return false;
    }
    function handleEnableSubtitlesHeaderBtn() {
        state.isSubtitled = true;
        showTaskSubtitles();
        updateHeaderIcons();
        updateSettingsIcons();
    }
    function handleDisableSubtitlesHeaderBtn() {
        state.isSubtitled = false;
        hideTaskSubtitles();
        updateHeaderIcons();
        updateSettingsIcons();

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
        debugLog("handleRestartExerciseConfirmBtn", state);
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
        $(enableSubtitlesHeaderBtnSelector).addClass(headerToolHiddenClass);
        $(disableSubtitlesHeaderBtnSelector).addClass(headerToolHiddenClass);
        $(replayAudioSelector).addClass(headerToolHiddenClass);
        $(settingsBtnSelector).addClass(headerToolHiddenClass);

    }

    function handleBeginExerciseBtn(e) {
        debugLog("handlerBeginExerciseBtn", e);
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
        $(audioOverlaySelector).find(".error-action:first").html("Tryk her for at prøve igen.");
        $(audioOverlaySelector).find(".error-detail:first").html(error);
        $(audioOverlaySelector).on("click", function clickAudioError() {

            hideAudioOverlay();
            playTaskAudioFile();
            startTaskTimer();
        });
    }
    function clearTaskAudioFile() {
        _audioController?.ClearAudioFile();
    }
    function loadTaskAudioFile() {
        let currentTask = typeof state.TaskObjectArray[state.currentTaskIndex] != 'undefined' ? state.TaskObjectArray[state.currentTaskIndex] : null;
        let currentTaskAudio = currentTask != null ? currentTask[taskAudioObjectSelector] : "";
        _audioController?.LoadAudioFile(settings.assetsPath + currentTaskAudio);
    }
    function playTaskAudioFile() {
        debugLog("playTaskAudioFile");
        _audioController?.PlayAudio();
    }
    function pauseTaskAudioFile() {
        _audioController?.PauseAudio();
    }
    function replayTaskAudioFile() {
        debugLog("replayTaskAudioFile (exercise.js)", state);
        if (!state.isFinished) {
            _audioController.ReplayAudio();
            resumeTask();
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
        _logController?.StoreLogEntriesToTaskObject(currentTaskObject);

    }

    function showInstructions() {

    }

    function toggleFeedback() {
        state.hideFeedback = !state.hideFeedback;
        handleFeedbackState();
        updateHeaderIcons();
    }

    function handleFeedbackState() {
        debugLog("handleFeedbackState() ... state.hideFeedback = ", state.hideFeedback);
        
        if (state.hideFeedback) {
            _feedbackController?.DisableFeedback();
        } else {
            _feedbackController?.EnableFeedback();
        }
    }

    // ___ TIME _____________________________________________________________________
    //function addTimerId(name, timerId) {

    //}
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
        // READ NOTICE ON OBJECTS
        const exerciseTaskModels = json[exerciseTaskModelsObjectSelector];
        debugLog("generateExerciseTaskObject", json);
        exerciseTaskModels.forEach((task, index) => {
            let tObj = {};

            tObj.index = index;
            tObj[taskAudioObjectSelector] = task[taskAudioObjectSelector];
            tObj[taskScreenshotObjectSelector] = task[taskScreenshotObjectSelector];
            tObj[taskSubtitlesObjectSelector] = task[taskSubtitlesObjectSelector];
            tObj[taskIdObjectSelector] = task[taskIdObjectSelector];
            tObj[taskInteractionListObjectSelector] = task[taskInteractionListObjectSelector];
            tObj[taskFeedbackListObjectSelector] = task[taskFeedbackListObjectSelector];
            tObj[taskDelayObjectSelector] = task[taskDelayObjectSelector];
            tObj.callback = onTaskEnd;
            tObj.taskFeedback = _feedbackController?.ShowTaskFeedback;
            tObj.interactionFeedbackList = [_feedbackController?.ShowInteractionFeedback];
            tObj.userObject = {
                taskLog: [],
                taskDetailObject: {} // Object open for potential extra information
            };
            state.TaskObjectArray.push(tObj);
        });
    }


    function getTaskInteractionCssObject(taskInteractionDimensionsRect) {
        let taskInteractionCssObject;
        taskInteractionDimensionsRect = makePercentage(taskInteractionDimensionsRect);
        taskInteractionCssObject = {
            left: taskInteractionDimensionsRect.x,
            top: taskInteractionDimensionsRect.y,
            width: taskInteractionDimensionsRect.width,
            height: taskInteractionDimensionsRect.height
        };

        return taskInteractionCssObject;
    }

    function generateExerciseInteractionObjects(json) {
        // READ NOTICE ON OBJECTS
        const exerciseTaskModels = json[exerciseTaskModelsObjectSelector];
        
        exerciseTaskModels.forEach(taskObj => {
            let taskInteractionList = taskObj[taskInteractionListObjectSelector];
            let iObj = {};
            taskInteractionList.forEach(interactionObject => {
                iObj[taskInteractionIdObjectSelector] = interactionObject[taskInteractionIdObjectSelector];
                iObj[taskInteractionNameObjectSelector] = interactionObject[taskInteractionNameObjectSelector];
                iObj[taskInteractionTypeObjectSelector] = interactionObject[taskInteractionTypeObjectSelector];
                iObj[taskInteractionDimensionsObjectSelector] = interactionObject[taskInteractionDimensionsObjectSelector];
                iObj.onCompleteId = interactionObject.onCompleteId;
                iObj.callback = _feedbackController?.ShowInteractionFeedback;
            });

            state.InteractionArray.push(iObj);
        });
    }

    function generateExerciseFeedbackObjects(json) {
        // READ NOTICE ON OBJECTS
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
                    let feedbackId = "tf" + taskId + Date.now();

                    var feedbackItem = new ITEM.FeedbackController.FeedbackItem(feedbackText);

                    feedbackItem.SetId(feedbackId)

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
                        console.log("lol interactionFeedbackDismiss DoItForMe", feedbackItem.DoItForMe)

                        if (feedbackDismissDoItForMe == true) {
                            feedbackItem.SetDismiss(feedbackDismissType, feedbackDismissTimeout, feedbackDismissBtnText, autoCompleteTask, feedbackDismissCallback);
                        } else {
                            feedbackItem.SetDismiss(feedbackDismissType, feedbackDismissTimeout, feedbackDismissBtnText, undefined, feedbackDismissCallback);
                        }
                        if (feedbackDismissType == 'auto') {
                            // todo check for feedack do it for me or not (if / else)
                            if (feedbackDismissDoItForMe) {
                                feedbackItem.SetDismiss("auto", feedbackDismissTimeout, undefined, autoCompleteTask, undefined);
                            } else {
                                feedbackItem.SetDismiss("auto", feedbackDismissTimeout, undefined, false, undefined);

                            }
                            
                        }
                    } else {
                        feedbackItem.SetDismiss("auto", "8000", undefined, false, undefined);
                    }
                    debugLog("_feedbackArray - adding taskfeedback item:", feedbackItem);

                    _feedbackController.AddFeedbackToArray(feedbackItem);
                });
            }
            if (taskInteractionList && _feedbackController) {
                taskInteractionList.forEach(interaction => {
                    let interactionId = interaction[taskInteractionIdObjectSelector];
                    let interactionFeedbackList = interaction[taskInteractionFeedbackListObjectSelector];
                    debugLog("interactionFeedbackList", interactionFeedbackList);

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
                            let feedbackId = "ti" + taskId + Date.now();

                            var feedbackItem = new ITEM.FeedbackController.FeedbackItem(interactionFeedbackText);

                            feedbackItem.SetId(feedbackId)

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
        if (settings.debugMode) {
            debugLog("initDebug", state);

            initDebugDisplays(); // header notice (task count, timer, rectangles)
            initDebugControls(); // header rightside btns
            initDebugOverlay();
        }


    }
    function initDebugOverlay() {
        $("#debug--finish-exercise").on("click", debugFinishAllTask);

    }
    function initDebugDisplays() {
        if (_markupController) {
            debugLog("initDebugDisplays");
            let debugMsgInput = _markupController.GetDebugMsgInput(handleDebugInputClick, handleDebugInputChange);
            let debugTaskTimer = _markupController.GetDebugTaskTimer("00:00");
            let debugTaskCount = _markupController.GetDebugTaskCount();

            $(debugHeaderContainerSelector).append(debugTaskTimer);
            $(debugHeaderContainerSelector).append(debugTaskCount);
            $(debugHeaderContainerSelector).append(debugMsgInput);
        }
    }

    function initDebugControls() {
        if (_markupController) {
            let debugMenuBtn = _markupController?.GetHeaderBtn('bug_report', toggleDebugOverlay, { tooltip: 'Debug Menu' });
            let debugSightBtn = _markupController?.GetHeaderBtn('local_fire_department', toggleDebugSight, { tooltip: 'Debug Sight' });
            let debugGenerateRectangleBtn = _markupController?.GetHeaderBtn('image_aspect_ratio', toggleMakeInteractionRectangle, { tooltip: 'Make Interaction Rectangles' });
            let debugSkipTaskBtn = _markupController?.GetHeaderBtn('skip_next', skipTask, { tooltip: 'Skip Task' });

            // seperate appends because because.
            $(headerToolListSelector).append(debugSightBtn);
            $(headerToolListSelector).append(debugMenuBtn);
            $(headerToolListSelector).append(debugGenerateRectangleBtn);
            $(headerToolListSelector).append(debugSkipTaskBtn);
        }
    }
    function handleDebugInputClick(e) {
        if ($(e.target).val().length > 0) {
            let copyValue = $(e.target).val();
            navigator.clipboard.writeText(copyValue);
            debugLog('copied to clipboard:', { copyValue: copyValue });

            $(e.target).next().text(` --copied!`);
        }
    }

    function handleDebugInputChange(e) {
        editMockInteractionRectangle(e);
    }
    function editMockInteractionRectangle(e) {
        let mockInteractionRectangles = $(`${activeTaskSelector} .${debugMockInteractionClass}`);
        let inputString = $(e.target).val();
        let sanitizedInputString = inputString.replace(/(['"])?([a-z0-9A-Z_]+)(['"])?:/g, '"$2": ');
        let inputObject = {};

        try {
            inputObject = JSON.parse(sanitizedInputString);
        }
        catch (error) {
            handleMockInteractionRectangleError(error, e);
        }

        let cssObj = getTaskInteractionCssObject(inputObject);
        cssObj = makePercentage(cssObj);

        if (mockInteractionRectangles.length > 0) {
            mockInteractionRectangles.css(cssObj);
        }
    }

    function handleMockInteractionRectangleError(error) {
        $(`#${debugMsgId} span`).text('Input JSON error.');
        debugLog("JSON input error: ", { error: error });
    }
    function toggleMakeInteractionRectangle() {
        $('body').toggleClass(debugRecordRectangleClass);
        $(this).toggleClass(activeBtnClass);

        state.isGeneratingRectanglesMode = !state.isGeneratingRectanglesMode;
        updateHeaderIcons();
        _inputController?.ToggleReportRectangle(state.isGeneratingRectanglesMode, null);
        return false;
    }
    function toggleDebugSight() {
        $('body').toggleClass(debugSightClass);
        $(this).toggleClass(activeBtnClass);
        return false;
    }

    function debugFinishAllTask() {
        state.didStart = true;
        let tasksArray = Array.from($(taskSelector));
        for (let t = 0; t < tasksArray.length; t++) {
            skipTask();
        }
    }
    function debugLog(msg, obj) {
        if (settings.debugMode) {
            console.log(msg, obj);
        }
    }

    //_________________________________ error handler __________________________________
    function handleObjectError(errorObject) {
        debugLog("handleObjectError()", { state: state, errorObject: errorObject });
        exerciseShortCircuit(errorObject);
    }

    function exerciseShortCircuit(errorObject) {
        debugLog("exerciseShortCircuit()", { state: state, errorObject: errorObject });

        writeShortCircuitMsg(errorObject);
        toggleShortCircuit();
    }

    function toggleShortCircuit() {
        $(shortcircuitOverlaySelector).addClass(activeOverlayClass);
    }
    function writeShortCircuitMsg(errorObject) {
        let msg;
        if (errorObject?.errortype != void 0) {
            msg = `Fejl: ${errorObject.errortype}`;
        } else {
            msg = `Ukendt Fejl`;
        }

        $(shortcircuitOverlayMsgSelector).text(msg);
    }

    // ________________________________ Helpers & Gets __________________________________
    function getCurrentTaskObject() {
        return state.TaskObjectArray[state.currentTaskIndex];
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
        debugLog("handleExerciseCustomCss, string", { customCssString: customCssString, json: json, settings: settings });

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
};


// The audioController is instanciated as its own object.
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



// the markupController(. . .) administers markup, mainly tailored to the ItemSimu "application"
// requires settings and state to be given before usage.
// markup is generally created as nodes, not strings, for ze modern web performanze

// Here are (some, not all) of the important fn's

// generateExerciseMarkup(json) :
//      - generates all markup needed to complete an exercsise.

// generateExerciseResultMarkup()
//      - takes result objects, generates markup that shows a summation of the exercise

// getHeaderBtn()
//      - generates the button-tools that sits in the header bar for user-control

// generateExerciseIntroOverlay()
//      - generates markup necesarry to start the exercise (make sure this is generated before eventhandlers are initialized);


ITEM.MarkupController = function (settings, state, config) {

    settings.showTaskOnlyOnAutocomplete = true;
    settings.showTaskSubtitles = true;
    settings.showTaskAccuracy = false;
    settings.showTaskAutocomplete = true;

    // classes
    const headerToolLiClass = "tools-list__item";
    const headerToolBtnClass = "task-tool";

    const taskClass = "task";
    const taskInteractionsClass = "interactions";

    const debugToolClass = "debug__tool";
    const debugTaskCountClass = "debug__task-count";
    const debugTaskTimerClass = "debug__task-timer";
    const debugMsgId = "debug-msg";

    const alertClass = "alert";
    const hiddenClass = "hidden";
    const buttonPlayingClass = 'button--playing';

    const resultClass = "result"
    const resultTaskListClass = `${resultClass}__task-list`;
    const resultItemClass = `${resultClass}__item`;
    const resultInfoClass = `${resultClass}__info`;
    const resultInfoItemClass = `${resultClass}__info-item`;
    const resultDetailsClass = `${resultClass}__details`;
    const resultNoticeClass = `${resultClass}__notice`;
    const resultQuoteClass = `${resultClass}__quote`;

    const materialIconsClass = 'material-icons';


    // selectors 
    const exerciseOverlayResultAttemptListSelector = "#result-attempt-list";

    const exerciseHeaderTitleSelector = "#exercise-header-title";
    const exerciseTitleSelector = "#exercise-title";
    const exerciseDescriptionSelector = "#exercise-description"
    const introBeginSelector = "#intro-begin";

    const resultsOverlayTaskListSelector = "#result-task-list";
    const resultsOverlayTaskStatsSelector = "#result-stats-list";
    const introOverlaySelector = "#intro-overlay";
    const introSoundNoticeCardSelector = "#audio-info"
    const introSubtitleNoticeCardSelector = "#subtitle-info";

    const taskInteractionSelector = ".interactions"

    // object selectors
    const exerciseTitleObjectSelector = "name";
    const exerciseDescriptionObjectSelector = "description";
    const exerciseAudiofileObjectSelector = "audioFile";
    const exerciseTaskModelsObjectSelector = "exerciseTaskModels";
    const taskScreenshotObjectSelector = "screenshot"
    const taskInteractionListObjectSelector = "interactionList"
    const taskIdObjectSelector = "id";
    const taskInteractionIdObjectSelector = "id";
    const taskInteractionTypeObjectSelector = "type"
    const taskInteractionDimensionsObjectSelector = "dimensions"

    function init() { };
    init();

    // major components //

    function generateExerciseMarkup(json) {
        const exerciseTaskModels = json[exerciseTaskModelsObjectSelector];
        const container = $(settings.exerciseSelector);

        exerciseTaskModels.forEach(taskObj => {
            let taskMarkup = []
            let taskEleId = taskObj[taskIdObjectSelector];
            let assetsPath = settings.assetsPath + taskObj[taskScreenshotObjectSelector];
            let taskInteractionObjectList = taskObj[taskInteractionListObjectSelector];
            
            taskMarkup.push(`
                <div class="${taskClass}" id="${taskEleId}">
                <div class="${taskInteractionsClass}"></div>
                <img src="${assetsPath}" draggable="false">
                <div class="feedback-wrapper"></div>
                </div>
            `);
            container.append(taskMarkup)

            for (let interaction of taskInteractionObjectList) {
                let taskInteractionId = interaction[taskInteractionIdObjectSelector];
                let taskInteractionType = interaction[taskInteractionTypeObjectSelector];
                let taskInteractionDimensions = interaction[taskInteractionDimensionsObjectSelector]; // decimal, not yet string.
                let taskInteractionCssObject = getTaskInteractionPositionCssObject(taskInteractionDimensions)

                const interactionWrapper = document.createElement('div');
                let interactionElm;

                if (taskInteractionType.length == 0) {
                    taskInteractionType = "none"
                }

                if (taskInteractionType === "stringinput") {
                    interactionElm = document.createElement('input');
                    $(interactionElm).attr({
                        "type": "text",
                        "autocomplete": "off"
                    });
                } else {
                    interactionElm = document.createElement('span');
                }

                $(interactionWrapper).css(taskInteractionCssObject);
                $(interactionElm).attr('data-interaction', taskInteractionId)

                interactionElm.classList.add(taskInteractionType);
                interactionWrapper.append(interactionElm);

                $(`#${taskObj.id}`).find(taskInteractionSelector).append(interactionWrapper);
            };
        });

    }
    function generateExerciseResultMarkup(exerciseResultObjectArray) {
        exerciseResultObjectArray.forEach(exerciseAttemptInstance => {
            let exerciseResultSummaryDom = getExerciseResultSummaryDom(exerciseAttemptInstance);
            let exerciseAttemptInstanceTaskResultObjectArray = exerciseAttemptInstance.exerciseTaskResultObjectArray;
            let exerciseAttemptInstanceResultsDom = document.createElement('li');
            let taskResultList = document.createElement('ul');
            taskResultList.classList.add(resultTaskListClass);

            exerciseAttemptInstanceTaskResultObjectArray.forEach(taskEventObject => {
                let taskResultLiDom = document.createElement("li");
                taskResultLiDom.classList.add(resultItemClass)
                taskResultLiDom.setAttribute('data-task-index', taskEventObject.index)

                //let itemDetailsDom = getTaskDetailsDom(taskEventObject); // outcommented, we do not want a lot of info on each task-card atm.
                let itemHeaderDom = getTaskHeaderDom(taskEventObject);
                let itemInfoDom = getTaskInfoDom(taskEventObject);

                taskResultLiDom.append(itemHeaderDom)
                taskResultLiDom.append(itemInfoDom)

                if (settings.showTaskOnlyOnAutocomplete) {
                    if (taskEventObject.userDidAutoCompleteEvent) {
                        taskResultList.append(taskResultLiDom)
                    }
                } else {
                    taskResultList.append(taskResultLiDom)
                }
            })

            exerciseAttemptInstanceResultsDom.append(exerciseResultSummaryDom);
            exerciseAttemptInstanceResultsDom.append(taskResultList);

            $(exerciseOverlayResultAttemptListSelector).append(exerciseAttemptInstanceResultsDom);
        })


    }

    // ___ DOM minor components ___
    // ... for results overlay


    function getExerciseResultSummaryDom(exerciseResultObject) {
        // for each exerciseObject in exerciseResultObjectArray, make a summary
        
        let resultSummaryDom = document.createElement('div');

        let headerDom = document.createElement('h2');
        let attemptCountString = exerciseResultObject?.index != void 0 ? `Forsøg nr. ${exerciseResultObject.index + 1}` : '';
        let headerTextNode = document.createTextNode(`${attemptCountString} - Flot klaret `);
        headerDom.append(headerTextNode);

        let subheaderDom = document.createElement('h3')
        
        let subheaderTextNode = document.createTextNode(`Du har gennemført '${exerciseResultObject.name}'. Vil du prøve igen?`);
        subheaderDom.append(subheaderTextNode);

        let precisionInfoDom = document.createElement('p');
        let precisionInfoTextNode = document.createTextNode(`Gennemsnitslig træfsikkerhed: ${exerciseResultObject.exerciseMeanPrecision} % ${exerciseResultObject.exerciseMeanPrecision <= 50 ? " - Prøv lige en gang til." : ""}`)
        precisionInfoDom.append(precisionInfoTextNode);

        let interactionCountDom = document.createElement('p');
        let interactionDountTextNode = document.createTextNode(`Antal interaktioner: ${exerciseResultObject.exerciseInteractionCount}`)
        interactionCountDom.append(interactionDountTextNode);

        let taskAutocompleteNoticeDom = document.createElement('div');
        let taskAutoCompleteNoticeTextNode = document.createTextNode(`Du trykkede på 'Gør det for mig', og fik hjælp til en eller flere opgaver. Antal: ${exerciseResultObject.exerciseAutocompleteCount}`);
        let taskAutocompleteNoticeIconDom = document.createElement('span');
        let taskAutocompleteNoticeIconTextNode = document.createTextNode('warning');
        taskAutocompleteNoticeIconDom.classList.add(materialIconsClass);
        taskAutocompleteNoticeIconDom.append(taskAutocompleteNoticeIconTextNode)
        taskAutocompleteNoticeDom.classList.add(alertClass, resultNoticeClass);
        taskAutocompleteNoticeDom.append(taskAutocompleteNoticeIconDom, taskAutoCompleteNoticeTextNode);

        resultSummaryDom.append(headerDom, subheaderDom);
        if (exerciseResultObject.exerciseAutocompleteCount > 0) {
            resultSummaryDom.append(taskAutocompleteNoticeDom);
        }

        return resultSummaryDom;
    };

    function getTaskDetailsDom(task) {
        let detailsDom = document.createElement('div');
        detailsDom.classList.add(resultDetailsClass);

        return detailsDom;
    };

    function getTaskInfoDom(taskResultObject) {
        let infoDom = document.createElement('div');
        infoDom.classList.add(resultInfoClass);

        if (settings.showTaskAutocomplete) {
            if (taskResultObject.userDidAutoCompleteEvent) {
                let userAutoCompleteDom = getUserAutoCompleteResultDom(taskResultObject.userDidAutoCompleteEvent);
                infoDom.append(userAutoCompleteDom);
            }
        }


        let taskSubtitlesDom = document.createElement('div')
        let taskSubtitlesTextNode = document.createTextNode(`“ ${taskResultObject.subtitles} ”`)
        taskSubtitlesDom.append(taskSubtitlesTextNode)
        taskSubtitlesDom.classList.add(resultQuoteClass);
        taskSubtitlesDom.classList.add(resultInfoItemClass);

        infoDom.append(taskSubtitlesDom);
        // -------------------------------

        if (!taskResultObject.userDidAutoCompleteEvent) {
            let taskGreatSuccessDom = getTaskSuccessDom()
            infoDom.append(taskGreatSuccessDom)
        }

        if (settings.showTaskAccuracy) {
            let userPrecisionCommentDom = document.createElement('p')
            let commentNode = document.createTextNode(`Træfsikkerhed: ${roundNumber(taskResultObject.userPrecision, 2)} % ${taskResultObject.userPrecision <= 50 ? "- Prøv igen." : ""}`);
            userPrecisionCommentDom.append(commentNode);
            infoDom.append(userPrecisionCommentDom)
        }

        return infoDom;
    };

    function getTaskHeaderDom(taskResultObject) {
        
        let headerDom = document.createElement('summary');

        let titleDom = document.createElement('h4');
        let iconDom = document.createElement('span');
        let headerTextNode = document.createTextNode(`Opgave ${taskResultObject.index + 1}`); // bug: always 1???
        let iconTextNode = document.createTextNode('expand_more');

        titleDom.append(headerTextNode); 
        iconDom.classList.add(materialIconsClass);
        iconDom.append(iconTextNode);
        headerDom.append(titleDom);

        return headerDom;
    };

    function getUserAutoCompleteResultDom() {
        let noticeSpanDom = document.createElement('span');

        noticeSpanDom.classList.add(alertClass);
        noticeSpanDom.classList.add(resultInfoItemClass);

        let spanTextNode = `Tryk på 'Gør det for mig'. Vil du prøve igen?`;
        let spanAlertIcon = document.createElement('span')
        spanAlertIcon.classList.add(materialIconsClass);
        let iconTextNode = document.createTextNode('warning')
        spanAlertIcon.append(iconTextNode);

        noticeSpanDom.append(spanAlertIcon);
        noticeSpanDom.append(spanTextNode);
        

        return noticeSpanDom;
    };

    function getTaskSuccessDom() {
        let noticeSpanDom = document.createElement('span');
        let spanDoneIcon = document.createElement('span')
        spanDoneIcon.classList.add(materialIconsClass);
        let iconTextNode = document.createTextNode('done')
        spanDoneIcon.append(iconTextNode);
        noticeSpanDom.append(spanDoneIcon);

        return noticeSpanDom
    }

    function getHeaderBtn(materialIconString, callback, config = {}) {
        let headerBtnLi = document.createElement('li');
        let tooltip = config.tooltip
        let btn = document.createElement('a');
        let btnSpan = document.createElement('span');
        let btnSpanTextNode = document.createTextNode(materialIconString);

        if (typeof tooltip == 'string') {
            btn.setAttribute('title', tooltip);
        }

        btnSpan.classList.add(materialIconsClass);
        btn.classList.add(headerToolBtnClass);
        btn.setAttribute('href', '#');
        headerBtnLi.classList.add(headerToolLiClass)

        btnSpan.appendChild(btnSpanTextNode);
        btn.appendChild(btnSpan);
        headerBtnLi.appendChild(btn)

        if (callback) {
            $(btn).on('click', callback)
        }

        return headerBtnLi;
    }

    // ... for intro & intro overlay
    function generateExerciseHeader(json) {
        if ($(exerciseHeaderTitleSelector)) {
            $(exerciseHeaderTitleSelector).append(json[exerciseTitleObjectSelector])
        }
    }
    
    function generateExerciseIntroOverlay(json) {
        if ($(exerciseTitleSelector)) {
            $(exerciseTitleSelector).append(json[exerciseTitleObjectSelector])
        }
        if ($(exerciseDescriptionSelector)) {
            $(exerciseDescriptionSelector).html(json[exerciseDescriptionObjectSelector])
        }
        let exerciseWithSubtitles = state.TaskObjectArray.filter(tObj => { return tObj.subtitles != "" })
        let exerciseWithAudioFile = state.TaskObjectArray.filter(tObj => { return tObj.audioFile != "" })
        let exerciseExampleAudioFile = json[exerciseAudiofileObjectSelector]

        if (exerciseExampleAudioFile.length > 0) {
            $(introOverlaySelector).find(introSoundNoticeCardSelector).removeClass(hiddenClass);
            let examplePlayBtn = $(introOverlaySelector).find('.settings-check__item.audio-check:first a');
            let exampleAudioFile = exerciseExampleAudioFile;
            let exampleAudioObject = new Audio(settings.assetsPath + exampleAudioFile);

            exampleAudioObject.addEventListener('ended', function () {
                examplePlayBtn.removeClass(buttonPlayingClass);
            })
            exampleAudioObject.addEventListener('play', function () {
                examplePlayBtn.addClass(buttonPlayingClass);
            })

            examplePlayBtn.on('click', function () {
                if (!state.isMuted) {
                    exampleAudioObject.play()
                }
            })
            $(introBeginSelector).on('click', function () { exampleAudioObject.pause(); })
        }
        if (exerciseWithSubtitles.length > 0) {
            $(introOverlaySelector).find(introSubtitleNoticeCardSelector).removeClass(hiddenClass);

        }
        
    }


    // debug DOM components
    function getDebugMsgInput(onClick, onInput) {
        let debugMsgContainer = document.createElement('div');
        let debugMsgInput = document.createElement('input');
        let debugMsgNoticeSpan = document.createElement('span');

        $(debugMsgContainer).attr('id', debugMsgId).addClass(debugToolClass);

        if (typeof onClick == 'function') {
            $(debugMsgInput).on('input', onInput);
        }
        if (typeof onInput == 'function') {
            $(debugMsgInput).on('click', onClick)

        }

        $(debugMsgContainer).append(debugMsgInput);
        $(debugMsgContainer).append(debugMsgNoticeSpan);

        return debugMsgContainer;
    };

    function getDebugTaskTimer(initTaskTime) {
        let taskTimerSpan = document.createElement('span');
        $(taskTimerSpan).addClass([debugToolClass, debugTaskTimerClass]);

        if (initTaskTime) {
            $(taskTimerSpan).text(initTaskTime);
        }

        return taskTimerSpan;
    };

    function getDebugTaskCount(initTaskCount = 1) {
        let taskCountSpan = document.createElement('span');
        $(taskCountSpan).addClass([debugToolClass, debugTaskCountClass])
        if (typeof initTaskCount == 'number') {
            $(taskCountSpan).text(`Opgave: ${initTaskCount}`);

        } else {
            $(taskCountSpan).text(`Opgave: ...`);
        }

        return taskCountSpan;
    };

    // ---- misc. helpers
    function roundNumber(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
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
    function getTaskInteractionPositionCssObject(taskInteractionDimensionsRect) {
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



    // _____________________________________________________
    this.GenerateExerciseMarkup = generateExerciseMarkup
    this.GenerateExerciseHeader = generateExerciseHeader;
    this.GenerateExerciseIntroOverlay = generateExerciseIntroOverlay
    this.GenerateExerciseResultMarkup = generateExerciseResultMarkup;
    this.GetDebugMsgInput = getDebugMsgInput;
    this.GetDebugTaskCount = getDebugTaskCount;
    this.GetDebugTaskTimer = getDebugTaskTimer;
    this.GetHeaderBtn = getHeaderBtn;

    return this;
}
ITEM.OverlayController = function (settings, state) {

    // NOT IN USE


    // Exercise.js contains a lot of methods for controlling anything related to overlays
    //      (fx. overlays for pause, settings, etc.)
    // At the moment these methods are current all within exercise.js.
    // We could move them into their own controller (here)



    //      WHY
    // It would be consistent to follow controller-fashion conventions and seperate them
    // into their own overlayController.js

    //      WHY NOT?
    // on the other hand, the methods for display/hiding overlays are very simple
    // and one-dimensional, and arguably does not require "segmentation".
    // For example in exercise.js, when a task is paused with pauseTask(),
    // showPauseOverlay() is called, a method consisting of two lines of code:
    // $(unfocusOverlaySelector).addClass(activeOverlayClass);
    // $('body').addClass(pauseExerciseClass);


    //      Moving overlay methods would require:
    // 1. Knowing the CSS class names that displays the individual overlay (copy-paste variable names)
    // 2. moving overlay functions into the overlay controller
    // 3. making the overlay functions global from the overlay contrller
    // 4. set up overlayController as an object in exercise.js
    // 5. calling the overlay functions as functions of the new overlayController object. 


    //      WHY DID I NOT DO THIS YET?
    // hehe

    


    return this;
}
// Lotte ved noget om denne

// FeedbackController creates a feedbackController object and manages the display of feedback.

// In Umbraco there are 2 types of feedback:
//      1) interaction feedback
//      2) task feedback
// these are handled seperately (showInteractionFeedback(...), showTaskFeedback(...)), but in practice they're the same type of (feedback)object.
// These feedbackObjects are created in Exercise.Js, then passed to the feedbackController for storage.
// FeedbackObjects are then set to render themselves as <feedback-component>'s with setupFeedbackComp().
// It is mainly the InputController's job to trigger showTaskFeedback and showInteractionFeedback (both, in turn, calling setupFeedbackComp())
//      - this way, it is a user-input that triggers feedback.

// Feedback can, however, also be triggered by the passage of time.
// In Exercise.js, startTask() & resumeTask() calls startTaskTimer() that calls showTaskFeedback() at every
//      time tick (1000ms). showTaskFeedback checks if the taskObject matches with any of the stored feedbackObjects in the _feedbackArray[].



ITEM.FeedbackController = function (wrapper, settings, selectorDictionary) {

    _logController = settings.logController;
    settings.showFeedback = true;

    const _feedbackArray = [];

    function addFeedbackToArray(feedbackItem) {
        _feedbackArray.push(feedbackItem);
    }
    function showTaskFeedback(taskId, displayType, args) {
        log("showTaskFeedback (feedbackController.js)", { taskId: taskId, displayType: displayType, args: args, settings: settings, feedbackArray: _feedbackArray });
        

        if (settings?.showFeedback) {
            const matchingFeedback = _feedbackArray.filter(item => {
                return item.ScopeId === taskId && item.Type === "task" && item.DisplayType === displayType && item.DisplayThreshold === args.msecsSinceTaskStart;
            });

            log("showTaskFeedback (feedbackController.js), matchingFeedback:", matchingFeedback);

            if (matchingFeedback.length == 1) {
                
                setupFeedbackComp(matchingFeedback[0], wrapper);
            } else if (matchingFeedback.length > 1) {
                log("Error: More than one instance of \"matchingFeedback\" was found when running showTaskfeedback()", matchingFeedback);
                setupFeedbackComp(matchingFeedback[0], wrapper);
            }
        }
    }

    function showInteractionFeedback(interactionId, displayType, args) {
        log("showInteractionFeedback (feedbackController.js)", { interactionId: interactionId, displayType: displayType, args: args });

        if (settings?.showFeedback) {
            let matchingFeedback = [];

            switch (displayType) {
                case 'attempts':
                    matchingFeedback = _feedbackArray.filter(item => {
                        return item.ScopeId === interactionId && item.Type === "interaction" && item.DisplayType === displayType && item.DisplayThreshold === args.interactionAttempts;
                    });
                    break;
                case 'correct':
                    matchingFeedback = _feedbackArray.filter(item => {
                        return item.ScopeId === interactionId && item.Type === "interaction" && item.DisplayType === displayType;
                    });
                    if (matchingFeedback.length == 0) {
                        if (args.callback) {
                            args.callback();
                        } else {
                            log("Warning (FeedbackController): There's no feedback to display nor any callbacks. Please check InputController", matchingFeedback);
                        }
                    } else if (args.callback) {
                        matchingFeedback[0].DismissCallback = args.callback;
                    } else {
                        log("Warning (FeedbackController): There aren't any callbacks. Please check InputController", matchingFeedback);
                    }
                    break;
                default:
                    break;
            }

            log("showInteractionFeedback matchingFeedback", matchingFeedback);
            if (matchingFeedback.length == 1) {
                log("showInteractionFeedback matchingFeedback.length == 1", matchingFeedback);
                setupFeedbackComp(matchingFeedback[0], wrapper);
            } else if (matchingFeedback.length > 1) {
                for (let mf = 0; mf < matchingFeedback.length; mf++) {
                    log("Error: More than one instance of \"matchingFeedback\" was found when running showTaskfeedback()", { matchingFeedback: matchingFeedback, feedbackIndex: mf });
                    setupFeedbackComp(matchingFeedback[mf], wrapper, args);
                }
            } else {
                log("showInteractionFeedback NO FEEDBACK FOUND!", displayType);
            }
        }
    }
    function setupFeedbackComp(feedbackItem, wrapper, args) {
        log('setupFeedbackComp() (start)', { showFeedback: settings.showFeedback, feedbackItem: feedbackItem, wrapper: wrapper });
        var feedbackComp = $(selectorDictionary.feedbackComponentSelector);

        feedbackComp = document.createElement(selectorDictionary.feedbackComponentSelector);
        
        $(wrapper).append(feedbackComp);

        $(feedbackComp).attr('id', feedbackItem.FeedbackId);
        $(feedbackComp).addClass([feedbackItem.Mood, feedbackItem.Size]);
        $(wrapper).addClass([feedbackItem.Mood, feedbackItem.Size]);

        // task object
        let tObj = { id: $(selectorDictionary.activeTaskSelector).attr('id') };
        // event object
        let eObj = {
            event: feedbackItem,
            timeStamp: Date.now(),
            task: $(selectorDictionary.activeTaskSelector),
            explainer: `Feedback show because ${feedbackItem.DisplayType} threshold of ${feedbackItem.DisplayThreshold} reached. (text: "${feedbackItem.Text}", dismissType: ${feedbackItem.DismissType}, mood: ${feedbackItem.Mood})`
        };

        _logController.HandleOutputLogEntry(tObj, eObj);

        if (feedbackItem?.InteractionHighlights?.length > 0) {
            log('setupFeedbackComp() (InteractionHighlights.length > 0)', { showFeedback: settings.showFeedback, feedbackItem: feedbackItem, wrapper: wrapper });

            for (var highlight of feedbackItem.InteractionHighlights) {
                let highlightSelector = `[data-interaction="${highlight}"]`;
                if ($(highlightSelector).is("input")) {
                    highlightSelector = $(highlightSelector).closest("div");
                }
                //$(highlightSelector).find(".interactions div span").addClass('highlight-area'); // TODO fix here, find correct interaction.
                $(highlightSelector).addClass('highlight-area'); // TODO fix here, find correct interaction.
                let tObj = { id: $('.task.active').attr('id') };
                let eObj = {
                    event: feedbackItem,
                    timeStamp: Date.now(),
                    task: $('.task.active'),
                    explainer: `Feedback HIGHLIGHT TEXT show because ${feedbackItem.DisplayType} threshold of ${feedbackItem.DisplayThreshold} reached. (text: "${feedbackItem.Text}", dismissType: ${feedbackItem.DismissType}, mood: ${feedbackItem.Mood})`
                };
                log("setupFeedbackComp() highlight -- ", { highlightSelector: highlightSelector, tObj: tObj, eObj: eObj });
                _logController.HandleOutputLogEntry(tObj, eObj);
            }
        }
        if (feedbackItem.Text && typeof feedbackItem.Text != 'undefined' && feedbackItem.Text.length > 0) {
            feedbackStringFormatter(feedbackItem.Text, $(feedbackComp));
        }
        if (feedbackItem.DismissType == "manual") {
            const btnWrapper = document.createElement('div');
            const dismissBtn = document.createElement('a');

            $(feedbackComp).append(btnWrapper);
            $(btnWrapper).addClass('btn-wrapper').append(dismissBtn);
            dismissBtn.classList.add('dismiss-feedback');
            dismissBtn.classList.add('button');
            dismissBtn.innerText = feedbackItem.DismissBtnText || 'Ok';
            $(dismissBtn).on('click', dismissHandler);


        } else {
            
            var timeout = feedbackItem.DismissTimeout || 8000;
            setTimeout(() => dismissHandler(feedbackItem), timeout);
        }

        if (feedbackItem.DoItForMe != undefined) {
            const doItForMeBtn = document.createElement('a');
            const btnWrapper = document.createElement('div');
            $(feedbackComp).append(btnWrapper);
            $(btnWrapper).addClass('btn-wrapper').append(doItForMeBtn);
            doItForMeBtn.classList.add('doItForMe');
            doItForMeBtn.classList.add('button');
            doItForMeBtn.innerText = 'Gør det for mig';
            console.log("lol setup do it for me", feedbackItem.DoItForMe)
            $(doItForMeBtn).on('click', () => {
                console.log("lol click the doitforme! lol!", feedbackItem)
                dismissHandler(feedbackItem);
                feedbackItem.DoItForMe();
                $(doItForMeBtn).remove();
                return false;
            });
        }

        function feedbackStringFormatter(string, $feedbackComponent) {
            // Check if the json feedback contains [] to indicate the expected key
            // Add it to the feedbackComp styled as a physical keyboard key
            // Otherwise display the plain string
            var markup = document.createElement('p');
            $feedbackComponent.append(markup);

            var stringChunk = string.split(/(\[[^\]].*?\])/g);
            for (var chunk of stringChunk) {
                var matchedKey = chunk.match(/(\[[^\]].*?\])/g);
                if (matchedKey) {
                    let keyWrapper = document.createElement('div');

                    keyWrapper.classList.add('data-key-wrapper');
                    markup.append(keyWrapper);
                    let key = matchedKey[0].replace(/[\[\]]/g, '');
                    let keyMarkup;
                    if (key.includes('+')) {
                        var splitKeys = key.split('+');
                        var keyMarkupArr = [];
                        for (var splitKey of splitKeys) {
                            keyMarkupArr.push(`<div class="data-key">${displayPrettyKey(splitKey)}</div>`);
                        }
                        keyMarkup = keyMarkupArr.join('+');
                        keyWrapper.innerHTML = keyMarkup;
                    } else {
                        keyMarkup = `<div class="data-key">${displayPrettyKey(key)}</div>`;
                        keyWrapper.innerHTML = keyMarkup;
                    }
                } else if (chunk != '') {
                    var stringWrapper = document.createElement('span');
                    markup.append(stringWrapper);
                    stringWrapper.innerHTML = chunk;
                }
            }

        }

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
            };
            const prettyMapKey = prettyMap[key] || key;
            return prettyMapKey;
        }
        function dismissHandler(feedbackItem) {
            console.log("lol dismisshandler", feedbackItem)

            $(this).parents('feedback-component').remove();
            $('.highlight-area').removeClass('highlight-area');

            //if (typeof feedbackItem != 'undefined' && feedbackItem.hasOwnProperty('originalEvent')) { // if event triggered, its a manual dismiss, we can access "this"
            //    $(this).parents('feedback-component').remove();
            //    $('.highlight-area').removeClass('highlight-area');
            //} else if (feedbackItem) { // auto dismiss - we cannot use "this" to remove feedback. Needs to use id.
            //    $(`#${feedbackItem.FeedbackId}`).remove();
            //}
            
            if (feedbackItem.DismissCallback) {
                feedbackItem.DismissCallback();
            }
            return false;
        }

    }
    function disableFeedback() {
        log("disableFeedback");
        $('feedback-component').addClass("hidden");
        settings.showFeedback = false;
    }
    function enableFeedback() {
        log("enableFeedback");
        $('feedback-component').removeClass("hidden");
        settings.showFeedback = true;
    }

    function clearAllFeedback() {
        $('feedback-component').remove();
    }

    function log(msg, obj) {
        if (settings.debugMode === true) {
            console.log(msg, obj);
        }
    }

    function handleRestartExercise() {
        log("handleRestartExercise (feedbackController)");
        clearAllFeedback();
    }


    this.FCHandleRestartExercise = handleRestartExercise;
    this.EnableFeedback = enableFeedback;
    this.DisableFeedback = disableFeedback;
    this.AddFeedbackToArray = addFeedbackToArray;
    this.ShowTaskFeedback = showTaskFeedback;
    this.ShowInteractionFeedback = showInteractionFeedback;

    return this;
};
ITEM.FeedbackController.FeedbackItem = function (text) {
    this.ScopeId;
    this.Type;
    this.DisplayType;
    this.DisplayThreshold;
    this.Text = text;
    this.InteractionHighlights = [];
    this.DismissType;
    this.DismissTimeout;
    this.DismissBtnText;
    this.DismissCallback;
    this.Mood;
    this.Size;
    this.DoItForMe;
    this.FeedbackId;

    function setId(id) {
        this.FeedbackId = id;
    }
    function setStyleType(mood, size) {
        this.Mood = mood;
        this.Size = size;
    }
    function setType(type, id) {
        this.Type = type;
        this.ScopeId = id;
    }
    function setDisplay(type, threshold) {
        this.DisplayType = type;
        this.DisplayThreshold = threshold;
    }
    function setInteractionHighlightAsArray(interactionId) {
        this.InteractionHighlights.push(interactionId);
    }
    function setInteractionHighlight(interactionIdArray) {
        this.InteractionHighlights.concat(interactionIdArray);
    }
    function setDismiss(type, timeout, btnText, doItForMe, callback) {
        this.DismissType = type;
        this.DismissTimeout = timeout;
        this.DismissBtnText = btnText;
        this.DoItForMe = doItForMe;
        this.DismissCallback = callback;
    }
    this.SetId = setId;
    this.SetStyleType = setStyleType;
    this.SetType = setType;
    this.SetDisplay = setDisplay;
    this.SetInteractionHighlightAsArray = setInteractionHighlightAsArray;
    this.SetInteractionHighlight = setInteractionHighlight;
    this.SetDismiss = setDismiss;
    

    return this;
};
// buckle up, buckaroo. this is a long one.

// InputController is responsible for checking the user input.
// Additionally - it also takes care of drawing "interaction-rectangles" in debug mode.

// Standard Use-Flow:
// 0. start exercise: declare inputController, with settings parameters deciding what inputs to handle
//      --> var _inputController = ITEM.InputController({ exerciseContainerSelector: exerciseSelector, dblClickDetect: true, mouseDownDetect: true, keyDownDetect: true, logController: _logController, debugMode: settings.debugMode, });
// 1: initialize inputController, with first task as parameter
//      --> _inputController.initInputController(firstTask)
// 2: init task from exercise (or otherwise fragmented process that bears seperated)
//      --> _inputController.InitTask(currentTaskObject)
// 3: continue initiating new tasks.
//      --> _inputController.InitTask(currentTaskObject)





// NOTICE ON "DISCRETE FEEDBACK"
// We can check for feedback to an action in two ways:
// 1) check for all feedback linked to an task and show it on action
// 2) check for feedback only linked to a certain kind of event ('click', 'keydown', etc.)
// - Basically: "is this feedback specific to this event-type?"
// - Why call it "discrete"? - seen as the opposite; "continious feedback" will cycle through (continue through!) all the interaction-objects contained in the task.
// - Continious feedback is enabled by default, and seen as the most obvious choice.
// - Discrete feedback might need more testing.
// - Example case where discrete feedback might make sense:
//      One user-command if often unfortunately pressed instead of a desired user-command.
//      (perhaps the user-command eventually does the same, but is bad practice?)
//      The course-planner could, with discrete feedback, take account for this,
//      and target feedback specifically for the undesired user-command.


// NOTICE ON INPUTTYPES & EVENTLISTENERS
// (click, dbl-click, right-click, mouseover, keydown, stringinput)
//      MOUSEOVER
//          mouseovers are initialised at every task start
//      STRINGINPUT
//          inputfields are initialised at every task start

// ~

// NOTICE ON ATTEMPTS
//  from an early stage onwards, the inputController was intended to account for "attempts".
//  While a single click is easily quantified as a single attempt, the quest to quantify an attempt for a stringinput proves more difficult.
//  The controller still slightly suffers from early "attempt-oriented" thinking,
//  and still has functions and considerations for such attempts as well as resetting the attempt count,
//  - however, these consideration does not break anything and I have left them in for now, partly because they also give nice debugging insights.
//      ATTEMPTS IN REGARDS TO checkMatchString()
//      an attempt could be counted by two methods:
//           a) when any key is pressed (fx. user inputs "h" then "e", "s", "t. - each of these user-inputs are counted as an attempt)
//           b) when a certain key is pressed (fx. user inputs "h" then "e", "s", "t", "e", then [DELETE], and finally [ENTER] - then, and only then, is an "attempt" counted.)
//      if a certain key is set as an assessmentKey we go by method (b), if not, any key is an attempt and we go by method (a)
//      

// NOTICE ON KEY-COMBINATIONS
//  (fx. [CTRL]+L , or [SHIFT]+[ENTER], etc.)
// I have categorised following as "flavor-keys": ["Control", "Shift", "Alt"].
// Their state (if they are pressed or not) is tracked and in

// NOTICE ON ASSESSMENTS
// ...




ITEM.InputController = function (settings) {

    _logController = settings.logController;

    //html
    const taskActiveSelector = ".task.active:first";
    const taskInteractionSelector = ".interactions";
    // json
    const taskFeedbackObjectListSelector = "taskFeedbackList";
    const taskInteractionIdObjectSelector = "id";
    const taskInteractionListObjectSelector = "interactionList"; // todo in C# model
    const taskInteractionAssessmentListObjectSelector = "assessmentList";
    const taskInteractionFeedbackListSelector = "interactionFeedbackList";
    const taskInteractionTypeObjectSelector = "type";
    const interactionTypeMouseOverString = "mouseover";
    const interactionTypeClick = "click";
    // assessments
    const taskInteractionAssessmentCorrectInputListObjectSelector = "correctInput";
    const taskInteractionAssessmentAttemptTriggerListObjectSelector = "attemptTrigger";
    const taskInteractionAssessmentCaseSensitiveObjectSelector = "caseSensitive";

    // debug
    const debugMsgContainerSelector = '#debug-msg';


    InputControllerState = {
        currentTask: null,
        interactionObjectArray: [],

        currentClickEvent: null,
        currentClickTarget: null,

        currentDblClickEvent: null,
        currentDblClickTarget: null,

        currentKeySequence: [],
        currentKey: null,

        currentStringInstance: typeof settings.initialString != 'undefined' ? settings.initialString : "",
        storedStringArray: settings.initialStoredStringArray ? settings.initialStoredStringArray : [],

        interactionCount: 0,
        taskAttemptInputfieldInputCount: 0,
        taskAttemptKeyCount: 0,
        taskAttemptDblclickCount: 0,
        taskAttemptClickCount: 0,
        taskAttemptRightClickCount: 0,

        taskEventLogArray: [],
        taskMouseDownLogArray: [],
        taskRightClickLogArray: [],
        taskDblClickLogArray: [],
        taskKeyDownLogArray: [],
        taskInputfieldArray: [],

        flavorKeys: ["Control", "Shift", "Alt"], // keys that come in combination with other keys, eg. Control + P, Shift + Enter, etc.

        isReportingRectangles: false,
        reportTarget: null,
        rectanglePointArray: [],
        rectangleObjectArray: []
    };

    function initInputController(firstTaskObject) {
        InputControllerState.currentTaskObject = firstTaskObject;
        debugLog("inputcontroller init", InputControllerState.currentTask);

        clearGlobalEventListeners();
        initGlobalEventListeners(InputControllerState.currentTask);
    };

    function initTask(taskObj) {
        InputControllerState.currentTask = $(settings.exerciseContainerSelector).find(taskActiveSelector);
        InputControllerState.currentTaskObject = taskObj;
        debugLog("initTask (inputcontroller)", { taskObj: taskObj, currentTask: InputControllerState.currentTask });

        initNewTaskInteraction(taskObj);
    }

    function initNewTaskInteraction() {
        clearTaskEventLog();
        clearState();
        clearAttempts();
        debugLog("initNewTaskInteraction (inputController)", InputControllerState);
        initInteractionArray();

        initTaskInputFields(InputControllerState.currentTask);//inputfields are initialised & prepared at each new task
        initMouseOver();// mouseover's are initialised at each new task

        stdLogEntry("Task Start.", "status");
    }

    function initTaskInputFields(task) {
        Array.from(task.find("input")).forEach(inputField => {
            let ifObj = {
                id: inputField.getAttribute("id"),
                value: inputField.value
            };
            InputControllerState.taskInputfieldArray.push(ifObj);
        })
        setTimeout(function () {
            task.find('input:first').trigger('focus');
        }, 100);
    }

    function initInteractionArray() {
        clearStringInstance();
        clearInteractionArray();

        if (typeof InputControllerState.currentTaskObject != 'undefined' && InputControllerState.currentTaskObject) {
            InputControllerState.currentTaskObject[taskInteractionListObjectSelector].forEach(iObj => {
                InputControllerState.interactionObjectArray.push(iObj);
            });
        }
    }

    function mouseClickHandler(event) {
        InputControllerState.currentClickEvent = event;
        InputControllerState.currentClickTarget = event.target;

        debugLog("mouseClickHandler", event);
        storeMouseDown(event);

        if (!InputControllerState.isReportingRectangles) {
            checkMouseInteraction(event);
        } else {
            recordRectanglePoint(event);
        }
    }

    function rightClickHandler(event) {
        InputControllerState.currentRightClickEvent = event;
        InputControllerState.currentRightClickEvent = event.target;

        storeRightClick(event);
        checkMouseInteraction(event);
    }

    function dblClickHandler(event) {
        InputControllerState.currentDblClickEvent = event;
        InputControllerState.currentDblClickTarget = event.target;

        storeDblClick(event);
        checkMouseInteraction(event);
    }

    function keyUpHandler(event) {
        // handles flow on user keyup -  whether it is for a key-combination or stringinput. 
        event.preventDefault();
        event.stopPropagation();

        debugLog("keyUpHandler (START):", { exerciseHasFocus: $("#assetContentWrapper").is(":focus").toString(), event: event });
        inputHandler(event);

        storeKeyDown(event);
        checkKeyboardInteraction(event);
    }

    function debugLog(msg, obj) {
        if (settings.debugMode) {
            console.log(msg, obj);
        }
    }

    function inputfieldHandler(event) { //...
        InputControllerState.taskInputfieldArray.forEach(inputfieldObj => {
            if (inputfieldObj.id == event.target.getAttribute("id")) {
                inputfieldObj.value = $(event.target).val();
            }
        });

        if (event.target.nodeName == "INPUT") {
        }
    }

    function inputHandler(inputEvent) {
        // keeps track of current key downs
        InputControllerState.shiftKey = inputEvent.shiftKey;
        InputControllerState.ctrlKey = inputEvent.ctrlKey;
        InputControllerState.altKey = inputEvent.altKey;
        InputControllerState.currentKey = inputEvent.key;

        if (inputEvent.key.length < 2) { // if normal key down
            let newStringInstance = InputControllerState.currentStringInstance + inputEvent.key;
            InputControllerState.currentStringInstance = newStringInstance;
        } else if (inputEvent.key.length > 1) { // if flavor-key down (ctrl, alt, etc..)
            let newStringInstance = InputControllerState.currentStringInstance + "*";
            InputControllerState.currentStringInstance = newStringInstance;
        }
    }
    function initMouseOver(task) {
        let mouseoverInteractionObjectsArray = null;
        if (typeof InputControllerState?.currentTaskObject != 'undefined' && InputControllerState?.currentTaskObject) {
            mouseoverInteractionObjectsArray = InputControllerState.currentTaskObject[taskInteractionListObjectSelector]?.filter(iObj => iObj[taskInteractionTypeObjectSelector] == interactionTypeMouseOverString);
        } // we get all the interaction objects (iObj) that are mouseover interaction types

        debugLog("initMouseOver", { task: task, currentTask: InputControllerState.currentTaskObject, state: InputControllerState, mouseoverObjects: mouseoverInteractionObjectsArray });

        // run through the mouseover interaction objects found above. 
        mouseoverInteractionObjectsArray?.forEach(iObj => {
            debugLog("initMouseOver iObj", iObj);

            let $currentTask = $(`#${InputControllerState.currentTaskObject[taskInteractionIdObjectSelector]}`);
            let interactionId = iObj[taskInteractionIdObjectSelector];
            let interactionFeedbackList = iObj[taskInteractionFeedbackListSelector];

            let interactionTarget = $currentTask.find(`[data-interaction='${interactionId}']`);
            let attemptCount = 1; // how to count attempts when hover? hardcoded as 1.

            interactionTarget.on("mouseover", function mouseoverHandler (e) {
                if (interactionTarget.hasClass("mouseover")) {
                    let eObj = {
                        event: e,
                        timeStamp: Date.now(),
                        explainer: `Brugeren bevægede musen over et element: ${interactionTarget.prop("nodeName")}`,
                        taskObject: InputControllerState.currentTaskObject,
                        task: InputControllerState.currentTask,
                        type: "mouseover"
                    }
                    debugLog('Mouseover event', eObj);

                    _logController.HandleInputLogEntry(InputControllerState.currentTaskObject, eObj);
                    stdLogEntry("Task Complete.", "status", attemptCount);

                    if (typeof interactionFeedbackList != 'undefined' && interactionFeedbackList.length > 0) {
                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                            if (typeof feedback != 'undefined' && feedback) {

                                feedback(interactionId, "correct", {
                                    interactionAttempts: attemptCount,
                                    callback: InputControllerState.currentTaskObject.callback
                                });
                            }
                        });
                    } else {
                        InputControllerState.currentTaskObject?.callback();
                    }
                }
            });
        });
    }

    function clearInteractionArray() {
        InputControllerState.interactionObjectArray = [];
    };
    function clearStringInstance() {
        InputControllerState.currentStringInstance = "";
    };

    function checkInteractionFeedback(event) {
        InputControllerState.interactionCount++;

        // See notice on discrete feedback.
        if (!settings.discreteFeedback) {
            // cycle through all interactions on task since we want to check all task feedbacks
            for (let i = 0; i < InputControllerState.currentTaskObject[taskInteractionListObjectSelector].length; i++) {
                let iObj = InputControllerState.currentTaskObject[taskInteractionListObjectSelector][i];
                let interactionType = iObj[taskInteractionTypeObjectSelector];
                let interactionId = iObj.id;

                debugLog("discreteFeedback", { event: event, iObj: iObj, interactionCount: InputControllerState.interactionCount });
                // theoretically, this did not need to be handled in an switch-case, but I like that i opens up customization of feedback and handling stuff differently.
                switch (interactionType) {
                    case "click":
                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                            debugLog("checkInteractionFeedback, feedback", feedback);
                            if (typeof feedback != 'undefined' && feedback) {
                                feedback(interactionId, "attempts", { interactionAttempts: InputControllerState.interactionCount, iObj: iObj });
                            }
                        });
                        break;
                    case "dblclick":
                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                            debugLog("checkInteractionFeedback, feedback", feedback);
                            if (typeof feedback != 'undefined' && feedback) {
                                feedback(interactionId, "attempts", { interactionAttempts: InputControllerState.interactionCount });
                            }
                        });
                        break;
                    case "rightclick":
                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                            debugLog("checkInteractionFeedback, feedback", feedback);
                            if (typeof feedback != 'undefined' && feedback) {
                                feedback(interactionId, "attempts", { interactionAttempts: InputControllerState.interactionCount })

                            }
                        })
                        break;
                    case "keydown":
                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                            debugLog("checkInteractionFeedback, feedback", feedback);
                            if (typeof feedback != 'undefined' && feedback) {
                                feedback(interactionId, "attempts", { interactionAttempts: InputControllerState.interactionCount, iObj: iObj });

                            }
                        })
                        break;
                    case "stringinput":
                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                            debugLog("checkInteractionFeedback, feedback", feedback)
                            if (typeof feedback != 'undefined') {
                                feedback(interactionId, "attempts", { interactionAttempts: InputControllerState.interactionCount })

                            }
                        })
                        break;
                    default:
                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                            debugLog("checkInteractionFeedback, feedback", feedback)
                            if (typeof feedback != 'undefined') {
                                feedback(interactionId, "attempts", { interactionAttempts: InputControllerState.interactionCount })
                            }
                        })
                        break;
                }
            }
        }
    }

    function checkMouseInteraction(event) {
        debugLog("checkMouseInteraction (start)", event);

        // multiple pre-checks to see if we should check for match and react to the click. Partly because we want to ensure that a click on a feedback-box triggers anything.
        if (typeof InputControllerState.currentTaskObject != 'undefined' && InputControllerState.currentTaskObject
            && InputControllerState.currentTask != null
            && InputControllerState.currentTask.hasClass("active")
            && $(event.target).parents('.feedback-wrapper').length == 0) {
            for (let i = 0; i < InputControllerState.currentTaskObject[taskInteractionListObjectSelector].length; i++) {
                let iObj = InputControllerState.currentTaskObject[taskInteractionListObjectSelector][i];
                let interactionType = iObj[taskInteractionTypeObjectSelector];

                switch (interactionType) {
                    case 'click':
                        event.which == 1 ? checkMatchClick(event, iObj) : false;
                        break;

                    case 'dblclick':
                        event.type == "dblclick" ? checkMatchDblClick(event, iObj) : false;
                        break;

                    case 'rightclick':
                        event.which == 3 ? checkMatchRightClick(event, iObj) : false;
                        break;
                    default:
                        break;
                }
            }

            checkInteractionFeedback(event);
        }
    }

    function checkKeyboardInteraction(event) {
        debugLog("checkKeyboardInteraction (event):", event)
        let currentTaskObject = InputControllerState?.currentTaskObject;
        let currentTask = InputControllerState.currentTask;
        if (typeof currentTaskObject != 'undefined' && currentTask != null && currentTask.hasClass("active")) {
            for (let i = 0; i < InputControllerState.currentTaskObject[taskInteractionListObjectSelector].length; i++) {
                let iObj = InputControllerState.currentTaskObject[taskInteractionListObjectSelector][i]
                let interactionType = iObj[taskInteractionTypeObjectSelector]
                debugLog("checkKeyboardInteraction (foreach iObj)", { iObj: iObj, interactionType: iObj.type, InputControllerStatecurrentTaskObject: InputControllerState.currentTaskObject })
                switch (interactionType) {

                    case 'keydown':
                        if (event.type != "mousedown" && $(event.target).is(":not(input)")) {
                            debugLog("checkKeyboardInteraction (interactionType:)", interactionType)
                            checkMatchKeyPress(event, iObj)
                        }
                        break;
                    case 'stringinput':
                        if (event.type != "mousedown" && $(event.target).is("input")) {
                            checkMatchString(event, iObj)
                        }
                        break;
                }
            }
            checkInteractionFeedback(event);
        }
    }
    function checkStringCombinationArray(stringsArray, arrays) {
        // helper fn to check if an array of strings has a match in an array of array of strings.
        // helpful when we want to see if the userinput (stringArray) matches the interactionAssessment attemptTrigger array (arrays) which is turned into an array of arrays.
        // see function checkMatchKeyPress() and function checkMatchString() for examples
        
        // Loop through each array in the arrays parameter
        for (let array of arrays) {
            let stringMatchcount = 0;
            // Loop through each string in the strings parameter
            for (let string of stringsArray) {
                // Check if the current string is in the current array
                if (array.includes(string)) {
                    stringMatchcount++;
                    if (stringMatchcount == array.length) {
                        return true;
                    }
                    // If the string is in the array, return true
                }
            }
        }
        // If no combination of the strings was found in any of the arrays, return false
        return false;
    }

    function getEventKeyCombination(event) {
        // returns an array of strings that is the combination of userinputs
        // fx. ["Delete"] or ["Enter", "Alt"] etc.

        let eventKeyArray = [];
        eventKeyArray.push(event.key)
        InputControllerState.flavorKeys.forEach(flavorKey => {
            switch (flavorKey) {
                case "Control":
                    if (event.ctrlKey) {
                        eventKeyArray.push(flavorKey)
                    }
                    break;

                case "Alt":
                    if (event.altKey) {
                        eventKeyArray.push(flavorKey)
                    }
                    break;
                case "Shift":
                    if (event.shiftKey) {
                        eventKeyArray.push(flavorKey)
                    }
                    break;
                default:
                    break;
            }
        })
        return eventKeyArray;
    }

    function checkMatchKeyPress(event, iObj) {
        if (typeof InputControllerState.currentTaskObject != 'undefined') {
            InputControllerState.taskAttemptKeyCount++;
            let interactionAssessmentList = iObj[taskInteractionAssessmentListObjectSelector];
            let interactionFeedbackList = InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector];

            let interactionId = iObj.id;

            if (typeof interactionAssessmentList != 'undefined' && interactionAssessmentList.length > 0) {
                for (let a = 0; a < interactionAssessmentList.length; a++) {
                    let asm = interactionAssessmentList[a];
                    let assessmentCorrectInputList = asm.correctInput;

                    debugLog(`checkMatchKeyPress (assessment loop: #${a})`, { iObj: iObj, assessment: asm })

                    if (typeof assessmentCorrectInputList != 'undefined' && assessmentCorrectInputList) {
                        let attemptCount = InputControllerState.taskAttemptKeyCount;
                        let eventKeyArray = [];
                        let correctKeyArray = [];
                        eventKeyArray = getEventKeyCombination(event);
                        assessmentCorrectInputList.forEach(correctInput => correctKeyArray.push(correctInput.split('+')));
                        // check if event intersects with the list of correct keys
                        let inputCheck = checkStringCombinationArray(eventKeyArray, correctKeyArray);
                        

                        // Order of keypresses doesnt matter, so we only need to check length.
                        if (inputCheck) {
                            debugLog("checkMatchKeyPress [CORRECT]", InputControllerState.currentTaskObject);
                            stdLogEntry("Task Complete.", "status", attemptCount);

                            if (typeof interactionFeedbackList != 'undefined' && interactionFeedbackList.length > 0) {
                                // if we have feedback to show, loop through feedback and show it.
                                debugLog("checkMatchKeyPress [CORRECT, HAS FEEDBACK]:", interactionFeedbackList)
                                interactionFeedbackList.forEach(feedback => {
                                    debugLog("checkMatchKeyPress [CORRECT, LOOPING FEEDBACK]:", feedback);
                                    if (typeof feedback != 'undefined') {

                                        feedback(interactionId, "correct", { interactionAttempts: attemptCount, callback: InputControllerState.currentTaskObject.callback })
                                    }
                                });
                            } else {
                                // if we have NO feedback to show, proceed. 
                                debugLog("checkMatchKeyPress [CORRECT, NO FEEDBACK]", iObj)
                                InputControllerState.currentTaskObject?.callback();
                            }
                        } else {
                            // if userinput does not pass the check, the answer is wrong. 
                            if (settings.discreteFeedback) {
                                debugLog("checkMatchKeyPress [WRONG]", InputControllerState.currentTaskObject[taskFeedbackObjectListSelector])
                                InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                                    debugLog("checkMatchKeyPress [WRONG], feedback", feedback)
                                    if (typeof feedback != 'undefined') {
                                        feedback(interactionId, "attempts", { interactionAttempts: attemptCount })
                                    }
                                })
                            }
                        }
                    } else {
                        // if no correct is specified, all keys must be correct! -> proceed to callback.
                        debugLog("CheckMatchKeyPress ERROR: (assessment correctKey not specified!)", asm)
                        InputControllerState.currentTaskObject.callback()
                    }
                }
            }
        } else {
            debugLog("Error (Input Controller): No task object found.", event)
        }

    }
    function checkMatchString(event, iObj) {
        // run on ALL input events
        // we assume all strings are found in <inputfield> tags (and not <textarea> etc.)
        let inputField = $(event.target);
        let targetMatchId = inputField.attr('data-interaction');
        let interactionId = iObj[taskInteractionIdObjectSelector];
        let interactionAssessmentList = iObj[taskInteractionAssessmentListObjectSelector];
        let interactionFeedbackList = iObj[taskInteractionFeedbackListSelector];

        debugLog("checkMatchString() ", { iObj: iObj })

        // check if we have the right inputfield, the one specified in the iObj.
        if (targetMatchId == interactionId) {
            if (typeof interactionAssessmentList != 'undefined' && interactionAssessmentList && interactionAssessmentList.length > 0) {

                for (let a = 0; a < interactionAssessmentList.length; a++) {
                    let asm = iObj[taskInteractionAssessmentListObjectSelector][a];
                    let assessmentCorrectInputList = asm[taskInteractionAssessmentCorrectInputListObjectSelector];
                    let assessmentAttemptTriggerList = asm[taskInteractionAssessmentAttemptTriggerListObjectSelector];
                    let assessmentCaseSensitive = asm[taskInteractionAssessmentCaseSensitiveObjectSelector];

                    // if no 'attemptTrigger', every keydown is an "attempt"
                    // read NOTICE ON ATTEMTPTS
                    if (assessmentCorrectInputList.length > 0 && (typeof assessmentAttemptTriggerList == 'undefined' || assessmentAttemptTriggerList.length == 0)) {
                        debugLog("checkMatchString (no attemptTrigger)")
                        let attemptCount = InputControllerState.currentStringInstance.length;

                        // run through all possible answer possibilities (for example, if a word has multiple ways of spelling)
                        let correctInput = assessmentCorrectInputList.find(correctString => {
                            return correctString == inputField.val();
                        });

                        // as no threshold for what is regarded an attempt, we assume longest string length = an attempt.
                        let longestString = assessmentCorrectInputList.reduce(function (a, b) { return a.length > b.length ? a : b; }); // fn finds longest string in array.

                        if (correctInput) {
                            stdLogEntry("Task Complete.", "status", attemptCount);
                            if (typeof interactionFeedbackList != 'undefined' && interactionFeedbackList.length > 0) {
                                InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                                    if (typeof feedback != 'undefined') {
                                        feedback(interactionId, "correct", {
                                            interactionAttempts: attemptCount,
                                            callback: InputControllerState.currentTaskObject.callback
                                        })
                                    }

                                })
                            } else {
                                InputControllerState.currentTaskObject.callback();
                            }

                        } else if (attemptCount > longestString.length) {
                            InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                                if (typeof feedback != 'undefined') {
                                    feedback(interactionId, "attempts", { interactionAttempts: attemptCount })
                                }
                            })
                        }

                        // if attemptTrigger defined
                    } else if (assessmentCorrectInputList.length > 0 && (typeof assessmentAttemptTriggerList != 'undefined')) {
                        // we check all possible event-triggers
                        for (let t = 0; t < assessmentAttemptTriggerList.length; t++) {
                            let trigger = assessmentAttemptTriggerList[t];
                            // if specific button-press is considered an "attempt", eg. [enter]
                            // we MAY NOT assume the user is at the correct inputfield.
                            // we MAY assume the user is at an inputfield.
                            if (typeof trigger == 'string') {
                                let correctKeyArray = []
                                correctKeyArray.push(trigger.split('+')); // split into arrays to fit standard function format.
                                let eventKeyArray = getEventKeyCombination(event)

                                let match = checkStringCombinationArray(eventKeyArray, correctKeyArray)
                                if (match) {
                                    InputControllerState.taskAttemptInputfieldInputCount++;
                                    let attemptCount = InputControllerState.taskAttemptInputfieldInputCount;

                                    if (targetMatchId == interactionId) {
                                        let correctInput = false;
                                        if (assessmentCaseSensitive) {
                                            correctInput = assessmentCorrectInputList.find(correctString => { return correctString == inputField.val() });
                                        } else {
                                            correctInput = assessmentCorrectInputList.find(correctString => { return correctString.toLowerCase() == inputField.val().toLowerCase() });

                                        }

                                        if (correctInput) { // correct ...
                                            stdLogEntry("Task Complete.", "status", attemptCount);
                                            debugLog("checkMatchString (correctInput)", iObj)
                                            if (typeof interactionFeedbackList != 'undefined' && interactionFeedbackList.length > 0) {
                                                InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                                                    if (typeof feedback != 'undefined') {
                                                        feedback(interactionId, "correct", {
                                                            interactionAttempts: attemptCount,
                                                            callback: InputControllerState.currentTaskObject.callback
                                                        })
                                                    }

                                                })
                                            }
                                            else {
                                                InputControllerState.currentTaskObject.callback();
                                            }

                                        }
                                        else { // wrong
                                            debugLog("checkMatchString (wrong Input)", iObj)

                                            if (settings.discreteFeedback) {
                                                InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                                                    if (typeof feedback != 'undefined') {
                                                        feedback(interactionId, "attempts", { interactionAttempts: attemptCount })

                                                    }
                                                })
                                            }
                                        }
                                    }
                                }

                            } else if (typeof trigger == 'number') {
                                // If number of key-downs equals an attempt. ie. you pressed 10 keys = 1 attempt.

                                // we filter to make sure text was input into an inputfield (even though its the wrong inputfield)
                                let attemptsArray = InputControllerState.taskKeyDownLogArray.filter(keydownLog => keydownLog.event.target.nodeName == "INPUT");
                                InputControllerState.taskAttemptInputfieldInputCount++;

                                let attemptCount = InputControllerState.taskAttemptInputfieldInputCount;

                                // we check if the correct answer is found
                                let correctInput = asm.correctInput.find(correctString => { return correctString == inputField.val() });

                                if (correctInput) {
                                    stdLogEntry( "Task Complete.", "status", attemptCount);
                                    if (typeof interactionFeedbackList != 'undefined' && interactionFeedbackList.length > 0) {
                                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                                            if (typeof feedback != 'undefined') {
                                                feedback(interactionId, "correct", {
                                                    interactionAttempts: attemptCount,
                                                    callback: InputControllerState.currentTaskObject.callback
                                                })
                                            }
                                        })
                                    }
                                    else {
                                        InputControllerState.currentTaskObject.callback();
                                    }

                                } else {
                                    if (settings.discreteFeedback) {
                                        InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                                            if (typeof feedback != 'undefined') {
                                                feedback(interactionId, "attempts", { interactionAttempts: attemptCount })

                                            }
                                        })
                                    }
                                }
                            }
                        }
                    }
                }

            } else {
                // 

            }
        }
    }

    function checkMatchClick(event, iObj) {
        let target = event.target;
        let targetId = target.getAttribute('data-interaction');

        let interactionId = iObj[taskInteractionIdObjectSelector];
        let interactionFeedbackList = iObj[taskInteractionFeedbackListSelector];

        if (typeof InputControllerState.currentTaskObject != 'undefined') {
            InputControllerState.taskAttemptClickCount++;
            let attemptCount = InputControllerState.taskAttemptClickCount;
            debugLog("checkMatchClick (start)", { event: event, attempts: attemptCount, target: target })

            // User click correct
            if (event.type == 'mousedown' && typeof targetId != 'undefined' && targetId && interactionId == targetId && $(target).hasClass("click")) {
                stdLogEntry("Task Complete.", "status", attemptCount);
                if (typeof interactionFeedbackList != 'undefined' && interactionFeedbackList.length > 0) {
                    // If, for some reason, correct click should give a feedback (cant do this yet) - same for other interaction types.
                    InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                        if (typeof feedback != 'undefined') {
                            feedback(interactionId, "correct", { interactionAttempts: attemptCount, callback: InputControllerState.currentTaskObject.callback })
                        }
                    })
                } else {
                    InputControllerState.currentTaskObject.callback();
                }


                // user click wrong
            } else {
                if (settings.discreteFeedback) { // see notice on discr ete feedback
                    debugLog("checkMatchClick (WRONG)", { event: event, attempts: attemptCount, interactionFeedback: InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector] })
                    InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                        if (typeof feedback != 'undefined') {
                            feedback(interactionId, "attempts", { interactionAttempts: attemptCount })
                        }
                    });
                }
                // else: feedback was handled prior to this point in the flow. Do nothing.
            }
        } else {
            debugLog("Error (Input Controller): No task object found.", { event: event, iObj: iObj })
        }

    }

    function checkMatchRightClick(event, iObj) {
        let target = event.target;
        let targetId = target.getAttribute('data-interaction');
        let interactionId = iObj[taskInteractionIdObjectSelector];
        let interactionFeedbackList = iObj[taskInteractionFeedbackListSelector];

        if (typeof InputControllerState.currentTaskObject != 'undefined') {
            InputControllerState.taskAttemptRightClickCount++;
            let attemptCount = InputControllerState.taskAttemptRightClickCount;
            if (event.which == 3 && typeof targetId != 'undefined' && interactionId == targetId && $(target).hasClass("rightclick")) {

                stdLogEntry("Task Complete.", "status", attemptCount);

                if (typeof interactionFeedbackList != 'undefined' && interactionFeedbackList.length > 0) {
                    InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                        if (typeof feedback != 'undefined') {

                            feedback(interactionId, "correct", {
                                interactionAttempts: attemptCount,
                                callback: InputControllerState.currentTaskObject.callback
                            })
                        }
                    });
                } else {
                    InputControllerState.currentTaskObject.callback();

                }
            } else {
                if (settings.discreteFeedback) {
                    debugLog("checkMatchRightClick (WRONG) feedback", InputControllerState.currentTaskObject);
                    InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                        if (typeof feedback != 'undefined') {
                            feedback(interactionId, "attempts", { interactionAttempts: attemptCount })
                        }
                    })
                }
            }

        } else {
            debugLog("Error (Input Controller): No task object found.", { event: event, iObj: iObj });
        }
    }

    function checkMatchDblClick(event, iObj) {
        let target = event.target
        let targetId = target.getAttribute('data-interaction');
        let interactionId = iObj[taskInteractionIdObjectSelector];
        let interactionFeedbackList = iObj[taskInteractionFeedbackListSelector];

        if (typeof InputControllerState.currentTaskObject != 'undefined') {
            InputControllerState.taskAttemptDblclickCount++;
            InputControllerState.taskAttemptClickCount--;
            InputControllerState.taskAttemptClickCount--;
            let attemptCount = InputControllerState.taskAttemptDblclickCount;

            if (event.type == 'dblclick' && typeof targetId != 'undefined' && interactionId == targetId && $(target).hasClass("dblclick")) {
                stdLogEntry("Task Complete.", "status", attemptCount);
                debugLog("dblClick correct!", { interactionId: interactionId, targetId: targetId })

                if (typeof interactionFeedbackList != 'undefined' && interactionFeedbackList.length > 0) {
                    debugLog("dblClick (running through interactionFeedbackList", InputControllerState.currentTaskObject)
                    InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                        debugLog("dblClick feedback (correct)", feedback)
                        if (typeof feedback != 'undefined') {

                            feedback(interactionId, "correct", {
                                interactionAttempts: attemptCount,
                                callback: InputControllerState.currentTaskObject.callback
                            })
                        }
                    });
                } else {
                    InputControllerState.currentTaskObject?.callback();
                }

            } else {
                if (settings.discreteFeedback) {
                    debugLog("checkMatchDblClick (WRONG) feedback", InputControllerState.currentTaskObject);
                    InputControllerState.currentTaskObject[taskInteractionFeedbackListSelector].forEach(feedback => {
                        if (typeof feedback != 'undefined') {
                            feedback(interactionId, "attempts", { interactionAttempts: attemptCount })
                        }
                    })
                }
            }

        } else {
            debugLog("Error (Input Controller): No task object found.", { event: event, iObj: iObj })
        }
    }

    function storeMouseDown(e) {
        let $container = $(taskActiveSelector)
        let mouseClickCoordObject = getMouseClickCoordinatesObject(e, $container);
        let relEventX = mouseClickCoordObject.relX;
        let relEventY = mouseClickCoordObject.relY;
        let relEventXpc = mouseClickCoordObject.relXpercent;
        let relEventYpc = mouseClickCoordObject.relYpercent;

        let eventObj = {
            timeStamp: Date.now(),
            event: e,
            taskObject: InputControllerState.currentTaskObject,
            task: InputControllerState.currentTask,
            explainer: `Brugeren klikkede på en < ${e.target.nodeName} > med klassen '${e.target.getAttribute("class")}' og ID '${e.target.getAttribute("id")}'. Pixel-Koordinater: ( ${relEventX} ; ${relEventY} ). Procent-Koordinater: ( ${relEventXpc}% ; ${relEventYpc}% ) `,
            relativeX: relEventX,
            relativeY: relEventY,
            relativeXpc: relEventXpc,
            relEventYpc: relEventYpc,
            type: "click"
        };
        InputControllerState.taskEventLogArray.push(eventObj)
        InputControllerState.taskMouseDownLogArray.push(eventObj)

        _logController.HandleInputLogEntry(InputControllerState.currentTaskObject, eventObj)
    }

    function storeRightClick(e) {
        let $container = $(taskActiveSelector)
        let mouseClickCoordObject = getMouseClickCoordinatesObject(e, $container);
        let relEventX = mouseClickCoordObject.relX;
        let relEventY = mouseClickCoordObject.relY;
        let relEventXpc = mouseClickCoordObject.relXpercent;
        let relEventYpc = mouseClickCoordObject.relYpercent;

        let eventObj = {
            timeStamp: Date.now(),
            event: e,
            taskObject: InputControllerState.currentTaskObject,
            task: InputControllerState.currentTask,
            explainer: `Brugeren HØJRE-klikkede på en < ${e.target.nodeName} > med klassen '${e.target.getAttribute("class")}' og ID '${e.target.getAttribute("id")}'. Pixel-Koordinater: ( ${relEventX} ; ${relEventY} ). Procent-Koordinater: ( ${relEventXpc}% ; ${relEventYpc}% ) `,
            relativeX: relEventX,
            relativeY: relEventY,
            relativeXpc: relEventXpc,
            relEventYpc: relEventYpc,
            type: "contextmenu"
        };

        InputControllerState.taskEventLogArray.push(eventObj);
        InputControllerState.taskRightClickLogArray.push(eventObj)


        _logController.HandleInputLogEntry(InputControllerState.currentTaskObject, eventObj)
    }

    function storeDblClick(e) {
        let $container = $(taskActiveSelector)
        let mouseClickCoordObject = getMouseClickCoordinatesObject(e, $container);
        let relEventX = mouseClickCoordObject.relX;
        let relEventY = mouseClickCoordObject.relY;
        let relEventXpc = mouseClickCoordObject.relXpercent;
        let relEventYpc = mouseClickCoordObject.relYpercent;

        let eventObj = {
            timeStamp: Date.now(),
            event: e,
            taskObject: InputControllerState.currentTaskObject,
            task: InputControllerState.currentTask,
            explainer: `Brugeren DOBBELT-klikkede på en < ${e.target.nodeName} > med klassen '${e.target.getAttribute("class")}' og ID '${e.target.getAttribute("id")}'. Pixel-Koordinater: ( ${relEventX} ; ${relEventY} ). Procent-Koordinater: ( ${relEventXpc}% ; ${relEventYpc}% ) `,
            relativeX: relEventX,
            relativeY: relEventY,
            relativeXpc: relEventXpc,
            relEventYpc: relEventYpc,
            type: "dblclick"
        };

        InputControllerState.taskEventLogArray.push(eventObj)
        InputControllerState.taskDblClickLogArray.push(eventObj)


        _logController.HandleInputLogEntry(InputControllerState.currentTaskObject, eventObj)
    }

    function storeKeyDown(e) {

        // refresh state's inputfield-array so input fields are stored as they appear
        let inputArray = []
        InputControllerState.taskInputfieldArray.forEach(ifObj => {
            let newIfObj = {}
            for (let p in ifObj) newIfObj[p] = ifObj[p]
            inputArray.push(newIfObj)
        });


        let eventObj = {
            timeStamp: Date.now(),
            event: e,
            task: InputControllerState.currentTask,
            taskObject: InputControllerState.currentTaskObject,
            InputFields: inputArray,
            currentString: InputControllerState.currentStringInstance,
            currentKey: e.key,
            explainer: `Brugeren trykkede på tasten [${e.key}] ${e.altKey ? "+ [ALT]" : ""} ${e.shiftKey ? "+[SHIFT]" : ""} ${e.ctrlKey ? "+[CTRL]" : ""}`,
            type: 'key'
        };

        InputControllerState.taskKeyDownLogArray.push(eventObj);
        InputControllerState.taskEventLogArray.push(eventObj);

        _logController.HandleInputLogEntry(InputControllerState.currentTaskObject, eventObj);

    }

    function getMouseClickCoordinatesObject(event, $targetContainer) {
        let target;

        if ($targetContainer === void 0 || !$targetContainer) {
            target = event.target
        } else {
            target = $targetContainer.get(0)
        }

        if (target && event) {
            const bcRect = target.getBoundingClientRect();
            const x = event.clientX - bcRect.left;
            const y = event.clientY - bcRect.top;
            const xPercent = (x / bcRect.width) * 100;
            const yPercent = (y / bcRect.height) * 100;

            const clickCoordinatesObj = { relX: x, relY: y, relXpercent: xPercent, relYpercent: yPercent };


            return clickCoordinatesObj;
        }
        else {
            return false;
        }

    }

    function taskCompleteLogEntry(string, eventType, attemptCount) {
        // log entry specific for when task complete.
        // designated function to distinguish and record "attempts".
        // NOT IN USE YET. CURRENTLY, stdLogEntry() is receiving attempts as well.

        let eventObj = {
            event: "Task Complete.",
            timeStamp: Date.now(),
            explainer: "User completed task.",
            taskObject: InputControllerState.currentTaskObject,
            type: eventType,
            attemptCount: attemptCount,
            comment: string
        }

        InputControllerState.taskEventLogArray.push(eventObj);
        _logController.HandleSecretLogEntry(InputControllerState.currentTaskObject, eventObj)

        // -  attempts are tricky: while mouseclicks are an obvious attempt, input string pose a different challenge:
        // The string "hest" requires 4 key-downs, plus a potential [Enter] confirmation key, totalling 5 key-downs. If a confirmation key
        // was necesarry: sure, thats one (1) "attempt", but if not, are 4 keydowns ("hest") equal to one "attempt"?
        // Is 8 key-downs then two (2) "attempts"? If the user were to type "horse" (5 key-downs) that would then be 1.2 attempts
        // used at first, and then another attempt ("hest") giving an accuracy rating of 4/9 = 0.44%?
        // Indeed it is difficult to quantify an "attempt".
        // One might even be tempted to completely ignore the "attempt"-counting, and instead measure time spent while setting time thresholds for task scores?
    }

    function stdLogEntry(string, eventType, attemptCount = null) {
        // default log Entry, use whenever.
        let eventObj = {
            event: string,
            timeStamp: Date.now(),
            explainer: `${string}`,
            taskObject: InputControllerState.currentTaskObject,
            task: InputControllerState.currentTask,
            type: eventType
        }
        if (attemptCount != null) {
            eventObj.attemptCount = attemptCount;
        }

        InputControllerState.taskEventLogArray.push(eventObj);
        _logController.HandleSecretLogEntry(InputControllerState.currentTaskObject, eventObj)
    }

    function getEventLog() {
        let eventObj = {
            allEvents: InputControllerState.taskEventLogArray,
            keyDown: InputControllerState.taskKeyDownLogArray,
            InputFields: InputControllerState.taskInputfieldArray,
            mouseDown: InputControllerState.taskMouseDownLogArray,
            dblClick: InputControllerState.taskDblClickLogArray
        }

        return eventObj;
    }

    function clearTaskEventLog() {
        InputControllerState.taskEventLogArray = [];
        InputControllerState.taskKeyDownLogArray = [];
        InputControllerState.taskInputfieldArray = [];
        InputControllerState.taskMouseDownLogArray = [];
        InputControllerState.taskDblClickLogArray = [];

    };


    function clearState() {
        InputControllerState.currentClickEvent = null;
        InputControllerState.currentClickTarget = null;

        InputControllerState.currentDblClickEvent = null;
        InputControllerState.currentDblClickTarget = null;

        InputControllerState.currentKey = null;
        InputControllerState.currentKeySequence = [];

        InputControllerState.currentString = null;
        InputControllerState.currentStringInstance = null;
    }
    function clearInputFields() {
        debugLog("clearInputFields (inputController.js)");
        $(settings.exerciseContainerSelector).find('input').val('');
    };


    function clearAttempts() {
        InputControllerState.interactionCount = 0;
        InputControllerState.taskAttemptInputfieldInputCount = 0;
        InputControllerState.taskAttemptKeyCount = 0;
        InputControllerState.taskAttemptDblclickCount = 0;
        InputControllerState.taskAttemptClickCount = 0;
        InputControllerState.taskAttemptRightClickCount = 0;
    };

    function handleRestartExercise() {
        debugLog("handleRestartExercise (inputcontroller)", InputControllerState)
        clearInputFields();
        clearAttempts();
    };

    function clearGlobalEventListeners() {
        $(settings.exerciseContainerSelector).off()
        let $task = $("#assetContentWrapper .task:first");
        $task.parent().off()
    }

    function initGlobalEventListeners() {
        // for some reason i have to reach down to the .task, then target its' parent() - Can't directly target .task__list....
        let task = $("#assetContentWrapper .task:first");
        debugLog("initGlobalEventListeners", { task: task, taskObject: InputControllerState.currentTaskObject })

        if (settings.keyDownDetect) {
            $(task).parent().on('keyup', keyUpHandler);
        };

        if (settings.mouseDownDetect) {
            $(task).parent().on('mousedown', mouseClickHandler);
            $(task).parent().on('contextmenu', rightClickHandler);
        };

        if (settings.dblClickDetect) {
            $(task).parent().on('dblclick', dblClickHandler);
        };
    };


    // =================================================================================================
    // __________________________ report rectangles in debug mode ______________________________________

    function toggleReportRectangle(isOn, target) {
        debugLog("toggleReportRectangle", { isOn: isOn, target: target, InputControllerState: InputControllerState })
        InputControllerState.isReportingRectangles = isOn;
        InputControllerState.reportTarget = target;

    }
    function recordRectanglePoint(event) {
        debugLog("reportRectangle(event) : ", event)
        let rectangleObjectArray = InputControllerState.rectangleObjectArray;
        let rectanglePointArray = InputControllerState.rectanglePointArray;
        let rectPointObj = getMouseClickCoordinatesObject(event)
        //
        if (event.target.nodeName == 'IMG' && rectanglePointArray.length < 2) { // only save rectangles if within screenshot <img> 
            $(`${debugMsgContainerSelector} input`).html('... klik igen ...');
            rectanglePointArray.push(rectPointObj)
        }
        if (rectanglePointArray.length >= 2) {
            let pObj = { p0: rectanglePointArray[0], p1: rectanglePointArray[1] }
            let rObj = getRectObject(pObj);

            rectangleObjectArray.push(rObj);
            reportRectangleObject(rObj)

            InputControllerState.rectanglePointArray = [];
        }

        return false;
    }
    function getRectObject(pointObj) {
        // formats an point-object {[x0, y0], [x1,y1]} into an rectangle-shaped object {x, y, h, w}
        // all numbers are percentages % of container

        let x0 = pointObj.p0.relXpercent;
        let x1 = pointObj.p1.relXpercent;

        let y0 = pointObj.p0.relYpercent;
        let y1 = pointObj.p1.relYpercent;

        // handle "inverse" square
        if (x0 > x1) {
            x0 = pointObj.p1.relXpercent;
            x1 = pointObj.p0.relXpercent;
        }
        if (y0 > y1) {
            y0 = pointObj.p1.relYpercent;
            y1 = pointObj.p0.relYpercent;
        }
        let width = x1 - x0;
        let height = y1 - y0;

        let rectObject = { x: x0, y: y0, w: width, h: height };

        return rectObject;
    }

    function getRectString(rectangleObject) {
        let rString = '';
        if (rectangleObject) {
            let x = rectangleObject.x;
            let y = rectangleObject.y;
            let width = rectangleObject.w;
            let height = rectangleObject.h;

            rString = `{x:${x}, y:${y}, width:${width}, height:${height}}`;
        }
        return rString;
    }

    function reportRectangleObject(rectangleObject) {

        let roundedRectObject = rectangleObject;
        Object.keys(roundedRectObject).forEach(key => {
            if (typeof rectangleObject[key] == 'number') {
                rectangleObject[key] = roundNumber(rectangleObject[key], 4);
            }
        })

        let rectString = getRectString(roundedRectObject)

        $(`${debugMsgContainerSelector} input`).html(rectString);
        $(`${debugMsgContainerSelector} input`).val(rectString);
        $(`${debugMsgContainerSelector} span`).html('');

        $(debugMsgContainerSelector).removeClass('blink-change');
        $(debugMsgContainerSelector).addClass('blink-change')

        drawRectangle(rectangleObject);
    }

    function getInteractionCssObject(rectangleObject) {
        let taskInteractionCssObject

        Object.keys(rectangleObject).forEach(key => {
            if (typeof rectangleObject[key] == 'number') {
                rectangleObject[key] = rectangleObject[key] + "%";
            }
        }); // turns dimension decimals into 'percentage-string' if in number format.

        taskInteractionCssObject = {
            left: rectangleObject.x,
            top: rectangleObject.y,
            width: rectangleObject.w,
            height: rectangleObject.h
        };

        return taskInteractionCssObject;
    }

    function drawRectangle(rectangleObject) {
        let cssObj = getInteractionCssObject(rectangleObject)
        let $taskInteractionDom = $(taskActiveSelector).find(taskInteractionSelector)
        let mockInteractionRectangleDOM = document.createElement('div');
        let mockInteractionClass = 'debug__mock-interaction';

        $taskInteractionDom.find(`.${mockInteractionClass}`).remove()
        $(mockInteractionRectangleDOM).css(cssObj).addClass(mockInteractionClass);

        $taskInteractionDom.append(mockInteractionRectangleDOM);
    }

    // =============================================================================================

    function roundNumber(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }

    // =======================================================================================

    this.InitInputController = initInputController;
    this.InitNewTaskInteraction = initNewTaskInteraction
    this.InitInteractionArray = initInteractionArray;
    this.InitTask = initTask;
    this.StdLogEntry = stdLogEntry;
    this.GetEventLog = getEventLog;
    this.ClearTaskEventLog = clearTaskEventLog;
    this.ICHandleRestartExercise = handleRestartExercise;
    this.ToggleReportRectangle = toggleReportRectangle;

    return this;
}



// logController is tasked with logging everything important so that:
//   a) debuggers can follow along and pinpoint errors
//   b) data, statistics, and insight of the application can be made
//  as such, the logController should be prepared first, as to
//      feed the other controllers with the logController.

// when events are logged, they should be wrapped in an eventObject, and passed with a taskObject
//      --> as such: _logController.HandleOutputLogEntry(TASKOBJ, EVENTOBJ, COMMENTOBJ)
// logentries are then stored in log-entry-objects, with following structure:
// logEntryObject = {
//      logID: TASK OBJECT ID + Date.now(),
//      logTimeStamp: Date.now(),
//      logEvent: EVENT OBJECT,
//      logType: "input" / "output" / "secret",
//      logComment: COMMENT OBJECT
//   }

// the event object structure is shown in the logController init(), and here:
// eObj = {
//      event: "Task Completed." / "Task Auto-Completed" / "Exercise Complete."
//      timeStamp: Date.now(),
//      task: CURRENT TASK OBJECT,
//      explainer: HUMAN-FRIENDLY EXPLAINER STRING
//      
//  }

// as is, logController has 3 categories of log entries ("user" being the end-user interacting with the UI):
// 1) input log - for logging when the user does something (fx userinput!)
// 2) output log - for logging when the user is told something (likely feedback from feedbackController)
// 3) secret log - logging things not apparent to the user
// logs are intermittenly stored in the logController, then stored to a task Object with storeTaskObject()


// use-flow:
// 0. init logController --> var _logController = ITEM.LogController({}, state.eventLog)
// 1. start task (or any process fragment, ie. multiple tasks make up an exercise)
// 2. something noteworthy happens (input/output/secret) during the task
//      --> handleInputLogEntry() OR handleOutputLogEntry() OR handleSecretLogEntry()
//          this is done within each individual controller that has access to the logController
//          - fx inside inputController when user input is detected (handleInputLogEntry())
//          - fx inside feedbackController when feedback is shown (handleOutputLogEntry())
//          - fx inside inputController when task is considered complete (handleSecretLogEntry())
// 3. end task: all events that happened during current task are clustered, and attached to the taskObejct
//      --> storeTaskEvents()
// 4. all the events that happened during the task can now be accessed from the task object. 



ITEM.LogController = function (settings, _eventLog) {
    this.settings = settings || {};

    let logEntries = []

    function init() {

        storeLogEntry(
            {
                logID: "INIT",
                logEvent: [
                    {
                        timeStamp: Date.now(),
                        explainer: "LOG CONTROLLER INIT",
                        type: "status",
                        task: null,
                        taskObject: null,
                        event: null
                    }
                ],
                logComment: null
            }
        )
    };

    
    function checkEventObject(eventObject) {
        // Warning if eventobject looks unexpected
        if (settings.debugMode) {
            if (typeof eventObject.event == 'undefined') {
                console.warn("Warning (LogController): eventobject not of expected shape (eventObject.event == undefined). Please specify event.", eventObject)
            };
            if (typeof eventObject.timeStamp == 'undefined') {
                console.warn("Warning (LogController): eventobject not of expected shape (eventObject.timeStamp == undefined). Please set timestamp.", eventObject)
            };
            if (typeof eventObject.task == 'undefined') {
                console.warn("Warning (LogController): eventobject not of expected shape (eventObject.task == undefined). Please specify current task.", eventObject)
            }
        }
    };

    // handleInputLogEntry, handleOutputLogEntry, and handleSecretLogEntry do mostly the same, but are seperate functions for the sake of possible futures...
    function handleInputLogEntry(taskObj, eventObject, commentObject) {
        checkEventObject(eventObject);

        let logEntryObject = {
            logID: taskObj?.id + Date.now(), // leave as NaN if no taskObj (no taskObj = big problem!)
            logTimeStamp: Date.now(),
            logEvent: eventObject,
            logType: "input",
            logComment: commentObject // use only for debugging.
        }

        storeLogEntry(logEntryObject, logEntries);
    }

    function handleOutputLogEntry(taskObj, eventObject, commentObject) {

        checkEventObject(eventObject)

        let logEntryObject = {
            logID: taskObj?.id + Date.now(),
            logTimeStamp: Date.now(),
            logEvent: eventObject,
            logType: "output",
            logComment: commentObject
        }
        storeLogEntry(logEntryObject, logEntries);
    }

    function handleSecretLogEntry(taskObj, eventObject, commentObject) {

        checkEventObject(eventObject)

        let logEntryObject = {
            logID: taskObj?.id + Date.now(),
            logTimeStamp: Date.now(),
            logEvent: eventObject,
            logType: "secret",
            logComment: commentObject
        }
        storeLogEntry(logEntryObject, logEntries);
    }

    function storeLogEntry(logEntry, destination) {
        let arr = destination || logEntries;
        arr.push(logEntry);
        _eventLog.push(logEntry);
    };

    function storeLogEntriesToTaskObject(taskObject) {
        debugLog("storeLogEntry() :", taskObject)
        let id, matchingLogs;

        if (typeof taskObject !== 'undefined' && taskObject) {
            matchingLogs = getLogsById(id);
            taskObject.userObject.taskLog = (matchingLogs)

        } else {
            debugLog("storeLogEntry() - taskObject ERROR")
        }
    }

    function getLogsById(id) {
        let array
        if (id) {
            array = logEntries.filter(entry => entry.logID == id)
        } else {
            array = []
        };

        return array
    }
    function getLogs() {
        return logEntries;
    }
    // _____________________________________________________________
    function isUndefined(variable){
        return variable === void 0 && variable;
    }

    function debugLog(msg, obj) {
        if (settings.debugMode) {
            console.log(msg, obj)
        }
    }



    init();

    this.HandleInputLogEntry = handleInputLogEntry;
    this.HandleOutputLogEntry = handleOutputLogEntry;
    this.HandleSecretLogEntry = handleSecretLogEntry;
    this.StoreLogEntry = storeLogEntry;
    this.StoreLogEntriesToTaskObject = storeLogEntriesToTaskObject;
    this.GetLogsById = getLogsById;
    this.GetLogs = getLogs;

    return this;
}
// Results Controller handles all synthesizing and interpretation of data.
// The goal is to homogenize the shape of user/result data.
// fx. for immediate and simple "insights"/"statistics" after completed exercise.
// Meant for very simple calculations and reminders ("you did bad at this exercise!", etc.) 
//  - the heavy load (if any) should be serverside / elsewhere.

// usage flow:
// 0. init resultController, do exercise flow
// 1. finish exercise.
// 2. PREPARE results object array
//      --> let exerciseResultObjectArray = _resultsController?.GetExerciseResultObjectArray(state);
// 3. show results markup (with markup controller)
//      --> _markupController?.GenerateExerciseResultMarkup(exerciseResultObjectArray);

ITEM.ResultsController = function (settings, state) {

    const exerciseSelector = settings.exerciseSelector;
    function init() {   

    };

    function getExerciseAttemptInstanceLogArray(EventLogArray) {
        let exerciseAttemptArrayInstanceLogArray = new Array();
        let eventLogArrayCopy = [...EventLogArray];
        let exerciseSplitIndexArray = [0]; // the 0th entry in the EventLogArray is INIT though, so be careful...

        // condition for splitting apart arrays
        eventLogArrayCopy.forEach((logEntry, index) => {
            if (logEntry.logEvent.event == 'Exercise Complete.') {
                // here we notice at what index we should part the evenLog array
                // for example [1,13,26,39] - all the exercise events happens in between 1-13, 13-26, and 25-39
                exerciseSplitIndexArray.push(index);
            }
        })

        // we get the event intervals, limited by the above index, sliced into their own array. 
        for (let i = 1; i < exerciseSplitIndexArray.length; i++) {
            let bottomInterval = exerciseSplitIndexArray[i - 1];
            let topInterval = exerciseSplitIndexArray[i];
            let exerciseAttemptInstanceArray = eventLogArrayCopy.slice(bottomInterval+1, topInterval + 1) // slice cuts off one index before "Exercise Complete." - so we increment +1
            exerciseAttemptArrayInstanceLogArray.push(exerciseAttemptInstanceArray);
        }

        return exerciseAttemptArrayInstanceLogArray;
    }

    function getExerciseResultObjectArray(state) {
        // should return array of objects (exerciseResultObjectArray) ready to be handled by the markup-controller.
        // The exercise objects are returned in an array, as there can be more than one attempt at an exercise.

        let exerciseResultObjectArray = new Array();
        let stateEventLogArray = state.EventLog;
        let exerciseAttemptInstanceLogArray = getExerciseAttemptInstanceLogArray(stateEventLogArray); // gets array of exercise attempts - each attempt being an array of events
        
        exerciseAttemptInstanceLogArray.forEach((attemptEventArray, index) => {
            // run through all exercise attempts (an array of multiple events, encapsuling an exercise, limited by a start and a stop event.)
            let allSecretTypeLogs = attemptEventArray.filter(event => event.logType == 'secret');
            let allOutputTypeLogs = attemptEventArray.filter(event => event.logType == 'output');
            let allInputTypeLogs = attemptEventArray.filter(event => event.logType == 'input');

            let allTaskCompleteTypeLogs = allSecretTypeLogs.filter(event => event.logEvent.event == 'Task Complete.')
            let allTaskAutocompleteTrueLogs = allOutputTypeLogs.filter(event => event.logEvent.event == 'Task Auto-Completed.');

            let attemptCountSum = 0;
            let totalTaskCount = 0;
            let totalAutocompleteCount = allTaskAutocompleteTrueLogs.length;

            // calcs / stats
            let exerciseName = state.exerciseName;
            let exerciseStartTime = attemptEventArray[0].logEvent.timeStamp;
            let exerciseEndTime = attemptEventArray[attemptEventArray.length - 1].logEvent.timeStamp;
            let exerciseTimeSpentMs = exerciseEndTime - exerciseStartTime;
            let exerciseTimeSpentSeconds = exerciseTimeSpentMs / 1000;
            let exerciseMeanPrecision = (allTaskCompleteTypeLogs.length / attemptCountSum) * 100
            

            let exerciseResultObject = {
                index : index,
                name: exerciseName,
                exerciseStartTime: exerciseStartTime,
                exerciseEndTime: exerciseEndTime,
                exerciseTimeSpentMs: exerciseTimeSpentMs,
                exerciseTimeSpendSeconds: exerciseTimeSpentSeconds,
                exerciseMeanPrecision: null,
                exerciseAutocompleteCount: totalAutocompleteCount,
                exerciseAutoCompleteEvents: allTaskAutocompleteTrueLogs,
                allUserEvents: [],
                exerciseTaskResultObjectArray: []
            };

            
            attemptEventArray.forEach(logEntry => {
                // we check if there were certain circumstances me might want to log - for example an Autocomplete event
                let userDidAutoCompleteEvent = false;
                let taskIndex = null;
                let taskSubtitles = null;

                if (logEntry.logEvent.event == 'Task Auto-Completed.') { 
                    userDidAutoCompleteEvent = true;
                }
                if (typeof logEntry.logEvent.taskObject != 'undefined') {
                    taskIndex = logEntry.logEvent.taskObject.index;
                }
                if (typeof logEntry.logEvent.taskObject != 'undefined') {
                    taskSubtitles = logEntry.logEvent.taskObject.subtitles;
                }
                
                exerciseResultObject.allUserEvents.push(logEntry)

                let exerciseTaskResultObject = {
                    eventType: logEntry.eventType,
                    logEntry: logEntry,
                    userDidAutoCompleteEvent: userDidAutoCompleteEvent,
                    index: taskIndex,
                    subtitles: taskSubtitles
                }
                exerciseResultObject.exerciseTaskResultObjectArray.push(exerciseTaskResultObject);
            })
            exerciseResultObjectArray.push(exerciseResultObject);
        })
        
        return exerciseResultObjectArray;
    }


    function prepareTaskResultArray(taskObjArr) {
        // returns an array of task result objects.
        let taskResultArray = new Array();

        state.TaskObjectArray.forEach(taskObj => {
            let taskResultObj = {};

            let taskLog = taskObj.userObject.taskLog;
            let taskStartTimeStamp = taskLog[0].logTimeStamp
            let taskEndTimeStamp = taskLog[taskLog.length - 1].logTimeStamp;

            let taskTimeSpentMs = taskEndTimeStamp - taskStartTimeStamp
            let taskTimeSpentSeconds = taskTimeSpentMs / 1000;

            let taskUserEvents = taskObj.userObject.taskLog.filter(logEntry => logEntry.logEvent.event.originalEvent instanceof KeyboardEvent || logEntry.logEvent.event.originalEvent instanceof MouseEvent);

            let userPrecision = Math.round((1 / taskUserEvents.length) * 100, 3);
            let userDidAutoCompleteEvent = taskObj.userObject.taskLog.filter(logEntry => logEntry.logEvent.event == 'Task Auto-Completed.').length > 0;

            taskResultObj.index = taskObj.index;
            taskResultObj.userDidAutoCompleteEvent = userDidAutoCompleteEvent;
            taskResultObj.timeSpentMs = taskTimeSpentMs;
            taskResultObj.timeSpentSeconds = taskTimeSpentSeconds;
            taskResultObj.userPrecision = userPrecision;
            taskResultObj.screenshot = taskObj.screenshot;
            taskResultObj.userEvents = taskUserEvents;
            taskResultObj.subtitles = taskObj.subtitles;

            taskResultArray.push(taskResultObj);
        });
        return taskResultArray;
    }

    
    init();

    this.GetExerciseResultObjectArray = getExerciseResultObjectArray
    this.PrepareTaskResultArray = prepareTaskResultArray;
    
    

    return this;
}