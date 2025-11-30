const BASE_URL = "http://localhost:3001/api/compat";

(async () => {
  try {
    console.log("=== 1. Manager Login ===");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "pujarivenkey18@gmail.com",
        password: "Venkey@1729"
      })
    });
    const loginData = await loginRes.json();
    console.log("Login response:", loginData);
    const token = loginData.token;

    if (!token) {
      console.error("Failed to get token!");
      return;
    }

    console.log("\n=== 2. Add Employee ===");
    const addRes = await fetch(`${BASE_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        name: "Test Employee",
        email: "testemployee@company.com",
        department: "Engineering",
        password: "TestPass123"
      })
    });
    const addData = await addRes.json();
    console.log("Add employee response:", addData);

    console.log("\n=== 3. Get All Employees ===");
    const listRes = await fetch(`${BASE_URL}/employees`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const listData = await listRes.json();
    console.log("All employees:", listData.map(e => ({ name: e.name, email: e.email, role: e.role })));

    console.log("\n=== 4. Try Login as New Employee ===");
    const empLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "testemployee@company.com",
        password: "TestPass123"
      })
    });
    const empLoginData = await empLoginRes.json();
    console.log("Employee login response:", empLoginData);

  } catch (err) {
    console.error("ERROR:", err.message);
  }
})();
