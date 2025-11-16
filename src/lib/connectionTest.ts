import { supabase } from './supabase';

export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const { data, error } = await supabase.from('courses').select('count', { count: 'exact', head: true });

    if (error) {
      console.warn('⚠️ Supabase connection test failed:', error.message);
      return {
        success: false,
        message: 'Connection test failed',
        details: error,
      };
    }

    console.log('✅ Supabase connection test successful');
    return {
      success: true,
      message: 'Successfully connected to Supabase',
      details: { data },
    };
  } catch (error: any) {
    console.error('❌ Supabase connection test error:', error);
    return {
      success: false,
      message: 'Failed to connect to Supabase',
      details: error,
    };
  }
}
