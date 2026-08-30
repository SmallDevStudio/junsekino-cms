import MessageWindowViewer from "@/components/admin/message/MessageWindowViewer";

export const metadata = {
  title: "Message | Junsekino CMS",
};

export default async function AdminMessageWindowPage({ params }) {
  const resolvedParams = await params;

  return <MessageWindowViewer submissionId={resolvedParams.submissionId} />;
}
