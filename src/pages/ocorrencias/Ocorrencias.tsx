import { useState } from 'react'
import { AlertCircle, Layers, ListChecks, Bell } from 'lucide-react'
import OcorrenciasList from './components/OcorrenciasList'
import OcorrenciaGruposTab from './components/OcorrenciaGruposTab'
import OcorrenciaTiposTab from './components/OcorrenciaTiposTab'
import OcorrenciaLembretesTab from './components/OcorrenciaLembretesTab'

type TabKey = 'ocorrencias' | 'grupos' | 'tipos' | 'lembretes'

export default function Ocorrencias() {
  const [activeTab, setActiveTab] = useState<TabKey>('ocorrencias')

  const tabs = [
    { id: 'ocorrencias', label: 'Ocorrências', icon: AlertCircle },
    { id: 'grupos', label: 'Grupos', icon: Layers },
    { id: 'tipos', label: 'Tipos', icon: ListChecks },
    { id: 'lembretes', label: 'Lembretes', icon: Bell },
  ] as const

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary text-primary font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'ocorrencias' && <OcorrenciasList />}
          {activeTab === 'grupos' && <OcorrenciaGruposTab />}
          {activeTab === 'tipos' && <OcorrenciaTiposTab />}
          {activeTab === 'lembretes' && <OcorrenciaLembretesTab />}
        </div>
      </div>
    </div>
  )
}
