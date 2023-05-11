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