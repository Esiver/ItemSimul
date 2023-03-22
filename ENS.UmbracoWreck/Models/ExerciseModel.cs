namespace ENS.UmbracoWreck.Models
{
    public class ExerciseModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string AudioFile { get; set; }
        public List<ExerciseTaskModel> ExerciseTaskModels { get; set; }
        public ExerciseSettingsModel ExerciseSettingsModel { get; set; }

        public ExerciseModel(string id, string name, string description, string audioFile, List<ExerciseTaskModel> exerciseTaskModels, ExerciseSettingsModel exerciseSettingsModel)
        {
            Id = id;
            Name = name;
            Description = description;
            AudioFile = audioFile;
            ExerciseTaskModels = exerciseTaskModels;
            ExerciseSettingsModel = exerciseSettingsModel;
        }
    }
}
