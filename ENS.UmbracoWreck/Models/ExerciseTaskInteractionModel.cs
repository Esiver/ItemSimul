using System.Drawing;
using System.Dynamic;

namespace ENS.UmbracoWreck.Models
{
    public abstract class ExerciseTaskInteractionModel
    {
        public string Id { get; set; }
        public string Type { get; set; }
        public RectangleF Dimensions { get; set; }
        
        public List<ExerciseTaskInteractionAssessmentModel> AssessmentList { get; set; }
        public List<ExerciseTaskInteractionFeedbackModel> FeedbackList { get; set; }

        public ExerciseTaskInteractionModel(string id, string type, RectangleF dimensions, List<ExerciseTaskInteractionAssessmentModel> assessmentList, List<ExerciseTaskInteractionFeedbackModel> feedbackList)
        {
            Id = id;
            Type = type;
            Dimensions = dimensions;
            AssessmentList = assessmentList;
            FeedbackList = feedbackList;
            
        }
    }
    public class ExerciseTaskKeyInteractionModel : ExerciseTaskInteractionModel
    {
        public ExerciseTaskKeyInteractionModel(string id, RectangleF dimensions, List<ExerciseTaskInteractionAssessmentModel> assessmentList, List<ExerciseTaskInteractionFeedbackModel> feedbackList) 
            : base(id,"keydown",dimensions,assessmentList,feedbackList) 
        { }
    }
    public class ExerciseTaskStringInteractionModel : ExerciseTaskInteractionModel
    {
        public ExerciseTaskStringInteractionModel(string id, RectangleF dimensions, List<ExerciseTaskInteractionAssessmentModel> assessmentList, List<ExerciseTaskInteractionFeedbackModel> feedbackList)
            : base(id, "stringinput", dimensions, assessmentList, feedbackList)
        { }
    }
    public class ExerciseTaskClickInteractionModel : ExerciseTaskInteractionModel
    {
        public ExerciseTaskClickInteractionModel(string id, RectangleF dimensions, List<ExerciseTaskInteractionAssessmentModel> assessmentList, List<ExerciseTaskInteractionFeedbackModel> feedbackList)
            : base(id, "click", dimensions, assessmentList, feedbackList)
        { }
    }
    public class ExerciseTaskDoubleClickInteractionModel : ExerciseTaskInteractionModel
    {
        public ExerciseTaskDoubleClickInteractionModel(string id, RectangleF dimensions, List<ExerciseTaskInteractionAssessmentModel> assessmentList, List<ExerciseTaskInteractionFeedbackModel> feedbackList)
            : base(id, "dblclick", dimensions, assessmentList, feedbackList)
        { }
    }
    public class ExerciseTaskRightClickInteractionModel : ExerciseTaskInteractionModel
    {
        public ExerciseTaskRightClickInteractionModel(string id, RectangleF dimensions, List<ExerciseTaskInteractionAssessmentModel> assessmentList, List<ExerciseTaskInteractionFeedbackModel> feedbackList)
            : base(id, "rightclick", dimensions, assessmentList, feedbackList)
        { }
    }
    public class ExerciseTaskHoverInteractionModel : ExerciseTaskInteractionModel
    {
        public ExerciseTaskHoverInteractionModel(string id, RectangleF dimensions, List<ExerciseTaskInteractionAssessmentModel> assessmentList, List<ExerciseTaskInteractionFeedbackModel> feedbackList)
            : base(id, "mouseover", dimensions, assessmentList, feedbackList)
        { }
    }
}
