  import { NextApiRequest, NextApiResponse } from "next";
  import { supabase } from "@/lib/supabase";

  export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { email, password } = req.body;

    // Find employee with matching email and password
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    if (error || !data) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Optionally, don't return password in response
    const { password: _, ...employee } = data;

    return res.status(200).json(employee);
  }
