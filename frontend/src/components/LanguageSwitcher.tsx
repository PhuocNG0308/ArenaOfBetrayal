'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  const handleChange = (newLang: 'en' | 'vi') => {
    setLanguage(newLang)
    // Force page reload to apply translations
    window.location.reload()
  }

  return (
    <div className="relative">
      <select
        value={language}
        onChange={(e) => handleChange(e.target.value as 'en' | 'vi')}
        className="appearance-none bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/30 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 text-gray-800 dark:text-white rounded-lg pl-10 pr-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        <option value="en" className="bg-white dark:bg-gray-800">🇺🇸 English</option>
        <option value="vi" className="bg-white dark:bg-gray-800">🇻🇳 Tiếng Việt</option>
      </select>
      <Globe 
        size={18} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 pointer-events-none" 
      />
    </div>
  )
}
