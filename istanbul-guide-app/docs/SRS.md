# Software Requirements Specification

# Istanbul Guide Mobile Application

**Version:** 1.0
**Group:** Group 19
**Course:** Software Engineering
**University:** Istanbul Kültür University
**Instructor:** Prof. Dr. Akhan AKBULUT
**Teaching Assistant:** Büşra Kocaçınar-Öz
**Date:** 19 May 2026

---

# Team Members

| Name              | Student ID | Email                                                         |
| ----------------- | ---------- | ------------------------------------------------------------- |
| Asad Ullah Baig   | 2500009626 | [2500009626@stu.iku.edu.tr](mailto:2500009626@stu.iku.edu.tr) |
| Ammar Kaşlan      | 2200002676 | [2200002676@stu.iku.edu.tr](mailto:2200002676@stu.iku.edu.tr) |
| Batuhan Alp Ergin | 2000003655 | [2000003655@stu.iku.edu.tr](mailto:2000003655@stu.iku.edu.tr) |
| Ahmad Abbas       | 2500009628 | [2500009628@stu.iku.edu.tr](mailto:2500009628@stu.iku.edu.tr) |

---

# Table of Contents

1. Introduction
2. Requirements
3. System Architecture and Architectural Design
4. Design and Implementation
5. Supporting Information
6. Design Evolution and Improvements
7. UI Evaluation
8. Screenshots and Feature Explanation
9. Project Setup and Installation
10. References

---

# Revisions

| Version | Primary Author(s) | Description of Changes                                                                                                                                                                                                | Date Completed |
| ------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 1.0     | Project Team      | Final SRS version completed after implementation phase, including offline capability, AI integration, recommendation features, updated architecture diagrams, deployment instructions, and final design improvements. | 19/05/2026     |

---

# 1. Introduction

## 1.1 Project Purpose and Scope

The Istanbul Guide Mobile Application is a smart tourism and city exploration platform designed to help tourists and local residents discover Istanbul in a structured and user-friendly way.

The project combines:

* Interactive maps
* Tourism content
* AI-generated descriptions
* Personalized recommendations
* Offline support
* Trip planning functionality

The application evolved from a simple tourism prototype into an AI-enhanced and offline-resilient smart tourism platform.

---

## 1.2 Objectives

The main objectives of the project are:

1. Develop a functional mobile tourism guide for Istanbul.
2. Combine cultural discovery, maps, and intelligent recommendations.
3. Provide AI-generated tourism content.
4. Improve reliability through offline support and caching.
5. Support personalized exploration through favorites and trips.
6. Demonstrate software engineering principles such as modularity, maintainability, and deployment readiness.

---

## 1.3 Roles and Responsibilities

| Team Member       | Responsibilities                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Asad Ullah Baig   | Frontend UI, architecture planning, backend integration, offline implementation, API integration, testing |
| Ammar Kaşlan      | Recommendation systems, multilingual support, UX improvements                                             |
| Batuhan Alp Ergin | Tourism data management, validation, debugging                                                            |
| Ahmad Abbas       | Recommendation flow implementation and contextual navigation                                              |

---

## 1.4 Assumptions

* Users will use Android smartphones.
* Internet access may not always be available.
* GPS permissions will be enabled when needed.
* Supabase and external APIs will normally remain available.
* Cached content can be used offline.

---

## 1.5 Constraints

* The project was developed within one academic semester.
* External APIs may contain free-tier limitations.
* The current release focuses only on Istanbul.
* Offline map tiles are not fully supported.
* AI services depend on third-party providers.

---

# 2. Requirements

## 2.1 Functional Requirements

