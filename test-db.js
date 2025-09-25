import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

console.log('🔍 Testing database connection...');

try {
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log('Test result:', result);
} catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
}
