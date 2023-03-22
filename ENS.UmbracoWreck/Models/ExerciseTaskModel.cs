namespace ENS.UmbracoWreck.Models
{
    // private set
    public class ExerciseTaskModel
    {
        public string Id { get; private set; }
        public string AudioFile { get; private set; }
        public int Delay { get; set; }
        public string Screenshot { get; set; }
        public string Subtitles { get; set; }
        public IEnumerable<ExerciseTaskInteractionModel> InteractionList { get; set; }
        public IEnumerable<ExerciseTaskFeedbackModel> FeedbackList { get; set; }

        public ExerciseTaskModel(string id, int delay, string audioFile, string screenshot, string subtitles, IEnumerable<ExerciseTaskInteractionModel> interactionList, IEnumerable<ExerciseTaskFeedbackModel> feedbackList)
        {
            Id = id;
            Delay = delay;
            AudioFile = audioFile;
            Screenshot = screenshot;
            Subtitles = subtitles;
            InteractionList = interactionList;
            FeedbackList = feedbackList;
        }

    }
}
