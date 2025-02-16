"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  MessageSquare,
  Calendar,
  CheckCircle,
  Loader2,
  LucideIcon,
} from "lucide-react";

interface Step {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface StepProps extends Step {
  isActive: boolean;
  isCompleted: boolean;
  isProcessing: boolean;
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const steps: Step[] = [
  {
    icon: Phone,
    title: "Initiate Booking",
    description: "AI assistant understands your request",
  },
  {
    icon: MessageSquare,
    title: "Collect Information",
    description: "AI gathers necessary details",
  },
  {
    icon: Calendar,
    title: "Check Availability",
    description: "System finds available appointment slots",
  },
  {
    icon: CheckCircle,
    title: "Confirm Booking",
    description: "Appointment is confirmed and details are sent",
  },
];

export function BookingProcess() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [bookingComplete, setBookingComplete] = useState(false);

  useEffect(() => {
    if (currentStep < steps.length) {
      const timer = setTimeout(() => {
        setCurrentStep((prevStep) => {
          const nextStep = prevStep + 1;
          if (nextStep === steps.length) {
            setBookingComplete(true);
            setIsProcessing(false);
          } else {
            setIsProcessing(true);
          }
          return nextStep;
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="w-full bg-gradient-to-b from-[#030303] to-[#0a0a0a] text-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Booking Your Appointment
        </h2>
        <ProgressBar currentStep={currentStep} totalSteps={steps.length} />
        <AnimatePresence>
          {!bookingComplete ? (
            <motion.div
              className="relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {steps.map((step, index) => (
                <Step
                  key={index}
                  {...step}
                  isActive={index === currentStep}
                  isCompleted={index < currentStep}
                  isProcessing={index === currentStep && isProcessing}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                Booking Complete!
              </h2>
              <p className="text-gray-300">
                Your appointment has been successfully scheduled. Check your
                email for details.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  description,
  isActive,
  isCompleted,
  isProcessing,
}: StepProps) {
  return (
    <motion.div
      className={`flex items-start mb-8 ${
        isActive
          ? "text-blue-400"
          : isCompleted
          ? "text-green-400"
          : "text-gray-400"
      }`}
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <motion.div
          className={`rounded-full p-3 ${
            isActive
              ? "bg-blue-900"
              : isCompleted
              ? "bg-green-900"
              : "bg-gray-800"
          }`}
          initial={false}
          animate={{
            scale: isActive ? 1.2 : 1,
            transition: { duration: 0.3 },
          }}
        >
          {isProcessing ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Icon className="w-6 h-6" />
          )}
        </motion.div>
        {isCompleted && (
          <motion.div
            className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CheckCircle className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </div>
      <div className="ml-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </motion.div>
  );
}

function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <motion.div
      className="h-2 bg-gray-700 rounded-full mb-12 overflow-hidden"
      initial={{ width: 0 }}
      animate={{ width: "100%" }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
}
