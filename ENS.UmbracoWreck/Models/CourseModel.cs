namespace ENS.UmbracoWreck.Models
{
    
    public class CourseModel
    {
        public List<ExerciseModel> ExerciseList { get; set; }

        public CourseModel(List<ExerciseModel> exerciseList)
        {
            ExerciseList = exerciseList;
            
        }
    }
}
