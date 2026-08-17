import { create } from "zustand";
import { Team } from "../types";

export interface TeamState {
  teams: Team[];
  selectedTeamId: string;
  isTeamSelectorOpen: boolean;
  isCreatingNewTeam: boolean;
  newTeamName: string;

  setTeams: (teams: Team[]) => void;
  setSelectedTeamId: (id: string) => void;
  setIsTeamSelectorOpen: (open: boolean) => void;
  setIsCreatingNewTeam: (creating: boolean) => void;
  setNewTeamName: (name: string) => void;
  
  addTeam: (team: Team) => void;
  updateTeamInStore: (team: Team) => void;
  removeTeamFromStore: (id: string) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  teams: [],
  selectedTeamId: "team-default",
  isTeamSelectorOpen: false,
  isCreatingNewTeam: false,
  newTeamName: "",

  setTeams: (teams) => set({ teams }),
  setSelectedTeamId: (selectedTeamId) => set({ selectedTeamId }),
  setIsTeamSelectorOpen: (isTeamSelectorOpen) => set({ isTeamSelectorOpen }),
  setIsCreatingNewTeam: (isCreatingNewTeam) => set({ isCreatingNewTeam }),
  setNewTeamName: (newTeamName) => set({ newTeamName }),

  addTeam: (team) =>
    set((state) => ({ teams: [...state.teams, team] })),
  updateTeamInStore: (team) =>
    set((state) => ({
      teams: state.teams.map((t) => (t.id === team.id ? team : t)),
    })),
  removeTeamFromStore: (id) =>
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== id),
      selectedTeamId:
        state.selectedTeamId === id ? "team-default" : state.selectedTeamId,
    })),
}));
