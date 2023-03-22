using Umbraco.Cms.Core.Models.PublishedContent;

namespace ENS.UmbracoWreck.Models
{
    public class ExerciseTaskFeedbackModel
    {
        public string Text { get; set; }
        public Object Display { get; set; }
        public Object Highlight { get; set; }
        public Object FeedbackType { get; set; }
        public Object Dismiss { get; set; }

        public ExerciseTaskFeedbackModel(string text, Object display, Object highlight, Object feedbackType, Object dismiss)
        {

            Text = text;
            Display = display;
            Highlight = highlight;
            FeedbackType = feedbackType;
            Dismiss = dismiss;
        }
    }
}
