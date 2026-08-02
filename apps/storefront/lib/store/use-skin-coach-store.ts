import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SkinAnalysisResult } from '@/app/actions/analyze-skin'

interface SkinCoachState {
  result: SkinAnalysisResult | null;
  setResult: (result: SkinAnalysisResult) => void;
  clearResult: () => void;
}

export const useSkinCoachStore = create<SkinCoachState>()(
  persist(
    (set) => ({
      result: null,
      setResult: (result) => set({ result }),
      clearResult: () => set({ result: null }),
    }),
    {
      name: 'welfare-skin-coach-storage',
    }
  )
)