| ID   | Requirement                        | Priority |
| ---- | ---------------------------------- | -------- |
| FR1  | User authentication using Supabase | High     |
| FR2  | Persistent user sessions           | High     |
| FR3  | Guest exploration mode             | Medium   |
| FR4  | Interactive Istanbul map           | High     |
| FR5  | Landmark marker rendering          | High     |
| FR6  | Zooming and panning support        | High     |
| FR7  | GPS permission handling            | High     |
| FR8  | Nearby place detection             | High     |
| FR9  | Recenter functionality             | Medium   |
| FR10 | Landmark search                    | High     |
| FR11 | Category filtering                 | High     |
| FR12 | Landmark detail screens            | High     |
| FR13 | Tourism information display        | High     |
| FR14 | AI-generated descriptions          | High     |
| FR15 | AI fallback support                | High     |
| FR16 | Save favorite places               | High     |
| FR17 | Create trips                       | High     |
| FR18 | Add places to trips                | High     |
| FR19 | Store user trips in Supabase       | High     |
| FR20 | Local caching with AsyncStorage    | High     |
| FR21 | Offline cached favorites/trips     | High     |
| FR22 | Cached AI descriptions             | High     |
| FR23 | Network state detection            | High     |
| FR24 | Global offline banner              | High     |
| FR25 | Offline read-only mode             | High     |
| FR26 | Personalized recommendations       | Medium   |
| FR27 | Multilingual support               | Medium   |
| FR28 | Graceful failure handling          | High     |

---

## 2.2 Non-Functional Requirements

### Performance Requirements

* Map screen should load within approximately 2 seconds.
* Search results should appear within approximately 3 seconds.
* Cached content should load within approximately 1 second.
* Map interaction should remain smooth on mid-range Android devices.

### Security Requirements

* GPS permissions must be requested explicitly.
* Authentication must use Supabase Auth.
* User data must be protected by backend rules.
* API keys must not be committed publicly.

### Software Quality Attributes

| Attribute       | Description                                |
| --------------- | ------------------------------------------ |
| Reliability     | Offline caching and fallback handling      |
| Availability    | Cached content remains accessible offline  |
| Maintainability | Modular service-based architecture         |
| Usability       | Map-first interface and simplified UX      |
| Portability     | React Native + Expo cross-platform support |
| Scalability     | Extendable to more cities and features     |
| Robustness      | Graceful degradation during failures       |
| Testability     | Separation of UI, services, and hooks      |

---

# 3. System Architecture and Architectural Design

The application follows a modular client-server architecture.

The architecture contains:

* Mobile frontend layer
* API integration layer
* AI integration layer
* Cloud backend services
* Local caching layer
* Database layer

This separation improves:

* Maintainability
* Reliability
* Fault tolerance
* Scalability
* Future extensibility

---

## 3.1 Logical Architecture

**Figure 1. Logical Architecture of the Istanbul Guide Mobile Application.**

The application is divided into presentation, application logic, service, local cache, backend, and external service layers.

---

## 3.2 Deployment and Communication Architecture

**Figure 2. Deployment and Communication Architecture of the Istanbul Guide Mobile Application.**

The mobile application communicates with Supabase cloud services, local backend APIs, AI providers, and map/location services over HTTP/HTTPS connections.

---

## 3.3 Use Case Diagram

**Figure 3. Use Case Diagram of the Istanbul Guide Mobile Application.**

Users can search places, open landmarks, create trips, receive recommendations, access offline content, and use AI-generated tourism information.

---

## 3.4 Offline Architecture

**Figure 4. Offline Fallback Flow.**

The system first attempts to load live data. If internet access fails, cached data stored in AsyncStorage is used as fallback content.

---

## 3.5 AI Integration Architecture

**Figure 5. AI Integration Architecture.**

The application uses the Tourism LLM API and external AI providers to generate landmark descriptions and personalized recommendations while supporting local AI response caching.

---

# 4. Design and Implementation

## Frontend Technologies

* React Native
* Expo
* TypeScript
* React Navigation
* react-native-maps
* expo-location
* expo-network
* AsyncStorage
* react-i18next

---

## Backend and Services

* Supabase Authentication
* PostgreSQL Database
* Places API
* Overpass API
* Tourism LLM API
* AI providers
* Map and location services

---

## Database Design

Main entities:

