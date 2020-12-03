﻿using GraphQL;
using GraphQL.Types;
using ReviewsRatings.Models;
using ReviewsRatings.Services;

namespace ReviewsRatings.GraphQL.Types
{
    [GraphQLMetadata("AppSettings")]
    public class AppSettingsType : ObjectGraphType<AppSettings>
    {
        public AppSettingsType(IProductReviewService productReviewService)
        {
            Name = "AppSettings";

            Field(b => b.AllowAnonymousReviews).Description("Indicates whether anonymous reviews are allowed.");
            Field(b => b.RequireApproval).Description("Indicates whether reviews require approval.");
            Field(b => b.UseLocation).Description("Indicates whether to use Location field.");
            Field(b => b.defaultOpen).Description("Indicates whether reviews should expand by default");
            Field(b => b.defaultOpenCount).Description("Indicates number of reviews to be expanded by default");
            Field(b => b.showGraph).Description("Show the reviews graph on product page");
            Field(b => b.displaySummaryIfNone).Description("Display stars in product-rating-summary if there are no reviews");
            Field(b => b.displaySummaryTotalReviews).Description("Display total reviews number on product-rating-summary block");
            Field(b => b.displaySummaryAddButton).Description("Display `Add review` button on product-rating-summary block");
        }
    }
}
