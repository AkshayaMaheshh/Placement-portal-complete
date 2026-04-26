async function test() {
    try {
        const rand = Date.now();
        const email = `admin${rand}@example.com`;
        
        // 1. Register Admin
        const regRes = await fetch('http://localhost:8081/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Admin', email, password: 'password', role: 'ADMIN' })
        });
        console.log('Register status:', regRes.status);
        
        // 2. Login
        const loginRes = await fetch('http://localhost:8081/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'password' })
        });
        const loginData = await loginRes.json();
        console.log('Login token:', loginData.token ? 'Success' : 'Failed');
        
        // 3. Fetch Dashboard
        const dashRes = await fetch('http://localhost:8081/api/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });
        
        if (!dashRes.ok) {
            console.log('Dashboard failed with status:', dashRes.status);
            console.log('Response:', await dashRes.text());
        } else {
            const dashData = await dashRes.json();
            console.log('Dashboard data:', JSON.stringify(dashData, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}

test();
