const { execSync } = require('child_process');

function setVercelEnv(key, value) {
    console.log(`Setting ${key}...`);
    try {
        // Remove first (ignore error)
        try {
            execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
        } catch (e) { }

        // Add using echo to bypass sensitive prompt
        // Vercel CLI version might vary, but standard 'npx vercel env add key env value' works often
        // If it prompts for sensitive, we just say 'n' via stdin
        execSync(`echo n | npx vercel env add ${key} production ${value}`, { stdio: 'inherit', shell: 'cmd.exe' });
        console.log(`Successfully set ${key}`);
    } catch (error) {
        console.error(`Failed to set ${key}: ${error.message}`);
    }
}

setVercelEnv('NEXTAUTH_URL', 'https://character-commu.vercel.app');
setVercelEnv('AUTH_SECRET', 'YTPrPc1YOA7pstTn5uhWEIhAxU+0uAg3XgJK5a62pqY=');
setVercelEnv('DATABASE_URL', 'postgresql://postgres.ahfasvvnrxtvpesfilxw:yf3xoHKXaRd2qe79@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1');
setVercelEnv('GEMINI_API_KEY', 'AIzaSyDQ0KSIXNOev6q5TKH7rd6mHy5omTx6LhM');
