import { NextResponse } from "next/server";
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

function readPosts(): BlogPost[] {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
      fs.writeFileSync(DATA_PATH, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writePosts(posts: BlogPost[]) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const adminKey = request.headers.get("x-admin-key");
  const isAdmin = adminKey === (process.env.ADMIN_BLOG_KEY || "welfare-admin-2024");

  const posts = readPosts();
  const result = (all && isAdmin) ? posts : posts.filter(p => p.published);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const adminKey = request.headers.get("x-admin-key");
  if (adminKey !== (process.env.ADMIN_BLOG_KEY || "welfare-admin-2024")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const posts = readPosts();
  const now = new Date().toISOString();
  
  const slug = body.slug || body.title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const newPost: BlogPost = {
    id: Date.now().toString(),
    slug,
    title: body.title || "Sans titre",
    summary: body.summary || "",
    content: body.content || "",
    category: body.category || "Skincare",
    coverImage: body.coverImage || "",
    author: body.author || "The Welfare",
    readingTime: body.readingTime || Math.max(1, Math.ceil((body.content || "").split(" ").length / 200)),
    published: body.published || false,
    createdAt: now,
    updatedAt: now,
    tags: body.tags || [],
  };

  posts.unshift(newPost);
  writePosts(posts);
  return NextResponse.json(newPost, { status: 201 });
}
