import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Profile({ session }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    region: '',
    bio: '',
    school_name: '',
    diploma_url: '',
    test_score: '',
    portfolio_url: '',
  });

  // Sertifikatlar ro'yxati (JSONB)
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const { user } = session;

      let { data, error, status } = await supabase
        .from('profiles')
        .select(`full_name, phone, region, bio, school_name, diploma_url, test_score, certificates, portfolio_url`)
        .eq('id', user.id)
        .single();

      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          region: data.region || '',
          bio: data.bio || '',
          school_name: data.school_name || '',
          diploma_url: data.diploma_url || '',
          test_score: data.test_score || '',
          portfolio_url: data.portfolio_url || '',
        });
        setCertificates(data.certificates || []);
      }
    } catch (error) {
      console.error('Profilni yuklashda xato:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Sertifikat qo'shish
  const addCertificate = () => {
    setCertificates([...certificates, { title: '', score: '', file_url: '' }]);
  };

  // Sertifikatni o'chirish
  const removeCertificate = (index) => {
    const updated = certificates.filter((_, i) => i !== index);
    setCertificates(updated);
  };

  // Sertifikat qiymatlarini o'zgartirish
  const handleCertChange = (index, field, value) => {
    const updated = [...certificates];
    updated[index][field] = value;
    setCertificates(updated);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function updateProfile(e) {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const { user } = session;

      const updates = {
        id: user.id,
        full_name: formData.full_name,
        phone: formData.phone,
        region: formData.region,
        bio: formData.bio,
        school_name: formData.school_name,
        diploma_url: formData.diploma_url,
        test_score: formData.test_score ? parseFloat(formData.test_score) : null,
        certificates: certificates,
        portfolio_url: formData.portfolio_url,
        updated_at: new Date(),
      };

      let { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;
      setMessage("Ma'lumotlar va hujjatlar muvaffaqiyatli saqlandi!");
    } catch (error) {
      setMessage('Xatolik yuz berdi: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-600 font-medium">Profil yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto my-8 p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold mb-1 text-gray-800">Abituriyent Profili</h2>
      <p className="text-sm text-gray-500 mb-6">
        Universitetlarga ariza topshirish uchun profil va hujjatlaringizni to'ldiring.
      </p>

      {message && (
        <div className={`p-4 mb-6 text-sm rounded-xl font-medium ${message.includes('Xatolik') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={updateProfile} className="space-y-8">
        
        {/* 1. SHAXSIY MA'LUMOTLAR */}
        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 space-y-4">
          <h3 className="text-lg font-semibold text-indigo-900 border-b pb-2">1. Shaxsiy Ma'lumotlar (Majburiy)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
              <input
                type="text"
                value={session?.user?.email || ''}
                disabled
                className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Ism va Familiya *</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="masalan: Ali Valiyev"
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus
