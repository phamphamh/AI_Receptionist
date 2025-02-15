import { ConversationState } from "../types/conversation.types";

class ConversationService {
  private conversations: Map<string, ConversationState> = new Map();
  private readonly CONVERSATION_TIMEOUT = 2 * 60 * 1000; // 2 minutes en millisecondes

  public initializeConversation(userId: string): ConversationState {
    const state: ConversationState = {
      userId,
      step: "WELCOME",
      specialty: null,
      preferredDate: null,
      selectedDoctor: null,
      lastInteractionTime: new Date(),
    };
    this.conversations.set(userId, state);
    return state;
  }

  public getConversationState(userId: string): ConversationState | null {
    const state = this.conversations.get(userId);

    if (state) {
      // Vérifier si la conversation a expiré
      const now = new Date();
      const timeDiff = now.getTime() - state.lastInteractionTime.getTime();

      if (timeDiff > this.CONVERSATION_TIMEOUT) {
        console.log(`Conversation expirée pour l'utilisateur ${userId}`);
        this.resetConversation(userId);
        return this.initializeConversation(userId);
      }

      // Mettre à jour le temps d'interaction
      state.lastInteractionTime = now;
      this.conversations.set(userId, state);
    }

    return state;
  }

  public updateConversationState(
    userId: string,
    updates: Partial<ConversationState>
  ): void {
    const currentState = this.conversations.get(userId);
    if (currentState) {
      const updatedState = {
        ...currentState,
        ...updates,
        lastInteractionTime: new Date(),
      };
      this.conversations.set(userId, updatedState);
    }
  }

  public resetConversation(userId: string): void {
    console.log(
      `Réinitialisation de la conversation pour l'utilisateur ${userId}`
    );
    this.conversations.delete(userId);
  }

  public shouldResetConversation(messageBody: string): boolean {
    return messageBody.toLowerCase().trim() === "reset";
  }

  // Nettoyer les conversations expirées périodiquement
  public startCleanupInterval(): void {
    setInterval(() => {
      const now = new Date();
      for (const [userId, state] of this.conversations.entries()) {
        const timeDiff = now.getTime() - state.lastInteractionTime.getTime();
        if (timeDiff > this.CONVERSATION_TIMEOUT) {
          console.log(`Nettoyage de la conversation expirée pour ${userId}`);
          this.conversations.delete(userId);
        }
      }
    }, this.CONVERSATION_TIMEOUT);
  }
}

export const conversationService = new ConversationService();
conversationService.startCleanupInterval();
