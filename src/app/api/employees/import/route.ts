import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { bulkCreateEmployees } from "@/lib/models/employee";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const records: Record<string, string>[] = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const employees = records.map(
      (r) => ({
        name: r.name || r.Name || "",
        email: r.email || r.Email || "",
        phone: r.phone || r.Phone || "",
        department: r.department || r.Department || "",
        position: r.position || r.Position || "",
        manager_email: r.manager_email || r["Manager Email"] || undefined,
        opted_out: false,
      })
    );

    const valid = employees.filter(
      (e: { name: string; email: string }) => e.name && e.email
    );
    if (valid.length === 0) {
      return NextResponse.json(
        { error: "No valid employees found in CSV" },
        { status: 400 }
      );
    }

    const created = await bulkCreateEmployees(valid);
    return NextResponse.json(
      { imported: created.length, employees: created },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
