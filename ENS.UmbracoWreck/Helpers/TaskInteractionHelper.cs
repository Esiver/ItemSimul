using ENS.UmbracoWreck.Models;
using System.Drawing;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace ENS.UmbracoWreck.Helpers
{
    public class TaskInteractionHelper
    {
        public static ExerciseTaskClickInteractionModel GetClickInteractionModel(IPublishedElement interactionElement, IPublishedElement taskParent)
        {
            var interactionId = interactionElement.Key.ToString();
            List<String> taskInteractionSettingsList = new List<String>();
            
            var interactionFeedbackList = interactionElement.Value<IEnumerable<IPublishedElement>>("interactionFeedbackList");
            string interactionDimensionRectJsonString = interactionElement.Value<string>("interactionDimensionJSONString") ?? "{}";
            RectangleF interactionDimensionsRectangle = TaskInteractionDimensionJsonHelper.getTaskInteractionRectangleFromJsonString(interactionDimensionRectJsonString);

            List<ExerciseTaskInteractionAssessmentModel> interactionAssessments = new List<ExerciseTaskInteractionAssessmentModel>();
            List<ExerciseTaskInteractionFeedbackModel> interactionFeedbacks = new List<ExerciseTaskInteractionFeedbackModel>();
            
            if (interactionFeedbackList != null)
            {
                foreach (var InteractionFeedback in interactionFeedbackList)
                {
                    interactionFeedbacks.Add(ExerciseTaskHelper.GetInteractionFeedbackObject(InteractionFeedback, taskParent));
                }
            }

            
            var taskInteractionObj = new ExerciseTaskClickInteractionModel(interactionId, interactionDimensionsRectangle, interactionAssessments, interactionFeedbacks);

            return taskInteractionObj;
        }
        public static ExerciseTaskDoubleClickInteractionModel GetDoubleClickInteractionModel(IPublishedElement interactionElement, IPublishedElement taskParent)
        {
            var interactionId = interactionElement.Key.ToString();
            List<String> taskInteractionSettingsList = new List<String>();
            
            string interactionDimensionRectJsonString = interactionElement.Value<string>("interactionDimensionJSONString") ?? "{}";
            RectangleF interactionDimensionsRectangle = TaskInteractionDimensionJsonHelper.getTaskInteractionRectangleFromJsonString(interactionDimensionRectJsonString);
            var interactionFeedbackList = interactionElement.Value<IEnumerable<IPublishedElement>>("interactionFeedbackList");


            List<ExerciseTaskInteractionAssessmentModel> interactionAssessments = new List<ExerciseTaskInteractionAssessmentModel>();
            List<ExerciseTaskInteractionFeedbackModel> interactionFeedbacks = new List<ExerciseTaskInteractionFeedbackModel>();

            if (interactionFeedbackList != null)
            {
                foreach (var InteractionFeedback in interactionFeedbackList)
                {
                    interactionFeedbacks.Add(ExerciseTaskHelper.GetInteractionFeedbackObject(InteractionFeedback, taskParent));
                }
            }


            var taskInteractionObj = new ExerciseTaskDoubleClickInteractionModel(interactionId, interactionDimensionsRectangle, interactionAssessments, interactionFeedbacks);

            return taskInteractionObj;
        }
        public static ExerciseTaskRightClickInteractionModel GetRightClickInteractionModel(IPublishedElement interactionElement, IPublishedElement taskParent)
        {
            var interactionId = interactionElement.Key.ToString();

            List<String> taskInteractionSettingsList = new List<String>();
            var interactionFeedbackList = interactionElement.Value<IEnumerable<IPublishedElement>>("interactionFeedbackList");
            string interactionDimensionRectJsonString = interactionElement.Value<string>("interactionDimensionJSONString") ?? "{}";
            RectangleF interactionDimensionsRectangle = TaskInteractionDimensionJsonHelper.getTaskInteractionRectangleFromJsonString(interactionDimensionRectJsonString);

            List<ExerciseTaskInteractionAssessmentModel> interactionAssessments = new List<ExerciseTaskInteractionAssessmentModel>();
            List<ExerciseTaskInteractionFeedbackModel> interactionFeedbacks = new List<ExerciseTaskInteractionFeedbackModel>();

            if (interactionFeedbackList != null)
            {
                foreach (var InteractionFeedback in interactionFeedbackList)
                {
                    interactionFeedbacks.Add(ExerciseTaskHelper.GetInteractionFeedbackObject(InteractionFeedback, taskParent));
                }
            }
            

            var taskInteractionObj = new ExerciseTaskRightClickInteractionModel(interactionId, interactionDimensionsRectangle, interactionAssessments, interactionFeedbacks);

            return taskInteractionObj;
        }

        public static ExerciseTaskHoverInteractionModel GetHoverInteractionModel(IPublishedElement interactionElement, IPublishedElement taskParent)
        {
            var interactionId = interactionElement.Key.ToString();
            List<String> taskInteractionSettingsList = new List<String>();
            
            var interactionFeedbackList = interactionElement.Value<IEnumerable<IPublishedElement>>("interactionFeedbackList");
            string interactionDimensionRectJsonString = interactionElement.Value<string>("interactionDimensionJSONString") ?? "{}";
            RectangleF interactionDimensionsRectangle = TaskInteractionDimensionJsonHelper.getTaskInteractionRectangleFromJsonString(interactionDimensionRectJsonString);

            List<ExerciseTaskInteractionAssessmentModel> interactionAssessments = new List<ExerciseTaskInteractionAssessmentModel>();
            List<ExerciseTaskInteractionFeedbackModel> interactionFeedbacks = new List<ExerciseTaskInteractionFeedbackModel>();

            if (interactionFeedbackList != null)
            {
                foreach (var InteractionFeedback in interactionFeedbackList)
                {
                    interactionFeedbacks.Add(ExerciseTaskHelper.GetInteractionFeedbackObject(InteractionFeedback, taskParent));
                }
            }


            var taskInteractionObj = new ExerciseTaskHoverInteractionModel(interactionId, interactionDimensionsRectangle, interactionAssessments, interactionFeedbacks);

            return taskInteractionObj;
        }

        public static ExerciseTaskKeyInteractionModel GetKeyInteractionModel(IPublishedElement interactionElement, IPublishedElement taskParent)
        {
            var interactionId = interactionElement.Key.ToString();
            var interactionAssessmentList = interactionElement.Value<IEnumerable<IPublishedElement>>("interactionAssessmentList");
            var interactionFeedbackList = interactionElement.Value<IEnumerable<IPublishedElement>>("interactionFeedbackList");
            RectangleF interactionDimensionsRectangle = new RectangleF();

            List<ExerciseTaskInteractionAssessmentModel> interactionAssessmentModelList = new List<ExerciseTaskInteractionAssessmentModel>();
            List<ExerciseTaskInteractionFeedbackModel> interactionFeedbacks = new List<ExerciseTaskInteractionFeedbackModel>();

            if (interactionAssessmentList != null)
            {
                foreach (var InteractionAssessment in interactionAssessmentList)
                {
                    interactionAssessmentModelList.Add(TaskInteractionAssessmentHelper.GetInteractionKeyAssessmentObject(InteractionAssessment));
                }
            }
            if (interactionFeedbackList != null)
            {
                foreach (var InteractionFeedback in interactionFeedbackList)
                {
                    interactionFeedbacks.Add(ExerciseTaskHelper.GetInteractionFeedbackObject(InteractionFeedback, taskParent));
                }
            }


            var taskInteractionObj = new ExerciseTaskKeyInteractionModel(interactionId, interactionDimensionsRectangle, interactionAssessmentModelList, interactionFeedbacks);
            return taskInteractionObj;
        }

        public static ExerciseTaskStringInteractionModel GetStringInteractionModel(IPublishedElement interactionElement, IPublishedElement taskParent)
        {
            var interactionId = interactionElement.Key.ToString();

            var interactionAssessmentList = interactionElement.Value<IEnumerable<IPublishedElement>>("interactionAssessmentList");
            var interactionFeedbackList = interactionElement.Value<IEnumerable<IPublishedElement>>("interactionFeedbackList");
            string interactionDimensionRectJsonString = interactionElement.Value<string>("interactionDimensionJSONString") ?? "{}";
            //RectangleF interactionDimensionsRectangle = TaskInteractionDimensionJsonHelper.getTaskInteractionRectangleFromJsonString(interactionDimensionRectJsonString);
            RectangleF interactionDimensionsRectangle = new RectangleF(2, 2, 2, 2);

            List<ExerciseTaskInteractionAssessmentModel> interactionAssessmentModelList = new List<ExerciseTaskInteractionAssessmentModel>();
            List<ExerciseTaskInteractionFeedbackModel> interactionFeedbacks = new List<ExerciseTaskInteractionFeedbackModel>();

            if (interactionAssessmentList != null)
            {
                foreach (var InteractionAssessment in interactionAssessmentList)
                {
                    interactionAssessmentModelList.Add(TaskInteractionAssessmentHelper.GetInteractionStringAssessmentObject(InteractionAssessment));
                }
            }
            if (interactionFeedbackList != null)
            {
                foreach (var InteractionFeedback in interactionFeedbackList)
                {
                    interactionFeedbacks.Add(ExerciseTaskHelper.GetInteractionFeedbackObject(InteractionFeedback, taskParent));
                }
            }


            var taskInteractionObj = new ExerciseTaskStringInteractionModel(interactionId, interactionDimensionsRectangle, interactionAssessmentModelList, interactionFeedbacks);
            return taskInteractionObj;
        }

    }
}
