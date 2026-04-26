async function test() {
    try {
        const rand = Date.now();
        const email = `admin${rand}@example.com`;
        
        const regRes = await fetch('http://localhost:8081/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Admin', email, password: 'password', role: 'ADMIN' })
        });
        
        const loginRes = await fetch('http://localhost:8081/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password' })
        });
        const loginData = await loginRes.json();
        
        const dashRes = await fetch('http://localhost:8081/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        
        const dashData = await dashRes.json();
        console.log(`totalStudents: ${dashData.totalStudents}`);
        console.log(`students length: ${dashData.students.length}`);
        console.log(`totalCompanies: ${dashData.totalCompanies}`);
        console.log(`companies length: ${dashData.companies.length}`);
        console.log(`applications length: ${dashData.applications.length}`);
    } catch (e) {
        console.error(e);
    }
}
test();
