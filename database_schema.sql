-- ==============================================================================
-- UniGoh (unigoh.uz) — Markazlashgan EdTech Platformasi Database Arxitekturasi
-- Supabase (PostgreSQL 15+) & Row Level Security (RLS) Schema
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. UNIVERSITIES TABLE (Hamkor Nodavlat OTMlar)
CREATE TABLE IF NOT EXISTS public.universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE, -- Masalan: ISFT, AIPI, KU, EMU, NIU
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL, -- Andijon, Farg'ona, Namangan, Toshkent
    city VARCHAR(255) NOT NULL,
    local_rank INTEGER DEFAULT 1,
    rating_score NUMERIC(3, 1) DEFAULT 9.5,
    qs_stars INTEGER DEFAULT 4,
    accreditation_license VARCHAR(100),
    tuition_min BIGINT NOT NULL, -- Masalan: 14000000
    tuition_max BIGINT NOT NULL, -- Masalan: 22000000
    tariff_tier VARCHAR(50) DEFAULT 'Paket B (Premium)', -- 'Paket A (Standard)' | 'Paket B (Premium)'
    grant_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PROFILES TABLE (Abituriyentlar Shaxsiy Ma'lumotlari - AES-256 va O'RQ-547 ga muvofiq)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    jshshir VARCHAR(14) NOT NULL UNIQUE, -- 14 xonali PINFL
    phone VARCHAR(30) NOT NULL,
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    target_major VARCHAR(255),
    passport_file_url TEXT,
    diploma_file_url TEXT,
    is_ocr_verified BOOLEAN DEFAULT FALSE,
    ocr_confidence VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CERTIFICATES TABLE (CEFR, IELTS, TOEFL, SAT va Xalqaro Sertifikatlar)
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- CEFR, IELTS, TOEFL, Duolingo, TOPIK, SAT
    level_score VARCHAR(50) NOT NULL, -- B2 (72), Band 6.5, 1250
    certificate_number VARCHAR(100),
    issue_date DATE,
    file_url TEXT,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TEST SCORES TABLE (Bilimni Baholash Agentligi DTM & OTM Natijalari)
CREATE TABLE IF NOT EXISTS public.test_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    dtm_score NUMERIC(5, 1), -- Masalan: 142.8
    dtm_max_score NUMERIC(5, 1) DEFAULT 189.0,
    dtm_year VARCHAR(10) DEFAULT '2026',
    dtm_sheet_file_url TEXT,
    internal_uni_score VARCHAR(100), -- Masalan: 92 ball (O'tdi)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. APPLICATIONS TABLE (Arizalar, Attribution ID va QR Vaucher)
CREATE TABLE IF NOT EXISTS public.applications (
    id VARCHAR(50) PRIMARY KEY, -- Masalan: UNIGOH-2026-ISFT-0894
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
    program_name VARCHAR(255) NOT NULL,
    degree VARCHAR(50) DEFAULT 'Bakalavr',
    applicant_name VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50) NOT NULL,
    applicant_pinfl VARCHAR(14) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', 
    -- 'PENDING' | 'IN_REVIEW' | 'EXAM_SCHEDULED' | 'APPROVED' | 'CONTRACT_ISSUED' | 'REJECTED'
    exam_date VARCHAR(100),
    grant_applied BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. AUDIT LOGS TABLE (Anti-Bypass Nazorat Tizimi)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id VARCHAR(50) REFERENCES public.applications(id),
    university_id UUID REFERENCES public.universities(id),
    applicant_phone VARCHAR(50),
    reported_status VARCHAR(50), -- OTM tomonidan bildirilgan: 'REJECTED' | 'UNPAID'
    verified_status VARCHAR(50), -- Audit qo'ng'irog'i natijasi: 'CONFIRMED_PAID' | 'REALLY_REJECTED'
    commission_earned BIGINT DEFAULT 1500000, -- 1.5 mln so'm
    audited_by VARCHAR(100) DEFAULT 'Founder (komilovv77)',
    audited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Abituriyent faqat o'z profilini ko'ra oladi
CREATE POLICY "Student read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Abituriyent faqat o'z arizalarini ko'ra oladi
CREATE POLICY "Student read own applications" ON public.applications
    FOR SELECT USING (auth.uid() = profile_id);

-- OTM qabul komissiyasi faqat o'z universitetiga kelgan arizalarni ko'ra oladi
CREATE POLICY "University CRM read their applications" ON public.applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.universities u 
            WHERE u.id = applications.university_id 
            AND auth.jwt()->>'role' = 'university_admin'
        )
    );

-- Platforma Asoschisi (komilovv77 / super_admin) barcha ma'lumotlarni to'liq boshqara oladi
CREATE POLICY "Master Admin full access" ON public.applications
    FOR ALL USING (auth.jwt()->>'role' = 'master_admin');
