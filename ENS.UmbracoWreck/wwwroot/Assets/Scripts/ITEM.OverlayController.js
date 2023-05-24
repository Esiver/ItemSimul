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