* User
* Place
* FavoritePlace
* Trip
* TripPlace
* Review
* RecommendationProfile

The database uses relational constraints and UUID keys through Supabase PostgreSQL.

---

## Offline Architecture

The application supports offline functionality through:

* AsyncStorage caching
* Cached AI descriptions
* Offline banners
* Read-only offline mode
* Graceful fallback handling

---

## Important Modules

| Module                | Responsibility                      |
| --------------------- | ----------------------------------- |
| UI Module             | Screens, cards, forms, overlays     |
| Map Module            | Map rendering and markers           |
| Places Module         | Landmark retrieval and filtering    |
| AI Module             | AI descriptions and recommendations |
| Offline Module        | Caching and network detection       |
| Trip Module           | Trip creation and storage           |
| Favorites Module      | Save/load favorite places           |
| Recommendation Module | Personalized suggestions            |
| Localization Module   | Multilingual interface support      |

---

# 5. Supporting Information

The project includes:

* Interactive map functionality
* Offline caching support
* AI-powered tourism descriptions
* Recommendation features
* Favorites and trip planning
* Physical device testing using Expo Go

---

# 6. Design Evolution and Improvements

| Initial Design         | Final Design                     |
| ---------------------- | -------------------------------- |
| Basic tourism guide    | AI-enhanced smart tourism app    |
| Online-only assumption | Offline-capable architecture     |
| Static descriptions    | AI-generated descriptions        |
| Simple saved places    | Full trips and personalized data |
| Basic map markers      | Interactive categorized markers  |
| Limited error handling | Graceful fallback architecture   |

---

# 7. UI Evaluation

The UI evolved significantly during development.

Major improvements included:

* Simplified navigation
* Improved map marker design
* Better onboarding screens
* Enhanced profile and preferences system
* AI itinerary integration
* Modernized authentication screens

---

# 8. Screenshots and Feature Explanation

The application includes screenshots for:

* Onboarding screen
* Authentication screens
* Interactive map
* Nearby places
* Explore dashboard
* Categories screen
* Interest selection
* AI itinerary
* Saved places
* Profile screen
* Supabase database structure

---

# 9. Project Setup and Installation

## 9.1 Required Software

| Software           | Purpose                    |
| ------------------ | -------------------------- |
| Node.js            | JavaScript runtime         |
| npm                | Dependency management      |
| Git                | Repository cloning         |
| Visual Studio Code | Development environment    |
| Expo Go            | Mobile application testing |

---

## 9.2 Project Structure

```text
istanbul-guide-app-main
├── istanbul-guide-app
├── places-api
└── tourism-llm-api
```

---

## 9.3 Setup Process

### Install Mobile App Dependencies

```bash
cd istanbul-guide-app
npm install
```

### Run Places API

```bash
cd places-api
npm install
npm start
```

Runs on:

```text
http://localhost:4000
```

### Run Tourism LLM API

```bash
cd tourism-llm-api
npm install
npm start
```

Create `.env`:

```env
GOOGLE_API_KEY=your_key
GROQ_API_KEY=your_key
OPENAI_API_KEY=your_key
PORT=5000
```

Runs on:

```text
http://localhost:5000
```

### Start Mobile App

```bash
cd istanbul-guide-app
npx expo start -c
```

---

## 9.4 Physical Device Testing

1. Install Expo Go
2. Connect phone and computer to same Wi-Fi
3. Scan QR code generated by Expo

---

## 9.5 Correct Startup Order

| Terminal   | Folder             | Command           |
| ---------- | ------------------ | ----------------- |
| Terminal 1 | places-api         | npm start         |
| Terminal 2 | tourism-llm-api    | npm start         |
| Terminal 3 | istanbul-guide-app | npx expo start -c |

---

# 10. References

1. React Native Documentation
2. Expo Documentation
3. Supabase Documentation
4. Google Maps Platform Documentation
5. PostgreSQL Documentation
6. OpenStreetMap / Overpass API Documentation
7. IEEE Software Requirements Specification Standards
