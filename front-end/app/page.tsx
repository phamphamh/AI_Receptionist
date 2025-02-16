"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Hero } from "@/components/hero"
import { BookingProcess } from "@/components/booking-process"

export default function Home() {
  const [showBooking, setShowBooking] = useState(false)
  const bookingRef = useRef<HTMLDivElement>(null)

  const startBooking = () => {
    setShowBooking(true)
  }

  useEffect(() => {
    if (showBooking && bookingRef.current) {
      bookingRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [showBooking])

  return (
    <main className="min-h-screen bg-[#030303]">
      <Hero onBookNowClick={startBooking} />
      <AnimatePresence>
        {showBooking && (
          <motion.div
            ref={bookingRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <BookingProcess />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

