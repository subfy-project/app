import type { Metadata } from "next";

export function generateMetadata({
  params,
}: {
  params: { projectId: string };
}): Metadata {
  return {
    title: `Project ${params.projectId}`,
    alternates: {
      canonical: `/subscribe/${params.projectId}`,
    },
  };
}

export default function SubscribeProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
