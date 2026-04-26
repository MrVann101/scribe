const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function test() {
  console.log("Testing insert into sessions...");
  // We'll just try to select first
  const { data, error } = await supabase.from('sessions').select('*').limit(1);
  if (error) {
    console.error("Select Error:", error);
  } else {
    console.log("Select Success:", data);
  }

  // Test insert with a dummy UUID
  const { data: iData, error: iError } = await supabase.from('sessions').insert({
    user_id: '00000000-0000-0000-0000-000000000000',
    title: 'Test',
    source: 'recording',
    status: 'recording'
  }).select();
  
  if (iError) {
    console.error("Insert Error:", iError);
  } else {
    console.log("Insert Success:", iData);
    // clean up
    await supabase.from('sessions').delete().eq('id', iData[0].id);
  }
}

test();
