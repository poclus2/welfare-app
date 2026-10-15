import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SkinAnalysisResult } from '@/app/actions/analyze-skin'
import type { FaceMap } from '@/lib/face-map'

interface SkinCoachState {
  result: SkinAnalysisResult | null;
  // front photo and face landmarks of one diagnostic (faceScanId), for the analysis filter on the result
  // page. Memory only (not persisted in the browser); when she reopens a diagnostic, they come back from
  // the server, where they are kept with her photos.
  facePhoto: string | null;
  faceMap: FaceMap | null;
  faceScanId: string | null;
  setResult: (result: SkinAnalysisResult) => void;
  setFace: (photo: string | null, map: FaceMap | null, scanId: string | null) => void;
  clearResult: () => void;
}

export const useSkinCoachStore = create<SkinCoachState>()(
  persist(
    (set) => ({
      result: null,
      facePhoto: null,
      faceMap: null,
      faceScanId: null,
      setResult: (result) => set({ result }),
      setFace: (facePhoto, faceMap, faceScanId) => set({ facePhoto, faceMap, faceScanId }),
      clearResult: () => set({ result: null, facePhoto: null, faceMap: null, faceScanId: null }),
    }),
    {
      name: 'welfare-skin-coach-storage',
      partialize: (state) => ({ result: state.result }),
    }
  )
)