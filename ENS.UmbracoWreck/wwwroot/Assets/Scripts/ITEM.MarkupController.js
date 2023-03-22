ITEM.MarkupController = function (settings, state, config) {

    settings.showTaskOnlyOnAutocomplete = true;
    settings.showTaskSubtitles = true;
    settings.showTaskAccuracy = false;
    settings.showTaskAutocomplete = true;

    // classes
    const taskClass = "task"
    const taskInteractionsClass = "interactions";


    // selectors 
    const exerciseOverlayResultAttemptListSelector = "#result-attempt-list";

    const exerciseHeaderTitleSelector = "#exercise-header-title";
    const exerciseTitleSelector = "#exercise-title";
    const exerciseDescriptionSelector = "#exercise-description"
    const introBeginSelector = "#intro-begin";

    const resultsOverlayTaskListSelector = "#result-task-list";
    const resultsOverlayTaskStatsSelector = "#result-stats-list";
    const introOverlaySelector = "#intro-overlay";

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

    // major components
    function generateExerciseMarkup(json) {
        // todo: move into markupController.js
        const exerciseTaskModels = json[exerciseTaskModelsObjectSelector];
        const container = $(settings.exerciseSelector);

        exerciseTaskModels.forEach(taskObj => {
            let taskMarkup = []
            let taskEleId = taskObj[taskIdObjectSelector];
            let assetsPath = settings.assetsPath + taskObj[taskScreenshotObjectSelector];
            let taskInteractionList = taskObj[taskInteractionListObjectSelector];
            
            taskMarkup.push(`
                <div class="${taskClass}" id="${taskEleId}">
                <div class="${taskInteractionsClass}"></div>
                <img src="${assetsPath}" draggable="false">
                <div class="feedback-wrapper"></div>
                </div>
            `);
            container.append(taskMarkup)
            for (let interaction of taskInteractionList) {
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
            taskResultList.classList.add('result__task-list');

            exerciseAttemptInstanceTaskResultObjectArray.forEach(taskEventObject => {
                let taskResultLiDom = document.createElement("li");
                taskResultLiDom.classList.add("result__item")
                taskResultLiDom.setAttribute('data-task-index', taskEventObject.index)

                //let itemDetailsDom = getTaskDetailsDom(taskEventObject);
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
        let attemptCountString = typeof exerciseResultObject.index != 'undefined' ? `Forsøg nr. ${exerciseResultObject.index + 1}` : '';
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

        let worstTaskDom = document.createElement('p');

        let taskAutocompleteNoticeDom = document.createElement('div');
        let taskAutoCompleteNoticeTextNode = document.createTextNode(`Du trykkede på 'Gør det for mig', og fik hjælp til en eller flere opgaver. Antal: ${exerciseResultObject.exerciseAutocompleteCount}`);
        let taskAutocompleteNoticeIconDom = document.createElement('span');
        let taskAutocompleteNoticeIconTextNode = document.createTextNode('warning');
        taskAutocompleteNoticeIconDom.classList.add('material-icons');
        taskAutocompleteNoticeIconDom.append(taskAutocompleteNoticeIconTextNode)
        taskAutocompleteNoticeDom.classList.add("alert", "result__notice");
        taskAutocompleteNoticeDom.append(taskAutocompleteNoticeIconDom, taskAutoCompleteNoticeTextNode);

        resultSummaryDom.append(headerDom, subheaderDom);
        if (exerciseResultObject.exerciseAutocompleteCount > 0) {
            resultSummaryDom.append(taskAutocompleteNoticeDom);
        }
        //resultSummaryDom.append(precisionInfoDom);
        //resultSummaryDom.append(interactionCountDom);
        //resultSummaryDom.append(worstTaskDom);

        return resultSummaryDom;
    };

    function getTaskDetailsDom(task) {
        let detailsDom = document.createElement('div');
        detailsDom.classList.add('result__details');

        return detailsDom;
    };

    function getTaskInfoDom(taskResultObject) {
        let infoDom = document.createElement('div');
        infoDom.classList.add('result__info');

        if (settings.showTaskAutocomplete) {
            if (taskResultObject.userDidAutoCompleteEvent) {
                let userAutoCompleteDom = getUserAutoCompleteResultDom(taskResultObject.userDidAutoCompleteEvent);
                infoDom.append(userAutoCompleteDom);
            }
        }


        if (settings.showTaskSubtitles && taskResultObject.subtitles != null) {
            //let taskSubtitlesDom = document.createElement('div')
            //let taskSubtitlesTextNode = document.createTextNode(`“ ${taskResultObject.subtitles} ”`)
            //taskSubtitlesDom.append(taskSubtitlesTextNode)
            //taskSubtitlesDom.classList.add('result__quote');
            //taskSubtitlesDom.classList.add('info-item');

            //infoDom.append(taskSubtitlesDom);
        }
        let taskSubtitlesDom = document.createElement('div')
        let taskSubtitlesTextNode = document.createTextNode(`“ ${taskResultObject.subtitles} ”`)
        taskSubtitlesDom.append(taskSubtitlesTextNode)
        taskSubtitlesDom.classList.add('result__quote');
        taskSubtitlesDom.classList.add('info-item');

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

        if (taskResultObject.index != null) {
            //let headerTextNode = document.createTextNode(`Opgave ${taskResultObject.index + 1}`);
            //titleDom.append(headerTextNode);    
        }
        let headerTextNode = document.createTextNode(`Opgave ${taskResultObject.index + 1}`); // bug: always 1???
        titleDom.append(headerTextNode); 

        let iconTextNode = document.createTextNode('expand_more');
        iconDom.classList.add('material-icons');
        iconDom.append(iconTextNode);

        headerDom.append(titleDom);

        return headerDom;
    };

    function getUserAutoCompleteResultDom() {
        let noticeSpanDom = document.createElement('span');

        noticeSpanDom.classList.add('alert');
        noticeSpanDom.classList.add('info-item');

        let spanTextNode = `Tryk på 'Gør det for mig'. Vil du prøve igen?`;
        let spanAlertIcon = document.createElement('span')
        spanAlertIcon.classList.add('material-icons');
        let iconTextNode = document.createTextNode('warning')
        spanAlertIcon.append(iconTextNode);

        noticeSpanDom.append(spanAlertIcon);
        noticeSpanDom.append(spanTextNode);
        

        return noticeSpanDom;
    };

    function getTaskSuccessDom() {
        let noticeSpanDom = document.createElement('span');
        let spanDoneIcon = document.createElement('span')
        spanDoneIcon.classList.add('material-icons');
        let iconTextNode = document.createTextNode('done')
        spanDoneIcon.append(iconTextNode);
        noticeSpanDom.append(spanDoneIcon);

        return noticeSpanDom
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
            $(introOverlaySelector).find('.settings-check__item.audio-check').addClass('active-check');
            let examplePlayBtn = $(introOverlaySelector).find('.settings-check__item.audio-check:first a');
            let exampleAudioFile = exerciseExampleAudioFile;
            let exampleAudioObject = new Audio(settings.assetsPath + exampleAudioFile);

            exampleAudioObject.addEventListener('ended', function () {
                examplePlayBtn.removeClass('button--playing');
            })
            exampleAudioObject.addEventListener('play', function () {
                examplePlayBtn.addClass('button--playing');
            })

            examplePlayBtn.on('click', function () {
                if (!state.isMuted) {
                    exampleAudioObject.play()
                }
            })
            $(introBeginSelector).on('click', function () { exampleAudioObject.pause(); })
        }
        if (exerciseWithSubtitles.length > 0) {
            $(introOverlaySelector).find('.settings-check__item.subtitles-check:first').addClass('active-check')
        }
        
    }

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

    this.GenerateExerciseMarkup = generateExerciseMarkup
    this.GenerateExerciseHeader = generateExerciseHeader;
    this.GenerateExerciseIntroOverlay = generateExerciseIntroOverlay
    this.GenerateExerciseResultMarkup = generateExerciseResultMarkup;
    return this;
}