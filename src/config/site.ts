export const siteConfig: SiteConfig = {
    name: "Subscription Tracker",
    description: "Automate your subscription management with ease.",
    longDescription:
        "Subscription Tracker is a powerful tool designed to help you manage and track your subscriptions efficiently. With an intuitive interface and robust features, you can save time and stay on top of your subscriptions.",
    category: "Productivity",
    og: {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
    },
    developer: {
        name: "DRVGO",
        url: "https://itsdrvgo.me",
    },
    keywords: ["Subscription Tracker", "Automation", "Productivity", "Tools"],
    contact: "thedragoluca@gmail.com",
    sidebar: [
        {
            title: "Overview",
            url: "/dashboard",
            icon: "LayoutDashboard",
            items: [
                {
                    title: "Dashboard",
                    url: "/dashboard",
                },
                {
                    title: "Activity",
                    url: "/dashboard/activity",
                },
            ],
        },
        {
            title: "Subscriptions",
            url: "/subscriptions",
            icon: "Receipt",
            items: [
                {
                    title: "All subscriptions",
                    url: "/subscriptions",
                },
                {
                    title: "Add subscription",
                    url: "/subscriptions/create",
                },
                {
                    title: "Categories",
                    url: "/subscriptions/categories",
                },
            ],
        },
        {
            title: "Billing",
            url: "/billing",
            icon: "Wallet",
            items: [
                {
                    title: "Payment sources",
                    url: "/billing/payment-sources",
                },
                {
                    title: "Budget",
                    url: "/billing/budget",
                },
            ],
        },
    ],
};
