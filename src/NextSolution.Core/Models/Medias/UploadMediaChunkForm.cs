﻿using Microsoft.Extensions.Options;
using NextSolution.Core.Extensions.FileStorage;

namespace NextSolution.Core.Models.Medias
{
    public class UploadMediaChunkForm : UploadMediaContentForm
    {
        public long Id { get; set; }

        public long Offset { get; set; }
    }

    public class UploadMediaChunkFormValidator : UploadMediaContentFormValidator<UploadMediaChunkForm>
    {
        public UploadMediaChunkFormValidator(IOptions<FileRuleOptions> fileTypeOptions) : base(fileTypeOptions)
        {
        }
    }
}
