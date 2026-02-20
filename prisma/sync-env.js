const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function syncEnv() {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');

    const envs = [];
    for (const line of lines) {
        const match = line.match(/^([^#\s][^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let val = match[2].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
            }
            if (key && val) envs.push({ key, val });
        }
    }

    // Add AUTH_SECRET
    try {
        const authSecret = lines.find(l => l.includes('NEXTAUTH_SECRET=')).split('=')[1].trim().replace(/['"]/g, '');
        envs.push({ key: 'AUTH_SECRET', val: authSecret });
    } catch (e) { }

    for (const { key, val } of envs) {
        console.log(`Setting ${key}...`);

        // Remove first
        try {
            await new Promise((resolve) => {
                const rm = spawn('npx', ['vercel', 'env', 'rm', key, 'production', '-y'], { shell: true });
                rm.on('close', resolve);
            });
        } catch (e) { }

        // Add
        await new Promise((resolve) => {
            const add = spawn('npx', ['vercel', 'env', 'add', key, 'production'], { shell: true });

            add.stdout.on('data', (data) => {
                const output = data.toString();
                if (output.includes('Enter value') || output.includes('Value:')) {
                    add.stdin.write(val + '\n');
                }
                if (output.includes('Mark as sensitive')) {
                    add.stdin.write('n\n');
                }
            });

            add.stderr.on('data', (data) => {
                const output = data.toString();
                // Some versions output prompt to stderr
                if (output.includes('Enter value') || output.includes('Value:')) {
                    add.stdin.write(val + '\n');
                }
                if (output.includes('Mark as sensitive')) {
                    add.stdin.write('n\n');
                }
            });

            add.on('close', resolve);

            // Just in case, try writing value immediately if the CLI supports it
            // but the interactive mode usually waits. 
            // In case it's prompt-less, we'll see.
        });
    }
}

syncEnv().then(() => console.log('Done!'));
