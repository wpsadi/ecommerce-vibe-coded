import { env } from "@/env";
import { put } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		if (!env.BLOB_READ_WRITE_TOKEN) {
			return NextResponse.json(
				{
					error:
						"Vercel Blob is not configured. Please set BLOB_READ_WRITE_TOKEN environment variable.",
				},
				{ status: 500 },
			);
		}

		const { searchParams } = new URL(request.url);
		const filename = searchParams.get("filename");

		if (!filename) {
			return NextResponse.json(
				{ error: "Filename is required" },
				{ status: 400 },
			);
		}

		if (!request.body) {
			return NextResponse.json(
				{ error: "Request body is required" },
				{ status: 400 },
			);
		}

		// Upload to Vercel Blob
		const blob = await put(filename, request.body, {
			access: "public",
			token: env.BLOB_READ_WRITE_TOKEN,
		});

		return NextResponse.json({
			url: blob.url,
			pathname: blob.pathname,
		});
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 },
		);
	}
}
