using ENS.UmbracoWreck.Models;
using NUglify.JavaScript.Syntax;
using Umbraco.Cms.Core.Models.PublishedContent;

namespace ENS.UmbracoWreck.Helpers
{
	public class TaskInteractionAssessmentHelper
	{
		public static ExerciseTaskInteractionAssessmentModel GetInteractionKeyAssessmentObject(IPublishedElement keyAssessmentEntity)
		{
            bool caseSensitive = true;
            List<string> attemptTrigger = new List<string>();
            List<string> correctInputStringList = new List<string>();
            string[] correctInputList = keyAssessmentEntity.Value<string[]>("assessmentCorrectInput");

            if (correctInputList != null)
            {
                foreach (string correctInput in correctInputList)
                {
                    correctInputStringList.Add(correctInput);
                }
            }

            var assessmentObject = new ExerciseTaskInteractionAssessmentModel(caseSensitive, attemptTrigger, correctInputStringList);
            return assessmentObject;
        }

		public static ExerciseTaskInteractionAssessmentModel GetInteractionStringAssessmentObject(IPublishedElement stringAssessmentEntity)
		{
			bool caseSensitive = stringAssessmentEntity.Value<bool>("caseSensitive");
            string[] attemptTriggerList = stringAssessmentEntity.Value<string[]>("assessmentTrigger");
            string[] correctInputList = stringAssessmentEntity.Value<string[]>("assessmentCorrectInput");

            List<string> attemptTriggerStringList = new List<string>();
			List<string> correctInputStringList = new List<string>();
            

            if (attemptTriggerList != null)
            {
                foreach (string attemptTrigger in attemptTriggerList)
                {
                    attemptTriggerStringList.Add(attemptTrigger);
                }
            }

            if (correctInputList != null)
            {
                foreach (string correctInput in correctInputList)
                {
                    correctInputStringList.Add(correctInput);
                }
            }

            var assessmentObject = new ExerciseTaskInteractionAssessmentModel(caseSensitive, attemptTriggerStringList, correctInputStringList);
			return assessmentObject;

        }

        public static ExerciseTaskInteractionAssessmentModel GetInteractionMouseAssessmentObject(Object mouseAssessmentObject)
        {
            bool caseSensitive = true;
            List<string> attemptTrigger = new List<string>();
            List<string> correctInput = new List<string>();

            var assessmentObject = new ExerciseTaskInteractionAssessmentModel(caseSensitive, attemptTrigger, correctInput);

            return assessmentObject;

        }
    }
}
