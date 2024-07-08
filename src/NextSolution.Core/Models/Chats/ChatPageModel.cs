namespace NextSolution.Core.Models.Chats
{
    public class ChatPageModel
    {
        public IList<ChatModel> Items { get; set; } = new List<ChatModel>();

        public long Offset { get; set; }

        public int Limit { get; set; }

        public long Length { get; set; }

        public long? Previous { get; set; }

        public long? Next { get; set; }
    }
}
