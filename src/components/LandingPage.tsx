"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { HomePage } from "./HomePage";
import { AboutPage } from "./AboutPage";
import { ContactPage } from "./ContactPage";

import svgPathsHome from "../imports/svg-xk929g7nkl";
import svgPathsAbout from "../imports/svg-ltqdfmwwoe";
import svgPathsContact from "../imports/svg-lrnqheam3z";

export default function LandingPage() {
  const [currentPage, setCurrentPage] =
    useState<"home" | "about" | "contact">("home");

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-white">

      {/* 🔶 YELLOW BACKGROUND SHAPE */}
      <motion.div
        className="absolute z-0"
        animate={currentPage}
        variants={{
          home: {
            left: "calc(41.67% + 82px)",
            top: "-249px",
            width: "1464.159px",
            height: "1478.766px",
            rotate: 0,
          },

          about: {
            left: "-807.81px",
            top: "-273.61px",
            width: "1454.62px",
            height: "1456.223px",
            rotate: 0,
          },

          // ✅ CONTACT — FULL SCREEN FILL
          contact: {
            left: "-60vw",
            top: "-60vh",
            width: "220vw",
            height: "220vh",
            rotate: 0,
          },
        }}
        transition={{
          duration: 0.6,
          ease: [0.43, 0.13, 0.23, 0.96],
        }}
      >
        {currentPage === "home" && (
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1464.16 1478.77"
          >
            <path d={svgPathsHome.p2030ea00} fill="#FFCE46" />
          </svg>
        )}

        {currentPage === "about" && (
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1454.62 1456.22"
          >
            <path d={svgPathsAbout.p3894f280} fill="#FFCE46" />
          </svg>
        )}

        {currentPage === "contact" && (
          <svg
            className="block size-full"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1686.42 1687.06"
          >
            <path d={svgPathsContact.p1f53b700} fill="#FFCE46" />
          </svg>
        )}
      </motion.div>

      {/* 🔹 PAGE CONTENT */}
      <AnimatePresence mode="sync">
        {currentPage === "home" && (
          <HomePage
            key="home"
            onNavigateToAbout={() => setCurrentPage("about")}
            onNavigateToContact={() => setCurrentPage("contact")}
          />
        )}

        {currentPage === "about" && (
          <AboutPage
            key="about"
            onNavigateToHome={() => setCurrentPage("home")}
            onNavigateToContact={() => setCurrentPage("contact")}
          />
        )}

        {currentPage === "contact" && (
          <ContactPage
            key="contact"
            onNavigateToHome={() => setCurrentPage("home")}
            onNavigateToAbout={() => setCurrentPage("about")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
