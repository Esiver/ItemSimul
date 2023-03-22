namespace ENS.UmbracoWreck.Models
{
    public class ExerciseSettingsModel
    {
        public string ExerciseCustomCss { get; set; }
        public bool ExerciseDebugMode { get; set; }
        public ExerciseSettingsModel(string exerciseCustomCss = "", bool exerciseDebugMode = false) 
        { 
            ExerciseCustomCss = exerciseCustomCss;
            ExerciseDebugMode = exerciseDebugMode;
        }
    }
}
