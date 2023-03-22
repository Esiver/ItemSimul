ITEM.ResultsController = function (settings, state) {


    //_____ Html selectors
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
    const confirmRestartOverlaySelector = "#confirm-restart-overlay";
    const confirmRestartBtnSelector = "#confirm-restart-btn";
    const cancelRestartBtnSelector = "#cancel-restart-btn";

    // ____ settings overlay

    const toggleMuteSelector = "#mute-checkbox";
    const toggleSubtitlesSelector = "#subtitles-checkbox";
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
    

    //_____ Html classes
    const taskClass = "task";
    const taskInteractionsClass = "interactions"
    const activeOverlayClass = "active-overlay";
    const activeSubtitlesClass = "active-subtitles";
    const activeTaskClass = "active";
    const pauseExerciseClass = "paused";


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


    function init() {   

    };


    


    function generateTaskResults() {

    }

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
            //let lowPercentageUserPrecisionTaskList = taskResultObjectArray.filter(task => task.userPrecision <= 50); // .... todo

            let exerciseResultObject = {
                index : index,
                name: exerciseName,
                exerciseStartTime: exerciseStartTime,
                exerciseEndTime: exerciseEndTime,
                exerciseTimeSpentMs: exerciseTimeSpentMs,
                exerciseTimeSpendSeconds: exerciseTimeSpentSeconds,
                //lowPercentPrecisionTaskList : 2,
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

    

    function generateExerciseResults(state, taskResultObjectArray) {


    }
    

    
    function prepareExerciseIntroOverlay() {

    }

    function disableOverlay(oObj) {

    }

    function enableOverlay(oObj) {

    }
    function generateOverlayObject() {
        let oObj = {};

        return oObj;
    }

    function roundNumber(value, precision) {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    }


    init();
    this.GetExerciseResultObjectArray = getExerciseResultObjectArray
    this.PrepareTaskResultArray = prepareTaskResultArray;
    this.PrepareExerciseIntroOverlay = prepareExerciseIntroOverlay;
    this.GenerateExerciseResults = generateExerciseResults;

    return this;
}