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


