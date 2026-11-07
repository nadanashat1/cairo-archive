// ============================================================================
// عميل Supabase: عنوان المشروع والمفتاح العام (publishable) فقط.
// المفتاح ده آمن يظهر في المتصفح — حماية البيانات كلها على السيرفر بسياسات
// Row Level Security. مفيش أي مفتاح service/secret في الكود خالص.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://empdjdcqwojbjppmsxgt.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_o8EJcIIyWM0mHwFVuO5JLw_JnXuLw2J';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
