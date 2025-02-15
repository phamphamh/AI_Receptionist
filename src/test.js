const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../fake_doctors.json");

const doctorsData = JSON.parse(fs.readFileSync(filePath, "utf8"));

// Simulating Mistral's response
const mistralResponse = {
    intent: "book_appointment",
    entities: {
        doctor: "Isabelle Girard",
        date: "2023-10-03",
    },
};

function checkAvailability(doctorsData, mistralResponse) {
    const requestedDoctor = mistralResponse.entities.doctor;
    const requestedDate = mistralResponse.entities.date;

    // Find the doctor in the data
    const doctor = doctorsData.find((d) => d.name === requestedDoctor);

    if (!doctor) {
        return `${requestedDoctor} is not available in our system.`;
    }

    const availableSlots = doctor.slots.filter((slot) =>
        slot.startsWith(requestedDate)
    );

    if (availableSlots.length > 0) {
        return `Here are the available slots for ${requestedDate}: ${availableSlots.join(
            ", "
        )}`;
    } else {
        return `Sorry, there are no available slots for ${requestedDate}.`;
    }
}

console.log(checkAvailability(doctorsData, mistralResponse));
