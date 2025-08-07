import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { secretsManager } from './secretsManager';

neonConfig.webSocketConstructor = ws;

// Get DATABASE_URL from environment or secrets manager
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  // Try to get from secrets manager
  databaseUrl = secretsManager.getSecret('DATABASE_URL');
}

if (!databaseUrl) {
  console.error('\n' + secretsManager.generateSetupInstructions());
  console.error('\n⚠️  DATABASE_URL not found. This error means:');
  console.error('1. You need to create a Neon database at https://neon.tech');
  console.error('2. Enable the database endpoint in your Neon dashboard');
  console.error('3. Copy the connection string and set it as DATABASE_URL');
  console.error('\nTo fix this error:');
  console.error('• Go to https://neon.tech and create a free database');
  console.error('• In the Neon dashboard, make sure your database endpoint is enabled');
  console.error('• Copy the connection string (postgresql://...)');
  console.error('• Create a .secrets file with: DATABASE_URL=your_connection_string');
  console.error('• Or set the environment variable: $env:DATABASE_URL="your_connection_string"');
  
  throw new Error(
    "DATABASE_URL must be set. Please check the setup instructions above."
  );
}

// Save to secrets for future use
if (databaseUrl && !secretsManager.hasSecret('DATABASE_URL')) {
  secretsManager.setSecret('DATABASE_URL', databaseUrl);
}

// Create database connection with error handling
let pool: Pool;
let db: ReturnType<typeof drizzle>;

try {
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
  
  console.log('✅ Database connection configured successfully');
} catch (error: any) {
  console.error('\n❌ Database connection failed:');
  console.error('Error:', error.message);
  
  if (error.message.includes('endpoint has been disabled')) {
    console.error('\n🔧 This error means your Neon database endpoint is disabled.');
    console.error('To fix this:');
    console.error('1. Go to https://console.neon.tech');
    console.error('2. Select your database project');
    console.error('3. Go to the "Settings" tab');
    console.error('4. In the "Compute" section, click "Enable" to activate your endpoint');
    console.error('5. Wait a few minutes for the endpoint to start');
    console.error('6. Restart your application');
  }
  
  throw error;
}

export { pool, db };