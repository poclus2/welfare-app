import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = process.env.BLOG_DATA_PATH || path.join(process.cwd(), "data", "blog-posts.json");

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  coverImage: string;
  author: string;
  readingTime: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

function readPosts(): BlogPost[] {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writePosts(posts: BlogPost[]) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2));
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const posts = readPosts();
  const post = posts.find(p => p.id === id || p.slug === id);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey !== (process.env.ADMIN_BLOG_KEY || "welfare-admin-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const posts = readPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = posts[idx]!;
  const updated = {
    ...existing,
    ...body,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
    readingTime: body.readingTime || Math.max(1, Math.ceil((body.content || existing.content || "").split(" ").length / 200)),
  };

  posts[idx] = updated;
  writePosts(posts);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey !== (process.env.ADMIN_BLOG_KEY || "welfare-admin-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const posts = readPosts();
  const filtered = posts.filter(p => p.id !== id);
  writePosts(filtered);
  return NextResponse.json({ success: true });
}
