//using AspNetCore;
using ENS.UmbracoWreck.Models;
using Microsoft.VisualBasic;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using Org.BouncyCastle.Asn1;
using System.Diagnostics;
using System.Threading.Tasks;
using Umbraco.Cms.Core.Models.PublishedContent;
using static System.Net.Mime.MediaTypeNames;


namespace ENS.UmbracoWreck.Helpers
{
    public static class ExerciseTaskHelper
    {
        public static string GetExerciseListJSON(IEnumerable<IPublishedContent> exerciseModuleList)
        {
            // When we need the JSON for a course (containing multiple exercises)

            String exerciseJSONString = String.Empty;
            var exerciseStringList = new List<String>();
            var exerciseList = new List<ExerciseModel>();

            if (exerciseModuleList != null && exerciseModuleList.Any())
            {
                foreach( var exercise in exerciseModuleList)
                {
                    var exerciseTaskList = exercise.ChildrenOfType("taskObject");
                    string exerciseId = exercise.Key.ToString();
                    string exerciseTitle = exercise.Value<string>("introductionTitle");
                    string exerciseIntroduction = exercise.Value<string>("introductionText");
                    IPublishedContent exerciseAudioExampleFile = exercise.Value<IPublishedContent>("introductionAudio");
                    var exerciseAudioExampleFileUrl = exerciseAudioExampleFile != null  ? exerciseAudioExampleFile.Url() : "";

                    string exerciseCustomCSS = String.IsNullOrEmpty(exercise.Value<string>("exerciseCustomCSS")) ? "" : exercise.Value<string>("exerciseCustomCSS");
                    bool exerciseDebugMode = exercise.Value<bool>("exerciseDebugMode");

                    ExerciseSettingsModel exerciseSettingsModel = new ExerciseSettingsModel();
                    List<ExerciseTaskModel> exerciseTaskModelList = new List<ExerciseTaskModel>();

                    foreach (var task in exerciseTaskList)
                    {
                        ExerciseTaskModel taskObj = ExerciseTaskHelper.GetTaskObject(task);
                        exerciseTaskModelList.Add(taskObj);
                    }
                    exerciseList.Add(new ExerciseModel(exerciseId, exerciseTitle, exerciseIntroduction, exerciseAudioExampleFileUrl, exerciseTaskModelList, exerciseSettingsModel));
                }
            }

            // a "course" as a container for exercises
            // (ie. a course can contain multiple exercises. -> An exercise can contain multiple tasks.)
            // an exercise should be completed in one sitting. maybe.
            var Course = new CourseModel(exerciseList);

            var serializerSettings = new JsonSerializerSettings();
            serializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            exerciseJSONString = JsonConvert.SerializeObject(Course, serializerSettings);
            return exerciseJSONString;
        }

        public static string GetExerciseJSON(IPublishedContent exerciseNode)
        {
            // for when we need the JSON for a single exercise, containing multiple tasks.

            var exerciseTaskObjectList = new List<ExerciseTaskModel>();
            var exerciseTaskNodeChildren = exerciseNode.ChildrenOfType("taskObject");
            var exerciseId = exerciseNode.Key.ToString();
            string exerciseTitle = exerciseNode.Value<string>("introductionTitle");
            string exerciseIntroduction = exerciseNode.Value<string>("introductionText");
            IPublishedContent exerciseAudioExampleFile = exerciseNode.Value<IPublishedContent>("introductionAudio");
            string exerciseAudioExampleFileUrl = exerciseAudioExampleFile != null ? exerciseAudioExampleFile.Url() : "";
            string exerciseCustomCSS = String.IsNullOrEmpty(exerciseNode.Value<string>("exerciseCustomCSS")) ? "" : exerciseNode.Value<string>("exerciseCustomCSS");
            bool exerciseDebugMode = exerciseNode.Value<bool>("exerciseDebugMode");

            foreach (var taskNode in exerciseTaskNodeChildren)
            {
                var taskObject = ExerciseTaskHelper.GetTaskObject(taskNode);
                exerciseTaskObjectList.Add(taskObject);
            }

            ExerciseSettingsModel exerciseSettingsObject = new ExerciseSettingsModel(exerciseCustomCSS, exerciseDebugMode);
            ExerciseModel exerciseObject = new ExerciseModel(exerciseId,exerciseTitle, exerciseIntroduction, exerciseAudioExampleFileUrl, exerciseTaskObjectList, exerciseSettingsObject);

            var serializerSettings = new JsonSerializerSettings();
            serializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
            String exerciseJSONString = JsonConvert.SerializeObject(exerciseObject, serializerSettings);

            return exerciseJSONString;
        }

