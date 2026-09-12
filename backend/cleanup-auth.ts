import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function run() {
  console.log('Fetching auth.users...');
  const { data: authData, error: authError } = await admin.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  console.log(`Found ${authData.users.length} users in auth system.`);
  
  console.log('Fetching public.users...');
  const { data: publicUsers, error: publicError } = await admin.from('users').select('id, email');
  if (publicError) {
    console.error('Error fetching public users:', publicError);
    return;
  }
  
  console.log(`Found ${publicUsers.length} users in public database.`);
  
  const publicUserIds = new Set(publicUsers.map(u => u.id));
  
  let deletedCount = 0;
  for (const user of authData.users) {
    if (!publicUserIds.has(user.id)) {
      console.log(`Deleting orphaned user: ${user.email} (ID: ${user.id})`);
      await admin.auth.admin.deleteUser(user.id);
      deletedCount++;
    }
  }
  
  console.log(`Cleanup complete! Deleted ${deletedCount} stuck accounts.`);
}

run();
