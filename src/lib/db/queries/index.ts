import { subscriptionActivityLogQueries } from "./activity-log";
import { analyticsQueries } from "./analytics";
import { budgetQueries } from "./budget";
import { paymentSourceQueries } from "./payment-source";
import { subscriptionQueries } from "./subscription";
import { subscriptionCategoryQueries } from "./subscription-category";
import { userQueries } from "./user";

export const queries = {
    user: userQueries,
    subscription: subscriptionQueries,
    subscriptionCategory: subscriptionCategoryQueries,
    paymentSource: paymentSourceQueries,
    budget: budgetQueries,
    activityLog: subscriptionActivityLogQueries,
    analytics: analyticsQueries,
};
