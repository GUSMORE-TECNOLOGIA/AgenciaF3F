import { useState, useEffect } from 'react'
import type { SmartFilter, SmartFilterCondition } from '@/services/clientes'

const STORAGE_KEY = 'f3f-smart-filters-clientes'
const SAVED_FILTERS_KEY = 'f3f-smart-filters-saved-clientes'

export function useSmartFiltersClientes() {
  const [conditions, setConditions] = useState<SmartFilterCondition[]>([])
  const [savedFilters, setSavedFilters] = useState<SmartFilter[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setConditions(Array.isArray(parsed) ? parsed : [])
      }
      const saved = localStorage.getItem(SAVED_FILTERS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSavedFilters(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Erro ao carregar filtros do localStorage:', error)
    }
  }, [])

  useEffect(() => {
    if (conditions.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conditions))
      } catch (error) {
        console.error('Erro ao salvar filtros no localStorage:', error)
      }
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [conditions])

  function applyConditions(newConditions: SmartFilterCondition[]) {
    setConditions(newConditions)
  }

  function clearConditions() {
    setConditions([])
    localStorage.removeItem(STORAGE_KEY)
  }

  function saveFilter(filter: Omit<SmartFilter, 'id' | 'createdAt'>) {
    const newFilter: SmartFilter = {
      ...filter,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    }
    const updated = [...savedFilters, newFilter]
    setSavedFilters(updated)
    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Erro ao salvar filtro no localStorage:', error)
    }
  }

  function deleteFilter(filterId: string) {
    const updated = savedFilters.filter((f) => f.id !== filterId)
    setSavedFilters(updated)
    try {
      localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(updated))
    } catch (error) {
      console.error('Erro ao remover filtro do localStorage:', error)
    }
  }

  function loadFilter(filter: SmartFilter) {
    setConditions(filter.conditions)
  }

  return {
    conditions,
    savedFilters,
    applyConditions,
    clearConditions,
    saveFilter,
    deleteFilter,
    loadFilter,
  }
}
