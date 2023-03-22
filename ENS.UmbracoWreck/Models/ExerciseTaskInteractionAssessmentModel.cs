namespace ENS.UmbracoWreck.Models
{
    public class ExerciseTaskInteractionAssessmentModel
    {
        public bool CaseSensitive { get; set; }
        public List<string> AttemptTrigger { get; set; }
        public List<string> CorrectInput { get; set; }

        public ExerciseTaskInteractionAssessmentModel(bool caseSensitive, List<string> attemptTrigger, List<string> correctInput)
        {
            CaseSensitive = caseSensitive;
            AttemptTrigger = attemptTrigger;
            CorrectInput = correctInput;
        }
    }

}
