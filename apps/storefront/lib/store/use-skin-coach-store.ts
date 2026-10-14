import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SkinAnalysisResult } from '@/app/actions/analyze-skin'
import type { FaceMap } from '@/lib/face-map'

interface SkinCoachState {
  result: SkinAnalysisResult | null;
  // front photo and face landmarks, for the analysis filter on the result page. Memory only (not
  // persisted): the photo never stays in the browser's storage, and is gone after a reload.
  facePhoto: string | null;
  faceMap: FaceMap | null;
  setResult: (result: SkinAnalysisResult) => void;
  setFace: (photo: string | null, map: FaceMap | null) => void;
  clearResult: () => void;
}

export const useSkinCoachStore = create<SkinCoachState>()(
  persist(
    (set) => ({
      result: null,
      facePhoto: null,
      faceMap: null,
      setResult: (result) => set({ result }),
      setFace: (facePhoto, faceMap) => set({ facePhoto, faceMap }),
      clearResult: () => set({ result: null, facePhoto: null, faceMap: null }),
    }),
    {
      name: 'welfare-skin-coach-storage',
      partialize: (state) => ({ result: state.result }),
    }
  )
)