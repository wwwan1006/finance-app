import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ititcwenscxkvdkgdycc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0aXRjd2Vuc2N4a3Zka2dkeWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MDgyNTEsImV4cCI6MjA5NjM4NDI1MX0.AenbGKQMnsDiapA9H1dGfHE131RQyvler43FclUe5zE'

export const supabase = createClient(supabaseUrl, supabaseKey)
