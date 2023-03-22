using Newtonsoft.Json;
using NPoco.fastJSON;
using System.Drawing;
using System.Text.RegularExpressions;

namespace ENS.UmbracoWreck.Helpers
{
    public class TaskInteractionDimensionJsonHelper
    {
        public static RectangleF getTaskInteractionRectangleFromJsonString(string jsonString)
        {
            jsonString = Regex.Replace(jsonString, @"%", "");
            RectangleF taskInteractionRectangle = new RectangleF();
            try
            {
                taskInteractionRectangle = JsonConvert.DeserializeObject<RectangleF>(jsonString);
            } 
            catch {
                taskInteractionRectangle = new RectangleF(1,1,1,1);
            }
            
            return taskInteractionRectangle;
        }
    }
}
