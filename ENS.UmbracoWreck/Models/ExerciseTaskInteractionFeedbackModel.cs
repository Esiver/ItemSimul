using static System.Net.Mime.MediaTypeNames;

namespace ENS.UmbracoWreck.Models
{
    public class ExerciseTaskInteractionFeedbackModel
    {
        public string Id { get; set; }
        public string Text { get; set; }
        public Object Display { get; set; }
        public Object Highlight { get; set; }
        public Object FeedbackType { get; set; }
        public Object Dismiss { get; set; }
        public ExerciseTaskInteractionFeedbackModel(string id, string text, Object display, Object highlight, Object feedbackType, Object dismiss)
        {
            Id = id;
            Text = text;
            Display = display;
            Highlight = highlight;
            FeedbackType = feedbackType;
            Dismiss = dismiss;
        }
    }
    
}
