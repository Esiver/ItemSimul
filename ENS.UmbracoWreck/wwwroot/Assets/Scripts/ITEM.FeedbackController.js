/*jshint esversion: 11 */

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

        $(feedbackComp).addClass([feedbackItem.Mood, feedbackItem.Size]);
        $(wrapper).addClass([feedbackItem.Mood, feedbackItem.Size]);

        let tObj = { id: $(selectorDictionary.activeTaskSelector).attr('id') };
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
            setTimeout(() => dismissHandler(), timeout);
        }

        if (feedbackItem.DoItForMe != undefined) {
            const doItForMeBtn = document.createElement('a');
            const btnWrapper = document.createElement('div');
            $(feedbackComp).append(btnWrapper);
            $(btnWrapper).addClass('btn-wrapper').append(doItForMeBtn);
            doItForMeBtn.classList.add('doItForMe');
            doItForMeBtn.classList.add('button');
            doItForMeBtn.innerText = 'Gør det for mig';
            $(doItForMeBtn).on('click', () => {
                dismissHandler();
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
        function dismissHandler() {
            $(this).parents('feedback-component').remove();
            //$(wrapper).removeClass([feedbackItem.Mood, feedbackItem.Size]);
            $('.highlight-area').removeClass('highlight-area');
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

    this.SetStyleType = setStyleType;
    this.SetType = setType;
    this.SetDisplay = setDisplay;
    this.SetInteractionHighlightAsArray = setInteractionHighlightAsArray;
    this.SetInteractionHighlight = setInteractionHighlight;
    this.SetDismiss = setDismiss;

    return this;
};