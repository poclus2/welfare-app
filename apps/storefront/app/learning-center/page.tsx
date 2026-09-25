import LearningCenterClient from "./LearningCenterClient";

export const revalidate = 60;

async function getPosts() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/blog`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function LearningCenterPage() {
  const posts = await getPosts();
  return <LearningCenterClient posts={posts} />;
}
