import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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

  const addCertificate = () => {
    setCertificates([...certificates, { title: '', score: '', file_url: '' }]);
  };

  const removeCertificate = (index) => {
    const updated = certificates.filter((_, i) => i !== index);
    setCertificates(updated);
  };

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
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Telefon raqam *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+998 90 123 45 67"
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Viloyat / Shahar *</label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                placeholder="masalan: Toshkent sh."
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">O'zingiz haqida qisqacha (Bio)</label>
            <textarea
              name="bio"
              rows="2"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Qiziqishlaringiz, maqsadlaringiz haqida qisqacha yozing..."
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            ></textarea>
          </div>
        </div>

        {/* 2. TA'LIM VA SHAHODATNOMA */}
        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 space-y-4">
          <h3 className="text-lg font-semibold text-indigo-900 border-b pb-2">2. Ta'lim va Shahodatnoma (Majburiy)</h3>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Maktab / Litsey / Kollej nomi *</label>
            <input
              type="text"
              name="school_name"
              value={formData.school_name}
              onChange={handleChange}
              placeholder="masalan: Toshkent shahar 21-maktab"
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Shahodatnoma / Attestat / Diplom fayl havolasi (URL)</label>
            <input
              type="url"
              name="diploma_url"
              value={formData.diploma_url}
              onChange={handleChange}
              placeholder="https://drive.google.com/... yoki fayl havolasi"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* 3. DTM / OTM BALLI */}
        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 space-y-4">
          <h3 className="text-lg font-semibold text-indigo-900 border-b pb-2">3. Imtihon Ballari (Ixtiyoriy)</h3>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">DTM / OTM Kirish imtihoni bali</label>
            <input
              type="number"
              step="0.1"
              name="test_score"
              value={formData.test_score}
              onChange={handleChange}
              placeholder="masalan: 145.8"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* 4. SERTIFIKATLAR */}
        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-lg font-semibold text-indigo-900">4. Sertifikatlar (Til va Fanlar)</h3>
            <button
              type="button"
              onClick={addCertificate}
              className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition"
            >
              + Sertifikat qo'shish
            </button>
          </div>

          {certificates.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Hozircha sertifikatlar qo'shilmadi. IELTS, CEFR yoki milliy sertifikatlaringiz bo'lsa qo'shing.</p>
          ) : (
            certificates.map((cert, index) => (
              <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">Sertifikat #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeCertificate(index)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    O'chirish
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Sertifikat nomi (masalan: IELTS, CEFR Matematika)"
                    value={cert.title}
                    onChange={(e) => handleCertChange(index, 'title', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-xs outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Ball (masalan: 7.0 yoki B2)"
                    value={cert.score}
                    onChange={(e) => handleCertChange(index, 'score', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-xs outline-none focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    placeholder="Fayl havolasi (URL)"
                    value={cert.file_url}
                    onChange={(e) => handleCertChange(index, 'file_url', e.target.value)}
                    className="p-2 border border-gray-300 rounded text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* 5. PORTFOLIO */}
        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100 space-y-4">
          <h3 className="text-lg font-semibold text-indigo-900 border-b pb-2">5. Portfolio va Yutuqlar (Ixtiyoriy)</h3>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Portfolio / Github / Shaxsiy loyihalar havolasi</label>
            <input
              type="url"
              name="portfolio_url"
              value={formData.portfolio_url}
              onChange={handleChange}
              placeholder="https://myportfolio.com yoki https://github.com/username"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition duration-200 disabled:opacity-50"
        >
          {saving ? 'Saqlanmoqda...' : 'Barcha ma\'lumotlarni saqlash'}
        </button>
      </form>
    </div>
  );
}
