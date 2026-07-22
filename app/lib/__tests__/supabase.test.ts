import { getSupabaseClient, validateSupabaseEnv, __resetClientForTests } from '../supabase';

describe('getSupabaseClient', () => {
  beforeEach(() => {
    __resetClientForTests();
    process.env['EXPO_PUBLIC_SUPABASE_URL'] = 'https://example.supabase.co';
    process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] = 'test-key';
  });

  it('returns the same client instance on repeated calls', () => {
    const a = getSupabaseClient();
    const b = getSupabaseClient();
    expect(a).toBe(b);
  });

  it('throws a clear error if the URL env var is missing', () => {
    expect(() => validateSupabaseEnv(undefined, 'test-key')).toThrow(/EXPO_PUBLIC_SUPABASE_URL/);
  });

  it('throws a clear error if the anon key env var is missing', () => {
    expect(() => validateSupabaseEnv('https://example.supabase.co', undefined)).toThrow(/EXPO_PUBLIC_SUPABASE_ANON_KEY/);
  });
});
