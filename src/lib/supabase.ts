import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nncdgrlafijlxjsbgrhz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uY2RncmxhZmlqbHhqc2Jncmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjA5MjIsImV4cCI6MjA4ODczNjkyMn0.aNWtdV1CDCHsewkFfJ7154PuXCZXR0MbOpbD5ltrQkY'
export const supabase = createClient(supabaseUrl, supabaseKey)