        public static ExerciseTaskModel GetTaskObject(IPublishedElement taskElement)
        {
            string taskId = taskElement.Key.ToString();
            int taskDelay = taskElement.Value<int>("taskDelay");
            var taskAudiofile = taskElement.Value<IPublishedContent>("taskAudiofile");
            var taskAudiofileUrl = taskAudiofile != null ? taskAudiofile.Url() : "";
            var taskScreenshot = taskElement.Value<IPublishedContent>("taskScreenshot");
            var taskScreenshotUrl = taskScreenshot != null ? taskScreenshot.Url() : "";
            string taskSubtitles = taskElement.Value<string>("taskSubtitles");
            var taskInteractionElementList = taskElement.Value<IEnumerable<IPublishedElement>>("taskInteractionList"); // always nested content list 
            var taskFeedbackElementList = taskElement.Value<IEnumerable<IPublishedElement>>("taskFeedbackList");

            List<ExerciseTaskInteractionModel> taskInteractionList = new List<ExerciseTaskInteractionModel> { }; 
            List<ExerciseTaskFeedbackModel> taskFeedbackList = new List<ExerciseTaskFeedbackModel> {};

            if (taskInteractionElementList != null) { 
                foreach(var taskInteractionEl in taskInteractionElementList)
                {
                    var interactionTypeAlias = taskInteractionEl.ContentType.Alias.ToString();
                    switch (interactionTypeAlias)
                    {
                        case ("taskInteractionClick"):
                            taskInteractionList.Add(TaskInteractionHelper.GetClickInteractionModel(taskInteractionEl, taskElement));
                            break;
                        case ("taskInteractionDoubleClick"):
                            taskInteractionList.Add(TaskInteractionHelper.GetDoubleClickInteractionModel(taskInteractionEl, taskElement));
                            break;
                        case ("taskInteractionRightClick"):
                            taskInteractionList.Add(TaskInteractionHelper.GetRightClickInteractionModel(taskInteractionEl, taskElement));
                            break;
                        case ("taskInteractionHover"):
                            taskInteractionList.Add(TaskInteractionHelper.GetHoverInteractionModel(taskInteractionEl, taskElement));
                            break;
                        case ("taskInteractionKeyDown"):
                            taskInteractionList.Add(TaskInteractionHelper.GetKeyInteractionModel(taskInteractionEl, taskElement));
                            break;
                        case ("taskInteractionStringInput"):
                            taskInteractionList.Add(TaskInteractionHelper.GetStringInteractionModel(taskInteractionEl, taskElement));
                            break;
                        default:
                            throw new ArgumentOutOfRangeException($"no valid interaction model for type {interactionTypeAlias}");
                    }
                }
            }

            if (taskFeedbackElementList != null )
            {
                foreach(var feedbackEl in taskFeedbackElementList)
                {
                    taskFeedbackList.Add(ExerciseTaskHelper.GetTaskFeedbackObject(feedbackEl));
                }
            }

            var task = new ExerciseTaskModel(taskId, taskDelay, taskAudiofileUrl, taskScreenshotUrl, taskSubtitles, taskInteractionList, taskFeedbackList );

            return task;
        }


        
        public static ExerciseTaskInteractionFeedbackModel GetInteractionFeedbackObject(IPublishedElement interactionFeedbackElement, IPublishedElement taskParent)
        {
            //var interactionId = taskParent.Key.ToString();
            var interactionId = interactionFeedbackElement.Key.ToString();
            var feedbackEntity = interactionFeedbackElement;

            var feedbackText = feedbackEntity.Value<string>("feedbackText");
            var feedbackDisplayTrigger = "attempts";//feedbackEntity.Value<string>("displayTrigger");
            int feedbackDisplayThreshold = feedbackEntity.Value<int>("displayThreshold");
            
            object feedbackHighlight = new object(); //

            bool feedbackHighlightToggle = feedbackEntity.Value<bool>("highlightInteraction");
            var feedbackMood = feedbackEntity.Value<string>("typeMood");
            var feedbackSize = feedbackEntity.Value<string>("typeSize");
            String feedbackDismissBtnText = feedbackEntity.Value<String>("feedbackDismissBtnText");
            Boolean feedbackDismissDoItForMe = feedbackEntity.Value<Boolean>("enableDoItForMe");
            String feedbackDismissType = feedbackEntity.Value<String>("dismissType");
            int feedbackDismissTimeout =feedbackEntity.Value<int>("dismissTimeout");

            object feedbackDisplay = new object();
            feedbackDisplay = new { Type = feedbackDisplayTrigger, Threshold = feedbackDisplayThreshold };

            if (feedbackHighlightToggle)
            {
                feedbackHighlight = new { highlightInteraction =  interactionId};

            } else
            {
                feedbackHighlight = new { highlightInteraction = String.Empty };

            }

            object feedbackType = new object();
            feedbackType = new { Mood = feedbackMood, Size = feedbackSize };

            object feedbackDismiss = new object();
            feedbackDismiss = new { Text = feedbackDismissBtnText, DoItForMe = feedbackDismissDoItForMe, Type = feedbackDismissType, timeout = feedbackDismissTimeout };
            
            ExerciseTaskInteractionFeedbackModel feedbackObj = new ExerciseTaskInteractionFeedbackModel(interactionId, feedbackText,feedbackDisplay,feedbackHighlight,feedbackType,feedbackDismiss);

            return feedbackObj;
        }

