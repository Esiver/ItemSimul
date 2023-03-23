

ITEM.LogController = function (settings, eventLog) {
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

    // Warning if eventobject looks unexpected
    function checkEventObject(eventObject) {
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

    // handleInputLogEntry, handleOutputLogEntry, and handleSecretLogEntry do mostly the same, but are seperate functions for the sake of possible future changes...
    function handleInputLogEntry(taskObj, eventObject, commentObject) {
        checkEventObject(eventObject)
        

        let logEntryObject = {
            logID: taskObj?.id + Date.now(),
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
        eventLog.push(logEntry);
    };

    function storeLogEntriesToTask(task) {
        let id = task.id;
        let matchingLogs = getLogsById(id);
        task.userObject.taskLog = (matchingLogs); 
    }

    function getLogsById(id) {
        let array = logEntries.filter(entry => entry.logID == id)

        return array
    }
    function getLogs() {
        return logEntries;
    }

    init();

    this.HandleInputLogEntry = handleInputLogEntry;
    this.HandleOutputLogEntry = handleOutputLogEntry;
    this.HandleSecretLogEntry = handleSecretLogEntry;
    this.StoreLogEntry = storeLogEntry;
    this.StoreLogEntriesToTask = storeLogEntriesToTask;
    this.GetLogsById = getLogsById;
    this.GetLogs = getLogs;

    return this;
}