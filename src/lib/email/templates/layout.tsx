import { ReactNode } from "react";
import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Tailwind,
    Text,
} from "react-email";

type EmailLayoutProps = {
    title: string;
    preview?: string;
    children: ReactNode;
    footerNote?: string;
};

export function EmailLayout({
    title,
    preview,
    children,
    footerNote,
}: EmailLayoutProps) {
    return (
        <Html>
            <Head />
            {preview ? <Preview>{preview}</Preview> : null}
            <Tailwind>
                <Body
                    style={{
                        backgroundColor: "#0b0b0c",
                        color: "#e6e6e6",
                        fontFamily:
                            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                        margin: 0,
                        padding: "32px 16px",
                    }}
                >
                    <Container
                        style={{
                            maxWidth: 600,
                            backgroundColor: "#141416",
                            border: "1px solid #252528",
                            borderRadius: 12,
                            overflow: "hidden",
                            margin: "0 auto",
                        }}
                    >
                        <Section style={{ padding: "32px 32px 0 32px" }}>
                            <Text
                                style={{
                                    margin: 0,
                                    fontSize: 14,
                                    color: "#9ca3af",
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                }}
                            >
                                Subscription Tracker
                            </Text>
                            <Text
                                style={{
                                    margin: "12px 0 0 0",
                                    fontSize: 22,
                                    fontWeight: 600,
                                    color: "#f5f5f5",
                                    lineHeight: 1.3,
                                }}
                            >
                                {title}
                            </Text>
                        </Section>

                        <Section
                            style={{
                                padding: "24px 32px",
                                color: "#d4d4d8",
                                fontSize: 15,
                                lineHeight: 1.65,
                            }}
                        >
                            {children}
                        </Section>

                        <Hr
                            style={{
                                border: "none",
                                borderTop: "1px solid #252528",
                                margin: 0,
                            }}
                        />

                        <Section
                            style={{
                                padding: "20px 32px",
                                backgroundColor: "#101012",
                                color: "#737380",
                                fontSize: 12,
                                lineHeight: 1.6,
                            }}
                        >
                            {footerNote ? (
                                <Text style={{ margin: "0 0 8px 0" }}>
                                    {footerNote}
                                </Text>
                            ) : null}
                            <Text style={{ margin: 0 }}>
                                You&apos;re receiving this because you enabled
                                reminders for one of your subscriptions. Manage
                                notification preferences in your dashboard.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}

export function DetailsTable({
    rows,
}: {
    rows: { label: string; value: string }[];
}) {
    return (
        <table
            role="presentation"
            cellSpacing={0}
            cellPadding={0}
            width="100%"
            style={{ marginTop: 16, borderCollapse: "collapse" }}
        >
            <tbody>
                {rows.map((r) => (
                    <tr key={r.label}>
                        <td
                            style={{
                                padding: "10px 0",
                                borderBottom: "1px solid #1f1f22",
                                color: "#9ca3af",
                                fontSize: 13,
                                width: "40%",
                            }}
                        >
                            {r.label}
                        </td>
                        <td
                            style={{
                                padding: "10px 0",
                                borderBottom: "1px solid #1f1f22",
                                color: "#f5f5f5",
                                fontSize: 14,
                                textAlign: "right",
                            }}
                        >
                            {r.value}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export function PrimaryButton({
    href,
    children,
}: {
    href: string;
    children: ReactNode;
}) {
    return (
        <Section style={{ padding: "0 32px 32px 0", marginTop: 24 }}>
            <a
                href={href}
                style={{
                    display: "inline-block",
                    backgroundColor: "#f5f5f5",
                    color: "#0b0b0c",
                    fontWeight: 600,
                    fontSize: 14,
                    padding: "12px 22px",
                    borderRadius: 8,
                    textDecoration: "none",
                }}
            >
                {children}
            </a>
        </Section>
    );
}
