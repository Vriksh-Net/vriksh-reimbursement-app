import { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

const createEmployee = async (req: NextApiRequest, res: NextApiResponse) => {
  const { email, password, fullName, department } = req.body;

  try {
    // Insert into employees table
    const { data: user, error: userError } = await supabase
      // .from("employees")
      .from("users")
      .insert({
        email,
        role: "employee", // or another appropriate role value
        password,
        full_name: fullName,
        department,
      })
      .select()
      .single();

       const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .insert({
        email,
        password,
        full_name: fullName,
        department,
      })
      .select()
      .single();

    // Check for errors or missing user.id
    if (userError || !user || !user.id) {
      throw (
        userError || new Error("User creation failed or user.id is missing")
      );
    }
    
    // Check for errors or missing employee.id
    if (employeeError || !employee || !employee.id) {
      throw (
        employeeError || new Error("Employee creation failed or employee.id is missing")
      );
    }

    res.status(201).json({ message: "Employee created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create employee" });
  }
};

export default createEmployee;
