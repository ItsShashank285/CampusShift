import JobForm from "../../JobForm";

export default async function EditBusinessJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <JobForm jobId={id} />;
}
