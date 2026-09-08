import {
  getTeamByInviteToken,
  joinTeamViaInviteToken,
  approveTeamMember,
  rejectTeamMember,
  addExternalAllyMember,
  getDbTeamById,
  saveDbTeam
} from "../dbBridge.js";
import { Team, TeamMember } from "../types.js";
import { sendWorkflowEmail } from "./emailWorkflow.js";

export interface TeamInviteActionInput {
  token: string;
  name: string;
  email: string;
  avatar?: string;
  notifyOwner?: boolean;
}

export interface TeamMembershipDecisionInput {
  action: "approve" | "reject";
  teamId: string;
  memberId: string;
  notifyMember?: boolean;
}

/**
 * Workflow de Onboarding y Gestión de Membresías de Equipos (TeamMembershipWorkflow).
 * Orquesta la incorporación por token de invitación, cola de espera para aprobación,
 * notificaciones al propietario y sincronización de roles en la base de datos.
 */
export async function runTeamJoinWorkflow(input: TeamInviteActionInput): Promise<{
  success: boolean;
  message: string;
  pendingApproval?: boolean;
  team?: Team;
  member?: TeamMember;
}> {
  const result = await joinTeamViaInviteToken(input.token, input.name, input.email, input.avatar);

  // Si requiere aprobación y se solicitó notificación, avisar al dueño del equipo
  if (result.success && result.pendingApproval && input.notifyOwner && result.team?.ownerEmail) {
    try {
      await sendWorkflowEmail({
        type: "team_invite",
        recipient: result.team.ownerEmail,
        payload: {
          teamName: result.team.name,
          inviterName: input.name,
          customSubject: `Nueva solicitud de acceso al equipo ${result.team.name}`,
          note: `El usuario ${input.name} (${input.email}) ha solicitado unirse a tu equipo.`
        }
      });
    } catch (e) {
      console.warn("[TeamWorkflow] No se pudo enviar notificación de solicitud al dueño del equipo:", e);
    }
  }

  return result;
}

/**
 * Orquesta la resolución y decisión de solicitudes de miembros (Aprobar o Rechazar).
 */
export async function runTeamMembershipDecisionWorkflow(input: TeamMembershipDecisionInput): Promise<{
  success: boolean;
  message: string;
  team?: Team;
}> {
  const { action, teamId, memberId, notifyMember } = input;

  if (action === "approve") {
    const result = await approveTeamMember(teamId, memberId);
    if (result.success && notifyMember && result.team) {
      const approvedMember = result.team.members.find(m => m.id === memberId);
      if (approvedMember?.email) {
        try {
          await sendWorkflowEmail({
            type: "member_approved",
            recipient: approvedMember.email,
            payload: {
              teamName: result.team.name,
              customSubject: `¡Tu solicitud para unirte al equipo ${result.team.name} ha sido aprobada!`,
              note: `Ya tienes acceso activo al workspace con el rol de ${approvedMember.role}.`
            }
          });
        } catch (e) {
          console.warn("[TeamWorkflow] Error enviando email de aprobación de miembro:", e);
        }
      }
    }
    return result;
  } else {
    return await rejectTeamMember(teamId, memberId);
  }
}

/**
 * Orquesta la incorporación directa de colaboradores externos por parte de aliados estratégicos.
 */
export async function runAddExternalAllyWorkflow(
  teamId: string,
  allyId: string,
  memberData: { name: string; email: string }
): Promise<{ success: boolean; message: string; team?: Team }> {
  return await addExternalAllyMember(teamId, allyId, memberData);
}
