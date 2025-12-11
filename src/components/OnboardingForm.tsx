
import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { UserProfile } from '../types';
import { getText } from '../utils/i18n';

interface OnboardingFormProps {
  onComplete: (profile: UserProfile) => void;
  initialEmail?: string;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({ onComplete, initialEmail }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const text = getText('pt');

  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    email: initialEmail || '',
    birthDate: '',
    gender: 'male',
    height: 170,
    weight: 70,
    activityLevel: 'moderate',
    medicalConditions: '',
    dietaryRestrictions: '',
    country: 'Brasil', 
    state: '',
    language: 'pt',
    hasPaid: false, 
    paymentDate: ''
  });

  useEffect(() => {
    if (initialEmail) {
      setFormData(prev => ({ ...prev, email: initialEmail }));
    }
  }, [initialEmail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null); 
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let v = e.target.value.replace(/\D/g, ''); 
      if (v.length > 8) v = v.slice(0, 8); 

      if (v.length > 4) {
          v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
      } else if (v.length > 2) {
          v = `${v.slice(0, 2)}/${v.slice(2)}`;
      }

      setFormData(prev => ({ ...prev, birthDate: v }));
      if (error) setError(null);
  };

  const isValidEmail = (email: string) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  
  const isValidAge = (dateString: string) => {
      if(!dateString || dateString.length < 10) return false;
      const parts = dateString.split('/');
      if (parts.length !== 3) return false;
      
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);

      const birth = new Date(year, month, day);
      const now = new Date();
      
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
          age--;
      }
      return age >= 18;
  };

  const validateStep = (currentStep: number): boolean => {
      switch(currentStep) {
          case 1:
              if (!formData.name || formData.name.trim().length < 3) {
                  setError("Nome muito curto (mínimo 3 letras).");
                  return false;
              }
              if (!isValidEmail(formData.email)) {
                  setError(text.validation.invalidEmail);
                  return false;
              }
              return true;
          case 2:
              if (!formData.birthDate || !formData.weight || !formData.height) {
                  setError(text.validation.fillAll);
                  return false;
              }
              if (!isValidAge(formData.birthDate)) {
                  setError(text.validation.invalidAge);
                  return false;
              }
              if (formData.weight <= 30 || formData.weight > 300) {
                   setError(text.validation.invalidWeight);
                   return false;
              }
              if (formData.height <= 100 || formData.height > 250) {
                   setError(text.validation.invalidHeight);
                   return false;
              }
              return true;
          case 3: 
               if (!formData.state || formData.state.length < 2) {
                   setError("Por favor, digite seu Estado.");
                   return false;
               }
              return true;
          case 4:
              return true; 
          default: 
              return true;
      }
  }

  const nextStep = () => {
    if (!validateStep(step)) return;
    window.scrollTo(0,0);
    setStep(s => s + 1);
  };
  
  const prevStep = () => {
    window.scrollTo(0,0);
    setStep(s => s - 1);
    setError(null);
  };
  
  const jumpToStep = (s: number) => {
      setStep(s);
      setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 5) {
      nextStep();
    } else {
      setLoading(true);
      // Ensure we call onComplete which triggers App.tsx to change step
      setTimeout(() => {
          onComplete(formData);
          setLoading(false);
      }, 500);
    }
  };

  const steps = [
    { id: 1, label: text.onboarding.step1, title: text.onboarding.title1 },
    { id: 2, label: text.onboarding.step2, title: text.onboarding.title2 },
    { id: 3, label: text.onboarding.step3, title: text.onboarding.title3 },
    { id: 4, label: text.onboarding.step4, title: text.onboarding.title4 },
    { id: 5, label: text.onboarding.step5, title: text.onboarding.title5 },
  ];

  const currentStepInfo = steps.find(s => s.id === step) || steps[0];

  const getInputClass = (isValid: boolean, value: string | number) => {
      const base = "w-full px-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all text-gray-900 bg-white ";
      if (!value) return base + "border-gray-200 focus:ring-pink-500";
      return isValid 
        ? base + "border-green-400 focus:ring-green-500" 
        : base + "border-red-300 focus:ring-red-500";
  };

  return (
    <div className="max-w-3xl mx-auto pt-24 pb-12 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">{currentStepInfo.title}</h2>
            <span className="text-sm font-medium text-gray-500">
                {step} / 5
            </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
            {steps.map(s => (
                <div 
                    key={s.id}
                    className={`h-full transition-all duration-500 ${s.id <= step ? 'bg-gradient-to-r from-pink-500 to-orange-400' : 'bg-transparent'}`}
                    style={{ width: '20%' }}
                ></div>
            ))}
        </div>
        <div className="flex justify-between mt-2 px-1">
            {steps.map(s => (
                <div 
                    key={s.id} 
                    className={`text-xs font-medium hidden sm:block transition-colors ${step === s.id ? 'text-pink-600 font-bold' : 'text-gray-400'}`}
                >
                    {s.label}
                </div>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-orange-400 to-pink-500"></div>
        
        <form onSubmit={handleSubmit} className="p-6 md:p-10">
          
          {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-center gap-2 animate-fade-in rounded-r-lg shadow-sm">
                   <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {error}
              </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-3 bg-green-50 text-green-700 border border-green-100 rounded-xl text-xs flex items-center gap-2 mb-4">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 Entrada Criptografada Ponta-a-Ponta
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.name}</label>
                <div className="relative">
                    <input 
                    type="text" name="name" placeholder="Ex: Maria Silva"
                    autoComplete="name"
                    className={getInputClass(formData.name.trim().length >= 3, formData.name)}
                    value={formData.name} onChange={handleChange}
                    />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.email}</label>
                <div className="relative">
                    <input 
                    type="email" name="email"
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-0"
                    value={formData.email} 
                    />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
               <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm mb-6 shadow-sm">
                    <p className="flex items-center gap-2 font-semibold">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        Dados Protegidos
                    </p>
                    <p className="mt-1 opacity-90">
                        Esses dados são cruciais para o cálculo da taxa metabólica basal e são criptografados.
                    </p>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.birth}</label>
                  <input 
                    type="text" 
                    placeholder="01/01/1990"
                    maxLength={10}
                    className={getInputClass(isValidAge(formData.birthDate), formData.birthDate)}
                    value={formData.birthDate} 
                    onChange={handleDateChange}
                  />
                  <p className="text-xs text-gray-400 mt-1">Ex: 12/06/1990</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.gender}</label>
                  <select 
                    name="gender"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none bg-white text-gray-900"
                    value={formData.gender} onChange={handleChange}
                  >
                    <option value="male">{text.onboarding.genderOptions.male}</option>
                    <option value="female">{text.onboarding.genderOptions.female}</option>
                    <option value="other">{text.onboarding.genderOptions.other}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.weight}</label>
                  <div className="relative">
                    <input 
                        type="number" name="weight" inputMode="decimal"
                        className={getInputClass(formData.weight > 30, formData.weight.toString())}
                        value={formData.weight} onChange={handleChange}
                    />
                    <span className="absolute right-4 top-3 text-gray-400 font-medium">kg</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.height}</label>
                  <div className="relative">
                    <input 
                        type="number" name="height" inputMode="numeric"
                        className={getInputClass(formData.height > 100, formData.height.toString())}
                        value={formData.height} onChange={handleChange}
                    />
                    <span className="absolute right-4 top-3 text-gray-400 font-medium">cm</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.country}</label>
                    <input 
                        type="text" 
                        value="Brasil" 
                        disabled 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.state}</label>
                    <div className="relative">
                        <input 
                            type="text" name="state"
                            placeholder={text.onboarding.statePlaceholder}
                            className={getInputClass(formData.state.length > 1, formData.state)}
                            value={formData.state} onChange={handleChange}
                        />
                    </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.activity}</label>
                <div className="space-y-3">
                    {[
                        { val: 'sedentary', label: text.activityLevels.sedentary },
                        { val: 'light', label: text.activityLevels.light },
                        { val: 'moderate', label: text.activityLevels.moderate },
                        { val: 'active', label: text.activityLevels.active },
                        { val: 'athlete', label: text.activityLevels.athlete },
                    ].map((opt) => (
                        <div 
                            key={opt.val} 
                            onClick={() => setFormData(prev => ({ ...prev, activityLevel: opt.val as any }))}
                            className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all group ${formData.activityLevel === opt.val ? 'border-pink-500 bg-pink-50 shadow-md' : 'border-gray-100 hover:border-pink-200 bg-white'}`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${formData.activityLevel === opt.val ? 'border-pink-600' : 'border-gray-300'}`}>
                                {formData.activityLevel === opt.val && <div className="w-2.5 h-2.5 bg-pink-600 rounded-full"></div>}
                            </div>
                            <span className={`font-medium ${formData.activityLevel === opt.val ? 'text-pink-900' : 'text-gray-700'}`}>
                                {opt.label}
                            </span>
                        </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm mb-6">
                    <p className="font-bold mb-1 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        Privacidade Clínica
                    </p>
                    <p>Estes dados são processados em servidor criptografado e isolado.</p>
               </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.medication}</label>
                <textarea 
                  name="medicalConditions"
                  placeholder={text.onboarding.medicationPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none h-32 resize-none text-sm bg-white text-gray-900"
                  value={formData.medicalConditions} onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">{text.onboarding.diet}</label>
                <textarea 
                  name="dietaryRestrictions"
                  placeholder={text.onboarding.dietPlaceholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none h-32 resize-none text-sm bg-white text-gray-900"
                  value={formData.dietaryRestrictions} onChange={handleChange}
                />
              </div>
            </div>
          )}

          {step === 5 && (
             <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">{text.onboarding.title5}</h3>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 space-y-4 text-sm">
                    <div className="flex justify-between items-start pb-2 border-b border-gray-200">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Perfil</h4>
                            <p className="font-medium text-gray-900">{formData.name}</p>
                            <p className="text-gray-600 text-xs">{formData.birthDate}</p>
                        </div>
                        <button type="button" onClick={() => jumpToStep(1)} className="text-pink-600 text-xs font-bold">Editar</button>
                    </div>
                    <div className="flex justify-between items-start pb-2 border-b border-gray-200">
                        <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dados</h4>
                            <p className="font-medium text-gray-900">{formData.weight} kg • {formData.height} cm</p>
                            <p className="text-gray-600 text-xs">{formData.state}</p>
                        </div>
                        <button type="button" onClick={() => jumpToStep(2)} className="text-pink-600 text-xs font-bold">Editar</button>
                    </div>
                </div>
             </div>
          )}

          <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep}>
                {text.onboarding.back}
              </Button>
            )}
            <Button type="submit" fullWidth isLoading={loading} className="bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg shadow-pink-200 hover:shadow-pink-300 transform hover:-translate-y-0.5 transition-all">
              {step === 5 ? text.onboarding.finish : text.onboarding.next}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};
