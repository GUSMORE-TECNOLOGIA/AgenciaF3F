import { Button } from '@/components/ui/button'

interface PublishFlowTabsProps<T extends string> {
  tabs: Array<{ id: T; label: string }>
  activeTab: T
  onTabChange: (tab: T) => void
}

export function PublishFlowTabs<T extends string>({ tabs, activeTab, onTabChange }: PublishFlowTabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          type="button"
          size="sm"
          variant={tab.id === activeTab ? 'default' : 'outline'}
          className="text-xs"
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  )
}

