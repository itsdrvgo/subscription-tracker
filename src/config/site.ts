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
            title: "Getting Started",
            url: "/getting-started",
            icon: "House",
            items: [
                {
                    title: "Installation",
                    url: "/getting-started/installation",
                },
                {
                    title: "Quick Start Guide",
                    url: "/getting-started/quick-start",
                },
            ],
        },
        {
            title: "Features",
            url: "/features",
            icon: "House",
            items: [
                {
                    title: "Post Scheduler",
                    url: "/features/post-scheduler",
                },
                {
                    title: "Comment Manager",
                    url: "/features/comment-manager",
                },
            ],
        },
    ],
};
