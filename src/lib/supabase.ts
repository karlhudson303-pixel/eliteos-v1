import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://nuhjdtxurnuwivmqpzql.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjQzY2Q4MTM4LTU0ODctNDdiMC05MzgyLTAyOWI1MzQ2MjIwMiJ9.eyJwcm9qZWN0SWQiOiJudWhqZHR4dXJudXdpdm1xcHpxbCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY5MzUyMjYyLCJleHAiOjIwODQ3MTIyNjIsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.C-jRyibm2qxso8SdsEPCTx1vQDX71ClQXBTxM0cL35c';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };