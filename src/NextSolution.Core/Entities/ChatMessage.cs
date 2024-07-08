using NextSolution.Core.Shared;

namespace NextSolution.Core.Entities
{
    public class ChatMessage : IEntity
    {
        public virtual Chat Chat { get; set; } = default!;

        public long ChatId { get; set; }

        public long? ParentId { get; set; }

        public ChatMessage? Parent { get; set; } = default!;

        public long Id { get; set; }

        public ChatMessageRole Role { get; set; } = default!;

        public string Content { get; set; } = default!;

        public DateTimeOffset CreatedAt { get; set; }

        public DateTimeOffset UpdatedAt { get; set; }
    }

    public enum ChatMessageRole
    {
        User,
        Assistant,
        System
    }
}