class DateService {
  private dayNames = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
  ];

  private relativeTerms: { [key: string]: number } = {
    "aujourd'hui": 0,
    demain: 1,
    "après-demain": 2,
  };

  private CURRENT_DATE = new Date(2025, 1, 15); // 15 février 2025

  private getCurrentDate(): Date {
    return new Date(this.CURRENT_DATE);
  }

  public parseDate(input: string): Date | null {
    console.log("Date de référence actuelle:", this.CURRENT_DATE);
    console.log("Tentative de parsing de la date:", input);
    const normalizedInput = input.toLowerCase().trim();

    // Gestion des dates ISO
    if (normalizedInput.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      try {
        const date = new Date(normalizedInput);
        if (!isNaN(date.getTime())) {
          console.log("Date ISO parsée avec succès:", date);
          return date;
        }
      } catch (error) {
        console.error("Erreur lors du parsing de la date ISO:", error);
      }
    }

    // Gestion des termes relatifs
    for (const [term, days] of Object.entries(this.relativeTerms)) {
      if (normalizedInput.includes(term)) {
        const date = this.getCurrentDate();
        date.setDate(date.getDate() + days);
        date.setHours(9, 0, 0, 0);
        console.log(`Date relative (${term}) parsée:`, date);
        return date;
      }
    }

    // Gestion des jours de la semaine
    for (let i = 0; i < this.dayNames.length; i++) {
      if (normalizedInput.includes(this.dayNames[i])) {
        const today = this.getCurrentDate();
        const currentDay = today.getDay() || 7;
        const targetDay = i + 1;
        let daysToAdd = targetDay - currentDay;

        if (normalizedInput.includes("prochain") && daysToAdd <= 0) {
          daysToAdd += 7;
        } else if (daysToAdd <= 0) {
          daysToAdd += 7;
        }

        const date = this.getCurrentDate();
        date.setDate(date.getDate() + daysToAdd);
        date.setHours(9, 0, 0, 0);
        console.log(
          `Date jour de la semaine (${this.dayNames[i]}) parsée:`,
          date
        );
        return date;
      }
    }

    // Gestion des expressions comme "dans X jours"
    const daysMatch = normalizedInput.match(/dans (\d+) jours?/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const date = this.getCurrentDate();
      date.setDate(date.getDate() + days);
      date.setHours(9, 0, 0, 0);
      console.log(`Date "dans X jours" parsée:`, date);
      return date;
    }

    // Gestion des expressions comme "la semaine prochaine"
    if (normalizedInput.includes("semaine prochaine")) {
      const date = this.getCurrentDate();
      date.setDate(date.getDate() + 7);
      date.setHours(9, 0, 0, 0);
      console.log("Date 'semaine prochaine' parsée:", date);
      return date;
    }

    // Gestion des dates au format DD/MM ou DD/MM/YYYY
    const dateMatch = normalizedInput.match(
      /(\d{1,2})[/-](\d{1,2})(?:[/-](\d{4}|\d{2}))?/
    );
    if (dateMatch) {
      const day = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]) - 1;
      const year = dateMatch[3]
        ? parseInt(dateMatch[3])
        : this.getCurrentDate().getFullYear();

      const adjustedYear = year < 100 ? 2000 + year : year;

      const date = new Date(adjustedYear, month, day, 9, 0, 0, 0);
      if (!isNaN(date.getTime())) {
        console.log("Date au format DD/MM/YYYY parsée:", date);
        return date;
      }
    }

    console.log("Aucun format de date reconnu");
    return null;
  }

  public formatDate(date: Date): string {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  }

  public isValidDate(date: Date | null): boolean {
    if (!date) {
      console.log("Date invalide: null");
      return false;
    }

    if (isNaN(date.getTime())) {
      console.log("Date invalide: NaN");
      return false;
    }

    const now = this.getCurrentDate();
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);

    const isValid = inputDate >= now;
    console.log("Validation de la date:", {
      date: inputDate,
      now: now,
      isValid: isValid,
    });

    return isValid;
  }
}

export const dateService = new DateService();