        public static ExerciseTaskFeedbackModel GetTaskFeedbackObject(IPublishedElement taskFeedbackElement)
        {
            var feedbackEntity = taskFeedbackElement;

            var feedbackText = feedbackEntity.Value<string>("feedbackText");
            var feedbackDisplayTrigger = feedbackEntity.Value<string>("displayTrigger");
            feedbackDisplayTrigger = String.IsNullOrEmpty(feedbackDisplayTrigger) ? "time" : feedbackDisplayTrigger;
            int feedbackDisplayThreshold = feedbackEntity.Value<int>("displayThreshold");
            List<string> highlightInteractionList = feedbackEntity.Value<List<String>>("highlightInteraction") != null ? feedbackEntity.Value<List<String>>("highlightInteraction") : new List<String>(); ;
            var feedbackMood = feedbackEntity.Value<string>("typeMood");
            var feedbackSize = feedbackEntity.Value<string>("typeSize");
            Boolean feedbackDismissDoItForMe = feedbackEntity.Value<Boolean>("enableDoItForMe");
            String feedbackDismissType = feedbackEntity.Value<String>("dismissType");
            int feedbackDismissTimeout = feedbackEntity.Value<int>("dismissTimeout");


            object feedbackDisplay = new object();
            feedbackDisplay = new { Type = feedbackDisplayTrigger, Threshold = feedbackDisplayThreshold };

            object feedbackHighlight = new object();
            feedbackHighlight = new { highlightInteraction = highlightInteractionList };

            object feedbackType = new object();
            feedbackType = new { Mood = feedbackMood, Size = feedbackSize };

            object feedbackDismiss = new object();
            feedbackDismiss = new { DoItForMe = feedbackDismissDoItForMe, Type = feedbackDismissType, timeout = feedbackDismissTimeout };


            ExerciseTaskFeedbackModel taskFeedback = new ExerciseTaskFeedbackModel(feedbackText,feedbackDisplay,feedbackHighlight,feedbackType,feedbackDismiss);
            return taskFeedback;
        }
    }
}
