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