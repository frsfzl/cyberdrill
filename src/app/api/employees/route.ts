import { NextRequest, NextResponse } from "next/server";
import {
  getEmployees,
  createEmployee,
} from "@/lib/models/employee";

export async function GET() {
  try {
    const employees = await getEmployees();
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, department, position, manager_email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const employee = await createEmployee({
      name,
      email,
      phone: phone || "",
      department: department || "",
      position: position || "",
      manager_email: manager_email || null,
      opted_out: false,
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
