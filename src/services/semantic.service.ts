import { getMistralResponse } from "../config/mistral";

interface DateAnalysis {
  date: string;
  time: string;
  explanation: string;
}

class SemanticService {
  private specialtyPrompt = `En tant qu'assistant médical, analyse la spécialité médicale demandée.
Si le texte mentionne une spécialité ou un symptôme, retourne la réponse au format JSON avec deux champs :
- specialty: la spécialité médicale appropriée parmi cette liste :
  - Rheumatologist
  - Ophthalmologist
  - Cardiologist
  - General Practitioner
  - Dermatologist
  - Pediatrician
  - Neurologist
- explanation: une courte explication en français de pourquoi cette spécialité a été choisie

Exemple 1:
Message: "j'ai mal au dos"
Réponse: {
    "specialty": "Rheumatologist",
    "explanation": "Les douleurs au dos sont généralement traitées par un rhumatologue qui est spécialisé dans les problèmes musculo-squelettiques."
}

Exemple 2:
Message: "généraliste"
Réponse: {
    "specialty": "General Practitioner",
    "explanation": "Vous avez demandé explicitement un médecin généraliste."
}

Si aucune spécialité ne correspond clairement, utiliser "General Practitioner" avec une explication appropriée.`;

  private datePrompt = `En tant qu'assistant médical, analyse la date souhaitée pour un rendez-vous.
Retourne la réponse au format JSON avec les champs suivants :
- date: la date au format YYYY-MM-DD
- time: l'heure au format HH:mm (si spécifiée, sinon "09:00")
- explanation: une explication en français de l'interprétation

Règles importantes:
1. La date doit TOUJOURS être dans le futur
2. Si on dit "demain", utiliser la date de demain
3. Pour "dès que possible" ou "au plus tôt", utiliser la date de demain
4. Pour "la semaine prochaine", utiliser le lundi de la semaine prochaine
5. Pour une date relative (dans X jours), calculer la date correctement

Exemple 1:
Message: "demain"
Réponse: {
    "date": "2024-02-16",
    "time": "09:00",
    "explanation": "Rendez-vous programmé pour demain à 9h00"
}

Exemple 2:
Message: "dès que possible"
Réponse: {
    "date": "2024-02-16",
    "time": "09:00",
    "explanation": "Premier créneau disponible proposé pour demain matin"
}`;

  public async analyzeSpecialty(message: string): Promise<{
    specialty: string;
    explanation: string;
  }> {
    try {
      const response = await getMistralResponse(
        `${this.specialtyPrompt}\n\nMessage: "${message}"`
      );
      const result = JSON.parse(response.trim());
      console.log("Analyse de la spécialité:", {
        message,
        interpretation: result,
      });
      return result;
    } catch (error) {
      console.error("Erreur lors de l'analyse de la spécialité:", error);
      return {
        specialty: "General Practitioner",
        explanation:
          "Par défaut, je vous oriente vers un médecin généraliste qui pourra vous rediriger si nécessaire.",
      };
    }
  }

  public async analyzeDate(message: string): Promise<DateAnalysis> {
    try {
      const prompt = `Analyse la date dans ce message: "${message}". Réponds uniquement avec un objet JSON contenant les champs suivants:
      {
        "date": "YYYY-MM-DD", // La date au format ISO
        "time": "HH:mm", // L'heure au format 24h, par défaut "09:00" si non spécifiée
        "explanation": "string" // Une explication en français de la date et l'heure identifiées
      }`;

      const response = await getMistralResponse(prompt);
      const content = response.trim();
      try {
        // Trouver le premier objet JSON valide dans la réponse
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Aucun JSON valide trouvé dans la réponse");
        }
        const result = JSON.parse(jsonMatch[0]);
        return result;
      } catch (parseError) {
        console.error("Erreur lors du parsing JSON:", parseError);
        // Valeur par défaut en cas d'erreur
        return {
          date: "2025-02-15",
          time: "09:00",
          explanation: "Date par défaut utilisée suite à une erreur d'analyse",
        };
      }
    } catch (error) {
      console.error("Erreur lors de l'analyse de la date:", error);
      // Valeur par défaut en cas d'erreur
      return {
        date: "2025-02-15",
        time: "09:00",
        explanation: "Date par défaut utilisée suite à une erreur",
      };
    }
  }

  public async suggestBestDoctor(
    doctors: any[],
    userPreferences: string
  ): Promise<number> {
    if (!doctors || doctors.length === 0) return -1;

    const prompt = `En tant qu'assistant médical, choisis le meilleur médecin pour le patient en fonction de ses préférences.
Voici la liste des médecins disponibles :
${doctors
  .map((d) => `${d.id}. Dr. ${d.name} - ${d.specialty} à ${d.city}`)
  .join("\n")}

Préférences du patient : ${userPreferences}

Retourne UNIQUEMENT l'ID du médecin le plus approprié, rien d'autre.`;

    try {
      const response = await getMistralResponse(prompt);
      const doctorId = parseInt(response.trim());
      return isNaN(doctorId) ? doctors[0].id : doctorId;
    } catch (error) {
      console.error("Erreur lors de la suggestion du médecin:", error);
      return doctors[0].id;
    }
  }
}

export const semanticService = new SemanticService();
