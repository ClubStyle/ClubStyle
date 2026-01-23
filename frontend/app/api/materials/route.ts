import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'materials.json');

export async function GET() {
  try {
    const fileContents = await fs.promises.readFile(dataPath, 'utf8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading materials data:", error);
    // Fallback or empty array if file missing
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // Validate basic structure if needed
        if (!Array.isArray(body)) {
             return NextResponse.json({ error: 'Data must be an array' }, { status: 400 });
        }
        await fs.promises.writeFile(dataPath, JSON.stringify(body, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error writing materials data:", error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
